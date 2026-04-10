import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listRegisteredReposMock, normalizePlatformPathMock, samePlatformPathMock } = vi.hoisted(() => ({
  listRegisteredReposMock: vi.fn(),
  normalizePlatformPathMock: vi.fn((candidate: string) => candidate.toLowerCase()),
  samePlatformPathMock: vi.fn((left: string, right: string) => left.toLowerCase() === right.toLowerCase()),
}));

vi.mock('../../src/storage/repo-manager.js', () => ({
  listRegisteredRepos: listRegisteredReposMock,
}));

vi.mock('../../src/lib/path-comparison.js', () => ({
  normalizePlatformPath: normalizePlatformPathMock,
  samePlatformPath: samePlatformPathMock,
}));

vi.mock('../../src/mcp/core/kuzu-adapter.js', () => ({
  closeKuzu: vi.fn().mockResolvedValue(undefined),
  initKuzu: vi.fn().mockResolvedValue(undefined),
  isKuzuReady: vi.fn().mockReturnValue(true),
}));

import { BackendRuntime } from '../../src/mcp/local/runtime/backend-runtime.js';

describe('BackendRuntime', () => {
  beforeEach(() => {
    listRegisteredReposMock.mockReset();
    normalizePlatformPathMock.mockClear();
    samePlatformPathMock.mockClear();
  });

  it('delegates repo-id path normalization to the shared helper', async () => {
    listRegisteredReposMock.mockResolvedValue([
      {
        name: 'gitnexus',
        path: '/tmp/gitnexus-lower',
        storagePath: '/tmp/.gitnexus/gitnexus-lower',
        indexedAt: '2026-04-10T00:00:00.000Z',
        lastCommit: 'abc1234',
      },
      {
        name: 'GitNexus',
        path: '/tmp/GitNexus-upper',
        storagePath: '/tmp/.gitnexus/GitNexus-upper',
        indexedAt: '2026-04-10T00:00:00.000Z',
        lastCommit: 'def5678',
      },
    ]);

    const runtime = new BackendRuntime();
    await runtime.init();

    expect(normalizePlatformPathMock).toHaveBeenCalledWith('/tmp/gitnexus-lower');
    expect(normalizePlatformPathMock).toHaveBeenCalledWith('/tmp/GitNexus-upper');
    const ids = runtime.getRepos().map((repo) => repo.id);
    expect(ids).toContain('gitnexus');
    expect(ids.find((id) => id !== 'gitnexus')).toMatch(/^gitnexus-/);
  });

  it('keeps duplicate-name repo ids deterministic across refresh order changes', async () => {
    const lower = {
      name: 'gitnexus',
      path: '/tmp/gitnexus-lower',
      storagePath: '/tmp/.gitnexus/gitnexus-lower',
      indexedAt: '2026-04-10T00:00:00.000Z',
      lastCommit: 'abc1234',
    };
    const upper = {
      name: 'GitNexus',
      path: '/tmp/GitNexus-upper',
      storagePath: '/tmp/.gitnexus/GitNexus-upper',
      indexedAt: '2026-04-10T00:00:00.000Z',
      lastCommit: 'def5678',
    };

    listRegisteredReposMock.mockResolvedValueOnce([lower, upper]);
    const runtimeA = new BackendRuntime();
    await runtimeA.init();
    const idsA = new Map(runtimeA.getRepos().map((repo) => [repo.repoPath, repo.id]));

    listRegisteredReposMock.mockResolvedValueOnce([upper, lower]);
    const runtimeB = new BackendRuntime();
    await runtimeB.init();
    const idsB = new Map(runtimeB.getRepos().map((repo) => [repo.repoPath, repo.id]));

    expect(idsA).toEqual(idsB);
  });
});
