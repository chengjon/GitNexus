import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'child_process';
import {
  deriveMcpProcessHealth,
  listMcpProcessRecords,
  type McpProcessHealth,
  type McpProcessRecord,
  type McpProcessRole,
  type McpProcessState,
} from '../runtime/mcp-process-registry.js';
import { getDefaultMcpProcessTimingConfig } from '../runtime/mcp-process-config.js';

const DEFAULT_MCP_QUIESCE_TIMEOUT_MS = 15_000;
const DEFAULT_MCP_POLL_INTERVAL_MS = 250;

export interface ProcScanOptions {
  procRoot?: string;
  platform?: NodeJS.Platform;
  runLsof?: (targetPath: string) => Promise<string>;
  readPidArgv?: (pid: string) => Promise<string[]>;
}

export interface QuiesceGitNexusMcpHoldersOptions {
  drainGitNexusMcpPids?: (holderPids: string[]) => Promise<DrainGitNexusMcpPidsResult>;
  findHolders?: () => Promise<string[]>;
  terminatePid?: (pid: number) => Promise<void>;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

export interface QuiesceGitNexusMcpHoldersResult {
  drainedPids?: number[];
  terminatedPids: number[];
  waitTimedOut: boolean;
}

export interface DrainGitNexusMcpPidsOptions {
  ackTimeoutMs?: number;
  completionTimeoutMs?: number;
  isPidAlive?: (pid: number) => boolean;
  listRecords?: () => Promise<McpProcessRecord[]>;
  requestDrainPid?: (pid: number) => Promise<void>;
  sleep?: (ms: number) => Promise<void>;
}

export interface DrainGitNexusMcpRepoWorkersOptions extends DrainGitNexusMcpPidsOptions {
  repo: string;
}

export interface DrainGitNexusMcpPidsResult {
  requestedPids: number[];
  acknowledgedPids: number[];
  completedPids: number[];
  waitTimedOut: boolean;
}

export interface DescribeGitNexusMcpHolderPidsOptions {
  isPidAlive?: (pid: number) => boolean;
  listRecords?: () => Promise<McpProcessRecord[]>;
  now?: Date;
}

export interface GitNexusMcpHolderDetail {
  health: McpProcessHealth | 'unregistered';
  pid: number;
  repoName?: string;
  role?: McpProcessRole;
  sessionId?: string;
  state?: McpProcessState;
}

const parseProcCmdline = (raw: string): string[] =>
  raw.split('\0').filter(Boolean);

const isGitNexusMcpCommand = (argv: string[]): boolean =>
  argv.includes('mcp') && argv.some(arg => arg.includes('gitnexus'));

const execFileText = (command: string, args: string[]): Promise<string> =>
  new Promise((resolve, reject) => {
    execFile(command, args, { encoding: 'utf8' }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });

const defaultRunLsof = (targetPath: string): Promise<string> =>
  execFileText('lsof', ['-Fpn', '--', targetPath]);

const defaultReadPidArgv = async (pid: string): Promise<string[]> => {
  const output = await execFileText('ps', ['-p', pid, '-o', 'command=']);
  return output.trim().split(/\s+/).filter(Boolean);
};

const parseLsofPidOutput = (raw: string): string[] => {
  const holderPids = new Set<string>();
  for (const line of raw.split('\n')) {
    if (!line.startsWith('p')) continue;
    const pid = line.slice(1).trim();
    if (/^\d+$/.test(pid)) {
      holderPids.add(pid);
    }
  }
  return [...holderPids].sort((left, right) => Number(left) - Number(right));
};

export const listGitNexusMcpPidsHoldingPath = async (
  targetPath: string,
  options: ProcScanOptions = {},
): Promise<string[]> => {
  const platform = options.platform ?? process.platform;
  const procRoot = options.procRoot ?? '/proc';
  if (!options.procRoot && platform !== 'linux') {
    try {
      const runLsof = options.runLsof ?? defaultRunLsof;
      const readPidArgv = options.readPidArgv ?? defaultReadPidArgv;
      const output = await runLsof(targetPath);
      const pids = parseLsofPidOutput(output);
      const holderPids: string[] = [];
      for (const pid of pids) {
        try {
          const argv = await readPidArgv(pid);
          if (isGitNexusMcpCommand(argv)) {
            holderPids.push(pid);
          }
        } catch {
          // process may disappear while scanning; ignore
        }
      }
      holderPids.sort((left, right) => Number(left) - Number(right));
      return holderPids;
    } catch {
      return [];
    }
  }

  const normalizedTarget = path.resolve(targetPath);
  const holderPids: string[] = [];

  let entries: string[] = [];
  try {
    entries = await fs.readdir(procRoot);
  } catch {
    return [];
  }

  for (const entry of entries) {
    if (!/^\d+$/.test(entry)) continue;

    const pidDir = path.join(procRoot, entry);
    let argv: string[];
    try {
      const rawCmdline = await fs.readFile(path.join(pidDir, 'cmdline'), 'utf8');
      argv = parseProcCmdline(rawCmdline);
    } catch {
      continue;
    }

    if (!isGitNexusMcpCommand(argv)) continue;

    let fdEntries: string[] = [];
    try {
      fdEntries = await fs.readdir(path.join(pidDir, 'fd'));
    } catch {
      continue;
    }

    for (const fdEntry of fdEntries) {
      try {
        const linkTarget = await fs.readlink(path.join(pidDir, 'fd', fdEntry));
        if (path.resolve(linkTarget) === normalizedTarget) {
          holderPids.push(entry);
          break;
        }
      } catch {
        // fd may disappear while scanning; ignore
      }
    }
  }

  holderPids.sort((left, right) => Number(left) - Number(right));
  return holderPids;
};

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

const isPidAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err: any) {
    if (err?.code === 'ESRCH') {
      return false;
    }
    return true;
  }
};

