import fs from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import {
  DEFAULT_MCP_HEARTBEAT_INTERVAL_MS,
  DEFAULT_MCP_IDLE_THRESHOLD_MS,
  DEFAULT_MCP_STALE_THRESHOLD_MS,
} from './mcp-process-config.js';
import { getGlobalDir } from '../storage/repo-manager.js';

export type McpProcessRole = 'repo-worker' | 'router';
export type McpProcessState = 'draining' | 'ready' | 'starting' | 'stopping';
export type McpProcessHealth = 'healthy' | 'idle' | 'orphaned' | 'stale' | 'suspect';
export type McpProcessCommandKind = 'drain';

export interface McpProcessRecord {
  pid: number;
  ppid: number;
  role: McpProcessRole;
  sessionId: string;
  startedAt: string;
  lastHeartbeatAt: string;
  cwd: string;
  command: string;
  state: McpProcessState;
  lastActivityAt?: string;
  repoId?: string;
  repoName?: string;
  repoPath?: string;
  routerPid?: number;
  storagePath?: string;
}

export interface McpProcessCommand {
  command: McpProcessCommandKind;
  pid: number;
  requestedAt: string;
  requestedByPid?: number;
  sessionId: string;
}

interface McpProcessRegistryPathOptions {
  runtimeDir?: string;
}

export interface McpProcessCommandPathOptions extends McpProcessRegistryPathOptions {
  storagePath?: string;
}

export interface ListMcpProcessRecordsOptions extends McpProcessRegistryPathOptions {}

export interface WriteMcpProcessRecordOptions extends McpProcessRegistryPathOptions {}
export interface WriteMcpProcessCommandOptions extends McpProcessCommandPathOptions {}

export interface CleanupMcpProcessRegistryOptions extends McpProcessRegistryPathOptions {
  dryRun?: boolean;
  force?: boolean;
  idleThresholdMs?: number;
  isPidAlive?: (pid: number) => boolean;
  now?: Date;
  staleThresholdMs?: number;
  terminatePid?: (pid: number) => Promise<void>;
}

export interface CleanupMcpProcessRegistryResult {
  removedStalePids: number[];
  terminatedOrphanedPids: number[];
  terminatedSuspectPids: number[];
}

export interface DeriveMcpProcessHealthOptions {
  idleThresholdMs?: number;
  isPidAlive?: (pid: number) => boolean;
  now?: Date;
  staleThresholdMs?: number;
}

type McpProcessRecordPatch = Partial<Omit<McpProcessRecord, 'pid' | 'ppid' | 'role' | 'sessionId' | 'startedAt'>>;

export interface CreateMcpProcessRegistrationOptions extends Omit<McpProcessRecord, 'lastHeartbeatAt' | 'startedAt'>, McpProcessRegistryPathOptions {
  heartbeatIntervalMs?: number;
  now?: () => Date;
}

export interface McpProcessRegistration {
  heartbeat: (patch?: McpProcessRecordPatch) => Promise<void>;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  updateState: (state: McpProcessState, patch?: McpProcessRecordPatch) => Promise<void>;
}

const getDefaultRuntimeDir = (): string =>
  process.env.GITNEXUS_RUNTIME_DIR
    ? path.resolve(process.env.GITNEXUS_RUNTIME_DIR)
    : path.join(getGlobalDir(), 'runtime');

const getMcpProcessDirectory = (runtimeDir?: string): string =>
  path.join(runtimeDir ?? getDefaultRuntimeDir(), 'mcp-processes');

const getMcpProcessCommandDirectory = (options: McpProcessCommandPathOptions = {}): string => (
  options.storagePath
    ? path.join(path.resolve(options.storagePath), 'mcp-commands')
    : path.join(options.runtimeDir ?? getDefaultRuntimeDir(), 'mcp-commands')
);

export const getMcpProcessRecordPath = (pid: number, runtimeDir?: string): string =>
  path.join(getMcpProcessDirectory(runtimeDir), `${pid}.json`);

export const getMcpProcessCommandPath = (
  pid: number,
  sessionId: string,
  options: McpProcessCommandPathOptions = {},
): string => path.join(
  getMcpProcessCommandDirectory(options),
  `${pid}.${encodeURIComponent(sessionId)}.json`,
);

const isMcpProcessRole = (value: unknown): value is McpProcessRole =>
  value === 'router' || value === 'repo-worker';

const isMcpProcessState = (value: unknown): value is McpProcessState =>
  value === 'starting' || value === 'ready' || value === 'draining' || value === 'stopping';

const isInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value);

const isMcpProcessCommandKind = (value: unknown): value is McpProcessCommandKind =>
  value === 'drain';

