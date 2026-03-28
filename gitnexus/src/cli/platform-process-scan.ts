import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'child_process';

const DEFAULT_MCP_QUIESCE_TIMEOUT_MS = 15_000;
const DEFAULT_MCP_POLL_INTERVAL_MS = 250;

export interface ProcScanOptions {
  procRoot?: string;
  platform?: NodeJS.Platform;
  runLsof?: (targetPath: string) => Promise<string>;
  readPidArgv?: (pid: string) => Promise<string[]>;
}

export interface QuiesceGitNexusMcpHoldersOptions {
  findHolders?: () => Promise<string[]>;
  terminatePid?: (pid: number) => Promise<void>;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
  pollIntervalMs?: number;
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

export const quiesceGitNexusMcpHolders = async (
  targetPath: string,
  options: QuiesceGitNexusMcpHoldersOptions = {},
): Promise<{ terminatedPids: number[]; waitTimedOut: boolean }> => {
  const findHolders = options.findHolders ?? (() => listGitNexusMcpPidsHoldingPath(targetPath));
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

  const terminatedPids: number[] = [];
  for (const pid of initialHolders) {
    const pidNum = Number(pid);
    if (!Number.isInteger(pidNum)) continue;
    await terminatePid(pidNum);
    terminatedPids.push(pidNum);
  }

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const remaining = await findHolders();
    if (remaining.length === 0) {
      return { terminatedPids, waitTimedOut: false };
    }
    await delay(pollIntervalMs);
  }

  return { terminatedPids, waitTimedOut: true };
};
