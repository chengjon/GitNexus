import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  cleanupMcpProcessRegistry,
  createMcpSessionId,
  deriveMcpProcessHealth,
  getMcpProcessRecordPath,
  listMcpProcessRecords,
  writeMcpProcessRecord,
  type McpProcessRecord,
} from '../../src/runtime/mcp-process-registry.js';

describe('mcp-process-registry', () => {
  const cleanupDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(cleanupDirs.splice(0).map(async (dir) => {
      await fs.rm(dir, { recursive: true, force: true });
    }));
  });

  it('creates session ids with pid and random suffix', () => {
    const sessionId = createMcpSessionId(4242, () => Buffer.from('0011223344556677', 'hex'));
    expect(sessionId).toBe('session-4242-0011223344556677');
  });

  it('writes and lists per-process registry records', async () => {
    const runtimeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gitnexus-mcp-runtime-'));
    cleanupDirs.push(runtimeDir);

    const record: McpProcessRecord = {
      pid: 12345,
      ppid: 123,
      role: 'router',
      sessionId: 'session-12345-abcd',
      startedAt: '2026-04-05T00:00:00.000Z',
      lastHeartbeatAt: '2026-04-05T00:00:00.000Z',
      cwd: '/tmp/project',
      command: 'gitnexus mcp',
      state: 'ready',
    };

    await writeMcpProcessRecord(record, { runtimeDir });

    expect(getMcpProcessRecordPath(12345, runtimeDir)).toContain(path.join('mcp-processes', '12345.json'));

    const records = await listMcpProcessRecords({ runtimeDir });
    expect(records).toEqual([record]);
  });

  it('derives orphaned and stale health from liveness checks', () => {
    const now = new Date('2026-04-05T00:01:00.000Z');

    const orphanedWorker: McpProcessRecord = {
      pid: 200,
      ppid: 100,
      role: 'repo-worker',
      sessionId: 'session-1',
      startedAt: '2026-04-05T00:00:00.000Z',
      lastHeartbeatAt: '2026-04-05T00:00:50.000Z',
      lastActivityAt: '2026-04-05T00:00:50.000Z',
      cwd: '/tmp/repo',
      command: 'gitnexus mcp --repo-worker',
      state: 'ready',
      repoId: 'repo-a',
      repoName: 'repo-a',
      repoPath: '/tmp/repo',
      storagePath: '/tmp/repo/.gitnexus',
      routerPid: 100,
    };

    expect(deriveMcpProcessHealth(orphanedWorker, {
      now,
      isPidAlive: (pid) => pid === 200,
      staleThresholdMs: 60_000,
      idleThresholdMs: 120_000,
    })).toBe('orphaned');

    const staleRouter: McpProcessRecord = {
      pid: 300,
      ppid: 1,
      role: 'router',
      sessionId: 'session-2',
      startedAt: '2026-04-05T00:00:00.000Z',
      lastHeartbeatAt: '2026-04-05T00:00:10.000Z',
      cwd: '/tmp/project',
      command: 'gitnexus mcp',
      state: 'ready',
    };

    expect(deriveMcpProcessHealth(staleRouter, {
      now,
      isPidAlive: () => false,
      staleThresholdMs: 60_000,
      idleThresholdMs: 120_000,
    })).toBe('stale');
  });

  it('cleans stale records and terminates orphaned workers', async () => {
    const runtimeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gitnexus-mcp-gc-'));
    cleanupDirs.push(runtimeDir);

    const staleRecord: McpProcessRecord = {
      pid: 501,
      ppid: 1,
      role: 'router',
      sessionId: 'session-stale',
      startedAt: '2026-04-05T00:00:00.000Z',
      lastHeartbeatAt: '2026-04-05T00:00:00.000Z',
      cwd: '/tmp/project',
      command: 'gitnexus mcp',
      state: 'ready',
    };
    const orphanedWorker: McpProcessRecord = {
      pid: 502,
      ppid: 1,
      role: 'repo-worker',
      sessionId: 'session-worker',
      startedAt: '2026-04-05T00:00:00.000Z',
      lastHeartbeatAt: '2026-04-05T00:00:55.000Z',
      lastActivityAt: '2026-04-05T00:00:55.000Z',
      cwd: '/tmp/repo',
      command: 'gitnexus mcp --repo-worker',
      state: 'ready',
      repoId: 'repo-a',
      repoName: 'repo-a',
      repoPath: '/tmp/repo',
      storagePath: '/tmp/repo/.gitnexus',
      routerPid: 777,
    };

    await writeMcpProcessRecord(staleRecord, { runtimeDir });
    await writeMcpProcessRecord(orphanedWorker, { runtimeDir });

    const terminated: number[] = [];
    const result = await cleanupMcpProcessRegistry({
      runtimeDir,
      now: new Date('2026-04-05T00:01:00.000Z'),
      isPidAlive: (pid) => pid === 502,
      terminatePid: async (pid) => {
        terminated.push(pid);
      },
    });

    expect(result.removedStalePids).toEqual([501]);
    expect(result.terminatedOrphanedPids).toEqual([502]);
    expect(terminated).toEqual([502]);
  });
});
