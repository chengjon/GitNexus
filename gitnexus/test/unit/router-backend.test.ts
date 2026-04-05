import { describe, expect, it, vi } from 'vitest';
import { RouterBackend } from '../../src/mcp/router-backend.js';

describe('RouterBackend', () => {
  it('lists repos from the injected runtime without opening Kuzu', async () => {
    const runtime = {
      init: vi.fn().mockResolvedValue(true),
      refreshRepos: vi.fn().mockResolvedValue(undefined),
      getRepos: vi.fn().mockReturnValue([
        {
          name: 'repo-a',
          repoPath: '/tmp/repo-a',
          storagePath: '/tmp/.gitnexus/repo-a',
          kuzuPath: '/tmp/.gitnexus/repo-a/kuzu',
          indexedAt: '2026-04-04T00:00:00.000Z',
          lastCommit: 'abc1234',
        },
      ]),
      resolveRepo: vi.fn(),
      getContext: vi.fn().mockReturnValue(null),
      disconnect: vi.fn().mockResolvedValue(undefined),
    } as any;

    const backend = new RouterBackend({ runtime, workerManager: {} as any });

    const repos = await backend.listRepos();

    expect(repos).toHaveLength(1);
    expect(runtime.refreshRepos).toHaveBeenCalledTimes(1);
    expect(runtime.getRepos).toHaveBeenCalledTimes(1);
  });

  it('forwards repo-scoped tool calls through the worker manager', async () => {
    const resolvedRepo = {
      id: 'repo-a',
      name: 'repo-a',
      repoPath: '/tmp/repo-a',
      storagePath: '/tmp/.gitnexus/repo-a',
      kuzuPath: '/tmp/.gitnexus/repo-a/kuzu',
      indexedAt: '2026-04-04T00:00:00.000Z',
      lastCommit: 'abc1234',
    };
    const runtime = {
      init: vi.fn().mockResolvedValue(true),
      refreshRepos: vi.fn().mockResolvedValue(undefined),
      getRepos: vi.fn().mockReturnValue([resolvedRepo]),
      resolveRepo: vi.fn().mockResolvedValue(resolvedRepo),
      getContext: vi.fn().mockReturnValue(null),
      disconnect: vi.fn().mockResolvedValue(undefined),
    } as any;
    const workerManager = {
      call: vi.fn().mockResolvedValue({
        status: 'found',
        symbol: { name: 'login' },
      }),
      disconnect: vi.fn().mockResolvedValue(undefined),
    };

    const backend = new RouterBackend({ runtime, workerManager });
    const result = await backend.callTool('context', { name: 'login' });

    expect(runtime.resolveRepo).toHaveBeenCalledWith(undefined);
    expect(workerManager.call).toHaveBeenCalledWith(
      resolvedRepo,
      'callTool',
      'context',
      { name: 'login' },
    );
    expect(result).toEqual({
      status: 'found',
      symbol: { name: 'login' },
    });
  });

  it('forwards resource queries through the worker manager with a resolved repo', async () => {
    const resolvedRepo = {
      id: 'repo-a',
      name: 'repo-a',
      repoPath: '/tmp/repo-a',
      storagePath: '/tmp/.gitnexus/repo-a',
      kuzuPath: '/tmp/.gitnexus/repo-a/kuzu',
      indexedAt: '2026-04-04T00:00:00.000Z',
      lastCommit: 'abc1234',
    };
    const runtime = {
      init: vi.fn().mockResolvedValue(true),
      refreshRepos: vi.fn().mockResolvedValue(undefined),
      getRepos: vi.fn().mockReturnValue([resolvedRepo]),
      resolveRepo: vi.fn().mockResolvedValue(resolvedRepo),
      getContext: vi.fn().mockReturnValue(null),
      disconnect: vi.fn().mockResolvedValue(undefined),
    } as any;
    const workerManager = {
      call: vi.fn()
        .mockResolvedValueOnce({ clusters: [{ heuristicLabel: 'Authentication' }] })
        .mockResolvedValueOnce({ processes: [{ heuristicLabel: 'User Login' }] })
        .mockResolvedValueOnce({ cluster: { heuristicLabel: 'Authentication' }, members: [] })
        .mockResolvedValueOnce({ process: { heuristicLabel: 'User Login' }, steps: [] }),
      disconnect: vi.fn().mockResolvedValue(undefined),
    };

    const backend = new RouterBackend({ runtime, workerManager });

    await expect(backend.queryClusters('repo-a', 100)).resolves.toEqual({
      clusters: [{ heuristicLabel: 'Authentication' }],
    });
    await expect(backend.queryProcesses('repo-a', 50)).resolves.toEqual({
      processes: [{ heuristicLabel: 'User Login' }],
    });
    await expect(backend.queryClusterDetail('Authentication', 'repo-a')).resolves.toEqual({
      cluster: { heuristicLabel: 'Authentication' },
      members: [],
    });
    await expect(backend.queryProcessDetail('User Login', 'repo-a')).resolves.toEqual({
      process: { heuristicLabel: 'User Login' },
      steps: [],
    });

    expect(workerManager.call.mock.calls).toEqual([
      [resolvedRepo, 'queryClusters', 'repo-a', 100],
      [resolvedRepo, 'queryProcesses', 'repo-a', 50],
      [resolvedRepo, 'queryClusterDetail', 'Authentication', 'repo-a'],
      [resolvedRepo, 'queryProcessDetail', 'User Login', 'repo-a'],
    ]);
  });
});