const requestDrainPid = async (pid: number): Promise<void> => {
  try {
    process.kill(pid, 'SIGUSR1');
  } catch (err: any) {
    if (err?.code !== 'ESRCH') {
      throw err;
    }
  }
};

const normalizePidList = (pids: Iterable<number | string>): number[] => [...new Set(
  [...pids]
    .map(pid => Number(pid))
    .filter(pid => Number.isInteger(pid)),
)].sort((left, right) => left - right);

export const describeGitNexusMcpHolderPids = async (
  holderPids: string[],
  options: DescribeGitNexusMcpHolderPidsOptions = {},
): Promise<GitNexusMcpHolderDetail[]> => {
  const records = await (options.listRecords ?? listMcpProcessRecords)();
  const recordByPid = new Map(records.map((record) => [record.pid, record]));

  return holderPids
    .map((pidText) => Number(pidText))
    .filter((pid) => Number.isInteger(pid))
    .map((pid) => {
      const record = recordByPid.get(pid);
      if (!record) {
        return {
          pid,
          health: 'unregistered' as const,
        };
      }

      return {
        pid,
        role: record.role,
        repoName: record.repoName,
        sessionId: record.sessionId,
        state: record.state,
        health: deriveMcpProcessHealth(record, {
          isPidAlive: options.isPidAlive,
          now: options.now,
        }),
      };
    });
};

export const formatGitNexusMcpHolderDetails = (
  details: GitNexusMcpHolderDetail[],
): string => details
  .map((detail) => {
    if (!detail.role) {
      return `${detail.pid}:unregistered`;
    }

    return [
      detail.pid,
      detail.role,
      detail.repoName ?? '-',
      detail.health,
      detail.state ?? '-',
      detail.sessionId ?? '-',
    ].join(':');
  })
  .join(', ');

export const drainGitNexusMcpPids = async (
  holderPids: Iterable<number | string>,
  options: DrainGitNexusMcpPidsOptions = {},
): Promise<DrainGitNexusMcpPidsResult> => {
  const requestedPids = normalizePidList(holderPids);
  if (requestedPids.length === 0) {
    return {
      requestedPids: [],
      acknowledgedPids: [],
      completedPids: [],
      waitTimedOut: false,
    };
  }

  const timing = getDefaultMcpProcessTimingConfig();
  const listRecords = options.listRecords ?? listMcpProcessRecords;
  const delay = options.sleep ?? sleep;
  const checkPidAlive = options.isPidAlive ?? isPidAlive;
  const askPidToDrain = options.requestDrainPid ?? requestDrainPid;
  const ackTimeoutMs = options.ackTimeoutMs ?? timing.drainAckTimeoutMs;
  const completionTimeoutMs = options.completionTimeoutMs ?? timing.drainCompletionTimeoutMs;
  const acknowledgedPids = new Set<number>();
  const completedPids = new Set<number>();

  const refreshDrainState = async () => {
    const records = await listRecords();
    const recordsByPid = new Map(records.map(record => [record.pid, record]));

    for (const pid of requestedPids) {
      if (completedPids.has(pid)) {
        continue;
      }

      const alive = checkPidAlive(pid);
      const record = recordsByPid.get(pid);
      if (record?.state === 'draining' || record?.state === 'stopping' || !alive) {
        acknowledgedPids.add(pid);
      }

      if (!alive) {
        completedPids.add(pid);
      }
    }
  };

  for (const pid of requestedPids) {
    await askPidToDrain(pid);
  }

  await refreshDrainState();

  const ackDeadline = Date.now() + ackTimeoutMs;
  while (acknowledgedPids.size < requestedPids.length && Date.now() < ackDeadline) {
    await delay(DEFAULT_MCP_POLL_INTERVAL_MS);
    await refreshDrainState();
  }

  const completionDeadline = Date.now() + completionTimeoutMs;
  while (completedPids.size < requestedPids.length && Date.now() < completionDeadline) {
    await delay(DEFAULT_MCP_POLL_INTERVAL_MS);
    await refreshDrainState();
  }

  return {
    requestedPids,
    acknowledgedPids: [...acknowledgedPids].sort((left, right) => left - right),
    completedPids: [...completedPids].sort((left, right) => left - right),
    waitTimedOut: completedPids.size < requestedPids.length,
  };
};

