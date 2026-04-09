import { beforeEach, describe, expect, it, vi } from 'vitest';

const { normalizePlatformPathMock } = vi.hoisted(() => ({
  normalizePlatformPathMock: vi.fn((candidate: string) => candidate.toLowerCase()),
}));

vi.mock('../../src/lib/path-comparison.js', () => ({
  normalizePlatformPath: normalizePlatformPathMock,
}));

import { PinnedRepoRuntime } from '../../src/mcp/local/runtime/pinned-repo-runtime.js';

describe('PinnedRepoRuntime', () => {
  const repo = {
    id: 'repo-a',
    name: 'RepoA',
    repoPath: '/tmp/repo-a',
    storagePath: '/tmp/.gitnexus/repo-a',
    kuzuPath: '/tmp/.gitnexus/repo-a/kuzu',
    indexedAt: '2026-04-09T00:00:00.000Z',
    lastCommit: 'abc1234',
    stats: {
      files: 10,
      nodes: 20,
      communities: 3,
      processes: 4,
    },
  };

  beforeEach(() => {
    normalizePlatformPathMock.mockClear();
  });

  it('delegates repo-path normalization to the shared helper when resolving by path', async () => {
    const runtime = new PinnedRepoRuntime(repo);

    await expect(runtime.resolveRepo('/TMP/REPO-A')).resolves.toBe(repo);

    expect(normalizePlatformPathMock).toHaveBeenCalledTimes(2);
    expect(normalizePlatformPathMock).toHaveBeenNthCalledWith(1, '/TMP/REPO-A');
    expect(normalizePlatformPathMock).toHaveBeenNthCalledWith(2, '/tmp/repo-a');
  });

  it('throws when the requested repo does not match the pinned repo', async () => {
    const runtime = new PinnedRepoRuntime(repo);

    await expect(runtime.resolveRepo('/tmp/other-repo'))
      .rejects.toThrow('Repository "/tmp/other-repo" not available in repo worker for "RepoA"');
  });
});
