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

export const mcpCommand = async (options?: { repoWorker?: boolean }) => {
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

  if (options?.repoWorker) {
    await startRepoWorkerProcess();
    return;
  }

  // Initialize the stdio router backend from the global registry.
  // Repo-scoped work is delegated to per-repo worker processes.
  const backend = new RouterBackend({
    runtime: new BackendRuntime(),
    workerManager: new RepoWorkerManager(),
  });
  await backend.init();

  const repos = await backend.listRepos();
  if (repos.length === 0) {
    console.error('GitNexus: No indexed repos yet. Run `gitnexus analyze` in a git repo — the server will pick it up automatically.');
  } else {
    console.error(`GitNexus: MCP server starting with ${repos.length} repo(s): ${repos.map(r => r.name).join(', ')}`);
  }

  // Start MCP server (serves all repos, discovers new ones lazily)
  await startMCPServer(backend);
};