export const drainGitNexusMcpRepoWorkers = async (
  options: DrainGitNexusMcpRepoWorkersOptions,
): Promise<DrainGitNexusMcpPidsResult> => {
  const { repo, listRecords = listMcpProcessRecords, ...drainOptions } = options;
  const normalizedRepoPath = path.isAbsolute(repo) ? path.resolve(repo) : null;
  const records = await listRecords();
  const matchingWorkerPids = records
    .filter(record => record.role === 'repo-worker')
    .filter((record) => (
      record.repoName === repo
      || record.repoId === repo
      || (normalizedRepoPath !== null && record.repoPath && path.resolve(record.repoPath) === normalizedRepoPath)
    ))
    .map(record => record.pid);

  return drainGitNexusMcpPids(matchingWorkerPids, {
    ...drainOptions,
    listRecords,
  });
};

export const quiesceGitNexusMcpHolders = async (
  targetPath: string,
  options: QuiesceGitNexusMcpHoldersOptions = {},
): Promise<QuiesceGitNexusMcpHoldersResult> => {
  const findHolders = options.findHolders ?? (() => listGitNexusMcpPidsHoldingPath(targetPath));
  const drainHolderPids = options.drainGitNexusMcpPids ?? (async (holderPids) => {
    const holderPidSet = new Set(normalizePidList(holderPids));
    const records = await listMcpProcessRecords();
    const drainablePids = records
      .filter(record => record.role === 'repo-worker' && holderPidSet.has(record.pid))
      .map(record => record.pid);

    return drainGitNexusMcpPids(drainablePids, {
      listRecords: listMcpProcessRecords,
    });
  });
  const terminatePid = options.terminatePid ?? (async (pid: number) => {
    try {
      process.kill(pid, 'SIGTERM');
    } catch (err: any) {
      if (err?.code !== 'ESRCH') throw err;
    }
  });
  const delay = options.sleep ?? sleep;
  const timeoutMs = options.timeoutMs ?? DEFAULT_MCP_QUIESCE_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_MCP_POLL_INTERVAL_MS;

  const initialHolders = await findHolders();
  if (initialHolders.length === 0) {
    return { terminatedPids: [], waitTimedOut: false };
  }

  const drainResult = await drainHolderPids(initialHolders);
  const remainingAfterDrain = drainResult.requestedPids.length > 0
    ? await findHolders()
    : initialHolders;
  const drainedPids = drainResult.completedPids.length > 0
    ? { drainedPids: drainResult.completedPids }
    : {};
  if (remainingAfterDrain.length === 0) {
    return {
      ...drainedPids,
      terminatedPids: [],
      waitTimedOut: false,
    };
  }

  const terminatedPids: number[] = [];
  for (const pid of remainingAfterDrain) {
    const pidNum = Number(pid);
    if (!Number.isInteger(pidNum)) continue;
    await terminatePid(pidNum);
    terminatedPids.push(pidNum);
  }

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const remaining = await findHolders();
    if (remaining.length === 0) {
      return {
        ...drainedPids,
        terminatedPids,
        waitTimedOut: false,
      };
    }
    await delay(pollIntervalMs);
  }

  return {
    ...drainedPids,
    terminatedPids,
    waitTimedOut: true,
  };
};