const parseMcpProcessRecord = (value: unknown): McpProcessRecord | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<McpProcessRecord>;
  if (
    !isInteger(candidate.pid)
    || !isInteger(candidate.ppid)
    || !isMcpProcessRole(candidate.role)
    || typeof candidate.sessionId !== 'string'
    || typeof candidate.startedAt !== 'string'
    || typeof candidate.lastHeartbeatAt !== 'string'
    || typeof candidate.cwd !== 'string'
    || typeof candidate.command !== 'string'
    || !isMcpProcessState(candidate.state)
  ) {
    return null;
  }

  return candidate as McpProcessRecord;
};

const parseMcpProcessCommand = (value: unknown): McpProcessCommand | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Partial<McpProcessCommand>;
  if (
    !isMcpProcessCommandKind(candidate.command)
    || !isInteger(candidate.pid)
    || typeof candidate.requestedAt !== 'string'
    || typeof candidate.sessionId !== 'string'
  ) {
    return null;
  }

  if (candidate.requestedByPid !== undefined && !isInteger(candidate.requestedByPid)) {
    return null;
  }

  return candidate as McpProcessCommand;
};

const defaultIsPidAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error: any) {
    if (error?.code === 'ESRCH') {
      return false;
    }
    return true;
  }
};

const defaultTerminatePid = async (pid: number): Promise<void> => {
  try {
    process.kill(pid, 'SIGTERM');
  } catch (error: any) {
    if (error?.code !== 'ESRCH') {
      throw error;
    }
  }
};

const toJson = (record: McpProcessRecord): string =>
  JSON.stringify(record, null, 2);

const toCommandJson = (command: McpProcessCommand): string =>
  JSON.stringify(command, null, 2);

const getIsoTimestamp = (value: Date): string =>
  value.toISOString();

export const createMcpSessionId = (
  pid: number,
  randomBytesFn: (size: number) => Buffer = randomBytes,
): string => `session-${pid}-${randomBytesFn(8).toString('hex')}`;

export const writeMcpProcessRecord = async (
  record: McpProcessRecord,
  options: WriteMcpProcessRecordOptions = {},
): Promise<void> => {
  const directory = getMcpProcessDirectory(options.runtimeDir);
  const recordPath = getMcpProcessRecordPath(record.pid, options.runtimeDir);
  const tempPath = `${recordPath}.${process.pid}.${Date.now()}.tmp`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(tempPath, toJson(record), 'utf8');
  try {
    await fs.rename(tempPath, recordPath);
  } catch (error) {
    await fs.rm(tempPath, { force: true });
    throw error;
  }
};

export const writeMcpProcessCommand = async (
  command: McpProcessCommand,
  options: WriteMcpProcessCommandOptions = {},
): Promise<void> => {
  const directory = getMcpProcessCommandDirectory(options);
  const commandPath = getMcpProcessCommandPath(command.pid, command.sessionId, options);
  const tempPath = `${commandPath}.${process.pid}.${Date.now()}.tmp`;

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(tempPath, toCommandJson(command), 'utf8');
  try {
    await fs.rename(tempPath, commandPath);
  } catch (error) {
    await fs.rm(tempPath, { force: true });
    throw error;
  }
};

export const removeMcpProcessRecord = async (
  pid: number,
  options: McpProcessRegistryPathOptions = {},
): Promise<void> => {
  await fs.rm(getMcpProcessRecordPath(pid, options.runtimeDir), { force: true });
};

export const removeMcpProcessCommand = async (
  pid: number,
  sessionId: string,
  options: McpProcessCommandPathOptions = {},
): Promise<void> => {
  await fs.rm(getMcpProcessCommandPath(pid, sessionId, options), { force: true });
};

export const listMcpProcessRecords = async (
  options: ListMcpProcessRecordsOptions = {},
): Promise<McpProcessRecord[]> => {
  let entryNames: string[] = [];
  try {
    entryNames = await fs.readdir(getMcpProcessDirectory(options.runtimeDir));
  } catch {
    return [];
  }

  const records = await Promise.all(entryNames
    .filter((entryName) => entryName.endsWith('.json'))
    .map(async (entryName) => {
      try {
        const raw = await fs.readFile(
          path.join(getMcpProcessDirectory(options.runtimeDir), entryName),
          'utf8',
        );
        return parseMcpProcessRecord(JSON.parse(raw));
      } catch {
        return null;
      }
    }));

  return records
    .filter((record): record is McpProcessRecord => record !== null)
    .sort((left, right) => left.pid - right.pid);
};

