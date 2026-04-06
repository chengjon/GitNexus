/**
 * MCP Command
 *
 * Starts the MCP server in standalone mode.
 * Loads all indexed repos from the global registry.
 * No longer depends on cwd — works from any directory.
 */

import { startMCPServer } from '../mcp/server.js';
import { BackendRuntime } from '../mcp/local/runtime/backend-runtime.js';
import { RepoWorkerManager } from '../mcp/repo-worker-manager.js';
import { RouterBackend } from '../mcp/router-backend.js';
import { startRepoWorkerProcess } from '../mcp/repo-worker.js';
import { nativeRuntimeManager } from '../runtime/native-runtime-manager.js';
import { drainGitNexusMcpRepoWorkers } from './platform-process-scan.js';
import {
  cleanupMcpProcessRegistry,
  createMcpProcessRegistration,
  createMcpSessionId,
  deriveMcpProcessHealth,
  listMcpProcessRecords,
} from '../runtime/mcp-process-registry.js';

export interface McpCommandOptions {
  repoWorker?: boolean;
}

export interface McpPsCommandOptions {
  json?: boolean;
}

export interface McpGcCommandOptions {
  dryRun?: boolean;
  force?: boolean;
  json?: boolean;
}

export interface McpDrainCommandOptions {
  json?: boolean;
  repo: string;
}

const getCommandLine = (): string =>
  process.argv.slice(1).join(' ').trim();

const formatIsoAgeSeconds = (isoTimestamp?: string): number | null => {
  if (!isoTimestamp) {
    return null;
  }

  const ageMs = Date.now() - Date.parse(isoTimestamp);
  return Number.isFinite(ageMs) ? Math.max(0, Math.round(ageMs / 1000)) : null;
};

export const mcpPsCommand = async (options: McpPsCommandOptions = {}): Promise<void> => {
  const rows = (await listMcpProcessRecords()).map((record) => ({
    ...record,
    health: deriveMcpProcessHealth(record),
    heartbeatAgeSec: formatIsoAgeSeconds(record.lastHeartbeatAt),
  }));

  if (options.json) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  if (rows.length === 0) {
    console.log('No GitNexus MCP processes are registered.');
    return;
  }

  console.table(rows.map((row) => ({
    pid: row.pid,
    role: row.role,
    state: row.state,
    health: row.health,
    sessionId: row.sessionId,
    repo: row.repoName ?? '-',
    heartbeatAgeSec: row.heartbeatAgeSec ?? '-',
  })));
};

export const mcpGcCommand = async (options: McpGcCommandOptions = {}): Promise<void> => {
  const result = await cleanupMcpProcessRegistry({
    dryRun: options.dryRun ?? false,
    force: options.force ?? false,
  });
  const suspectCount = result.terminatedSuspectPids?.length ?? 0;

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const prefix = options.dryRun ? 'Would clean' : 'Cleaned';
  console.log(
    `${prefix} stale=${result.removedStalePids.length}, `
      + `orphaned=${result.terminatedOrphanedPids.length}, `
      + `suspect=${suspectCount}`,
  );
};

export const mcpDrainCommand = async (options: McpDrainCommandOptions): Promise<void> => {
  const result = await drainGitNexusMcpRepoWorkers({
    repo: options.repo,
  });

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(
    `Drain requested for ${options.repo}: `
      + `requested=${result.requestedPids.length}, `
      + `acknowledged=${result.acknowledgedPids.length}, `
      + `completed=${result.completedPids.length}, `
      + `timedOut=${result.waitTimedOut}`,
  );
};

export const mcpCommand = async (options: McpCommandOptions = {}) => {
  // Prevent unhandled errors from crashing the MCP server process.
  // KuzuDB lock conflicts and transient errors should degrade gracefully.
  process.on('uncaughtException', (err) => {
    console.error(`GitNexus MCP: uncaught exception — ${err.message}`);
    // Process is in an undefined state after uncaughtException — exit after flushing
    nativeRuntimeManager.scheduleExit(1, { delayMs: 100 });
  });
  process.on('unhandledRejection', (reason) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    console.error(`GitNexus MCP: unhandled rejection — ${msg}`);
  });

  if (options.repoWorker) {
    await startRepoWorkerProcess();
    return;
  }

  const sessionId = createMcpSessionId(process.pid);
  const registration = createMcpProcessRegistration({
    pid: process.pid,
    ppid: process.ppid,
    role: 'router',
    sessionId,
    cwd: process.cwd(),
    command: getCommandLine(),
    state: 'starting',
  });

  let stopped = false;
  const stopRegistration = async () => {
    if (stopped) {
      return;
    }
    stopped = true;
    await registration.stop();
  };

  process.once('SIGINT', () => {
    void stopRegistration();
  });
  process.once('SIGTERM', () => {
    void stopRegistration();
  });
  process.once('beforeExit', () => {
    void stopRegistration();
  });

  await registration.start();

  try {
    // Initialize the stdio router backend from the global registry.
    // Repo-scoped work is delegated to per-repo worker processes.
    const backend = new RouterBackend({
      runtime: new BackendRuntime(),
      workerManager: new RepoWorkerManager({
        routerPid: process.pid,
        sessionId,
      }),
    });
    await backend.init();
    await registration.updateState('ready');

    const repos = await backend.listRepos();
    if (repos.length === 0) {
      console.error('GitNexus: No indexed repos yet. Run `gitnexus analyze` in a git repo — the server will pick it up automatically.');
    } else {
      console.error(`GitNexus: MCP server starting with ${repos.length} repo(s): ${repos.map((repo) => repo.name).join(', ')}`);
    }

    // Start MCP server (serves all repos, discovers new ones lazily)
    await startMCPServer(backend);
  } catch (error) {
    await stopRegistration();
    throw error;
  }
};
