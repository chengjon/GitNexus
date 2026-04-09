import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const { samePlatformPathMock } = vi.hoisted(() => ({
  samePlatformPathMock: vi.fn((left: string, right: string) => left.toLowerCase() === right.toLowerCase()),
}));

vi.mock('../../src/lib/path-comparison.js', () => ({
  samePlatformPath: samePlatformPathMock,
}));

import {
  drainGitNexusMcpRepoWorkers,
  listGitNexusMcpPidsHoldingPath,
} from '../../src/cli/platform-process-scan.js';

describe('platform-process-scan path comparison', () => {
  beforeEach(() => {
    samePlatformPathMock.mockClear();
  });

  it('uses shared path comparison when matching registered repo-worker kuzu holders', async () => {
    const procRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'gitnexus-proc-empty-'));
    const targetPath = '/TMP/EXAMPLE/.GITNEXUS/REPO-A/KUZU';

    try {
      await expect(listGitNexusMcpPidsHoldingPath(targetPath, {
        procRoot,
        listRecords: async () => [
          {
            pid: 101,
            ppid: 1,
            role: 'repo-worker',
            sessionId: 'session-101',
            startedAt: '2026-04-05T00:00:00.000Z',
            lastHeartbeatAt: '2026-04-05T00:00:50.000Z',
            lastActivityAt: '2026-04-05T00:00:50.000Z',
            cwd: '/tmp/repo-a',
            command: 'gitnexus mcp --repo-worker',
            state: 'ready',
            repoId: 'repo-a',
            repoName: 'repo-a',
            repoPath: '/tmp/repo-a',
            storagePath: '/tmp/example/.gitnexus/repo-a',
            routerPid: 999,
          },
        ],
        isPidAlive: () => false,
        now: new Date('2026-04-05T00:00:55.000Z'),
      })).resolves.toEqual(['101']);

      expect(samePlatformPathMock).toHaveBeenCalled();
    } finally {
      await fs.rm(procRoot, { recursive: true, force: true });
    }
  });

  it('uses shared path comparison when draining repo workers by absolute repo path', async () => {
    let listCount = 0;
    const requested: number[] = [];
    const readyRecord = {
      pid: 101,
      ppid: 1,
      role: 'repo-worker' as const,
      sessionId: 'session-101',
      startedAt: '2026-04-05T00:00:00.000Z',
      lastHeartbeatAt: '2026-04-05T00:00:10.000Z',
      cwd: '/tmp/repo-a',
      command: 'gitnexus mcp --repo-worker',
      state: 'ready' as const,
      repoId: 'repo-a',
      repoName: 'repo-a',
      repoPath: '/tmp/repo-a',
      storagePath: '/tmp/.gitnexus/repo-a',
      routerPid: 999,
    };
    const drainingRecord = {
      ...readyRecord,
      state: 'draining' as const,
    };

    const result = await drainGitNexusMcpRepoWorkers({
      repo: '/TMP/REPO-A',
      listRecords: async () => {
        listCount += 1;
        if (listCount === 1) return [readyRecord];
        if (listCount === 2) return [drainingRecord];
        return [];
      },
      isPidAlive: () => listCount < 3,
      requestDrainPid: async (pid) => { requested.push(pid); },
      sleep: async () => {},
      ackTimeoutMs: 20,
      completionTimeoutMs: 20,
    });

    expect(samePlatformPathMock).toHaveBeenCalled();
    expect(requested).toEqual([101]);
    expect(result).toEqual({
      requestedPids: [101],
      acknowledgedPids: [101],
      completedPids: [101],
      waitTimedOut: false,
    });
  });
});