export const readMcpProcessCommand = async (
  pid: number,
  sessionId: string,
  options: McpProcessCommandPathOptions = {},
): Promise<McpProcessCommand | null> => {
  try {
    const raw = await fs.readFile(getMcpProcessCommandPath(pid, sessionId, options), 'utf8');
    return parseMcpProcessCommand(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const deriveMcpProcessHealth = (
  record: McpProcessRecord,
  options: DeriveMcpProcessHealthOptions = {},
): McpProcessHealth => {
  const now = options.now ?? new Date();
  const isPidAlive = options.isPidAlive ?? defaultIsPidAlive;
  const staleThresholdMs = options.staleThresholdMs ?? DEFAULT_MCP_STALE_THRESHOLD_MS;
  const idleThresholdMs = options.idleThresholdMs ?? DEFAULT_MCP_IDLE_THRESHOLD_MS;
  const heartbeatAgeMs = now.getTime() - Date.parse(record.lastHeartbeatAt);
  const hasFreshHeartbeat = Number.isFinite(heartbeatAgeMs) && heartbeatAgeMs <= staleThresholdMs;

  if (!isPidAlive(record.pid)) {
    return hasFreshHeartbeat ? 'suspect' : 'stale';
  }

  if (
    record.role === 'repo-worker'
    && isInteger(record.routerPid)
    && !isPidAlive(record.routerPid)
  ) {
    return 'orphaned';
  }

  if (!Number.isFinite(heartbeatAgeMs) || heartbeatAgeMs > staleThresholdMs) {
    return 'suspect';
  }

  if (record.role === 'repo-worker' && typeof record.lastActivityAt === 'string') {
    const lastActivityAgeMs = now.getTime() - Date.parse(record.lastActivityAt);
    if (Number.isFinite(lastActivityAgeMs) && lastActivityAgeMs > idleThresholdMs) {
      return 'idle';
    }
  }

  return 'healthy';
};

export const cleanupMcpProcessRegistry = async (
  options: CleanupMcpProcessRegistryOptions = {},
): Promise<CleanupMcpProcessRegistryResult> => {
  const dryRun = options.dryRun ?? false;
  const force = options.force ?? false;
  const terminatePid = options.terminatePid ?? defaultTerminatePid;
  const records = await listMcpProcessRecords({ runtimeDir: options.runtimeDir });
  const removedStalePids: number[] = [];
  const terminatedOrphanedPids: number[] = [];
  const terminatedSuspectPids: number[] = [];

  for (const record of records) {
    const health = deriveMcpProcessHealth(record, {
      idleThresholdMs: options.idleThresholdMs,
      isPidAlive: options.isPidAlive,
      now: options.now,
      staleThresholdMs: options.staleThresholdMs,
    });

    if (health === 'stale') {
      removedStalePids.push(record.pid);
      if (!dryRun) {
        await removeMcpProcessRecord(record.pid, { runtimeDir: options.runtimeDir });
      }
      continue;
    }

    if (health === 'orphaned' || (force && health === 'suspect')) {
      if (health === 'orphaned') {
        terminatedOrphanedPids.push(record.pid);
      } else {
        terminatedSuspectPids.push(record.pid);
      }

      if (!dryRun) {
        await terminatePid(record.pid);
      }
    }
  }

  return {
    removedStalePids,
    terminatedOrphanedPids,
    terminatedSuspectPids,
  };
};

export const createMcpProcessRegistration = (
  options: CreateMcpProcessRegistrationOptions,
): McpProcessRegistration => {
  const now = options.now ?? (() => new Date());
  const heartbeatIntervalMs = options.heartbeatIntervalMs ?? DEFAULT_MCP_HEARTBEAT_INTERVAL_MS;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let started = false;
  let currentRecord: McpProcessRecord = {
    ...options,
    startedAt: '',
    lastHeartbeatAt: '',
  };

  const persist = async () => {
    await writeMcpProcessRecord(currentRecord, { runtimeDir: options.runtimeDir });
  };

  const touch = async (patch: McpProcessRecordPatch = {}) => {
    currentRecord = {
      ...currentRecord,
      ...patch,
      lastHeartbeatAt: getIsoTimestamp(now()),
    };
    await persist();
  };

  return {
    heartbeat: async (patch = {}) => {
      if (!started) {
        return;
      }
      await touch(patch);
    },
    start: async () => {
      if (started) {
        return;
      }
      const timestamp = getIsoTimestamp(now());
      currentRecord = {
        ...currentRecord,
        startedAt: timestamp,
        lastHeartbeatAt: timestamp,
      };
      await persist();
      heartbeatTimer = setInterval(() => {
        void touch();
      }, heartbeatIntervalMs);
      heartbeatTimer.unref?.();
      started = true;
    },
    stop: async () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      started = false;
      await removeMcpProcessRecord(currentRecord.pid, { runtimeDir: options.runtimeDir });
    },
    updateState: async (state, patch = {}) => {
      if (!started) {
        return;
      }
      await touch({
        ...patch,
        state,
      });
    },
  };
};
