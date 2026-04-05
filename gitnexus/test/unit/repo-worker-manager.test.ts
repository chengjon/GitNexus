import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RepoWorkerManager } from '../../src/mcp/repo-worker-manager.js';
import type { RepoHandle } from '../../src/mcp/local/runtime/types.js';
import type { WorkerRequestMessage } from '../../src/mcp/repo-worker-protocol.js';

const REPO: RepoHandle = {
  id: 'repo-a',
  name: 'repo-a',
  repoPath: '/tmp/repo-a',
  storagePath: '/tmp/.gitnexus/repo-a',
  kuzuPath: '/tmp/.gitnexus/repo-a/kuzu',
  indexedAt: '2026-04-04T00:00:00.000Z',
  lastCommit: 'abc1234',
};

class FakeChildProcess extends EventEmitter {
  pid = 4242;
  connected = true;
  send = vi.fn((_message: unknown) => true);
  kill = vi.fn((_signal?: NodeJS.Signals | number) => true);
}

function createFakeChild(): FakeChildProcess {
  return new FakeChildProcess();
}

describe('RepoWorkerManager', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('spawns gitnexus mcp --repo-worker only once per repo id', async () => {
    const child = createFakeChild();
    const forkWorker = vi.fn().mockReturnValue(child);
    const manager = new RepoWorkerManager({
      cliEntry: '/tmp/fake-cli.js',
      forkWorker,
      requestTimeoutMs: 1000,
    });

    await manager.ensureWorker(REPO);
    await manager.ensureWorker(REPO);

    expect(forkWorker).toHaveBeenCalledTimes(1);
    expect(forkWorker.mock.calls[0][1]).toEqual(['mcp', '--repo-worker']);
    expect(child.send).toHaveBeenCalledWith({ kind: 'init', repo: REPO });
  });

  it('correlates out-of-order responses by requestId', async () => {
    const child = createFakeChild();
    const manager = new RepoWorkerManager({
      cliEntry: '/tmp/fake-cli.js',
      forkWorker: vi.fn().mockReturnValue(child),
      requestTimeoutMs: 1000,
    });

    const firstPromise = manager.call(REPO, 'queryClusters', 'repo-a', 100);
    const secondPromise = manager.call(REPO, 'queryProcesses', 'repo-a', 50);
    await vi.waitFor(() => {
      const sentRequests = child.send.mock.calls
        .map(([message]) => message)
        .filter((message): message is WorkerRequestMessage => message?.kind === 'request');

      expect(sentRequests).toHaveLength(2);
    });

    const sentRequests = child.send.mock.calls
      .map(([message]) => message)
      .filter((message): message is WorkerRequestMessage => message?.kind === 'request');

    child.emit('message', {
      kind: 'response',
      requestId: sentRequests[1].requestId,
      ok: true,
      result: { processes: [{ heuristicLabel: 'LoginFlow' }] },
    });
    child.emit('message', {
      kind: 'response',
      requestId: sentRequests[0].requestId,
      ok: true,
      result: { clusters: [{ heuristicLabel: 'Auth' }] },
    });

    await expect(firstPromise).resolves.toEqual({ clusters: [{ heuristicLabel: 'Auth' }] });
    await expect(secondPromise).resolves.toEqual({ processes: [{ heuristicLabel: 'LoginFlow' }] });
  });

  it('rejects requests that exceed the timeout', async () => {
    vi.useFakeTimers();

    const child = createFakeChild();
    const manager = new RepoWorkerManager({
      cliEntry: '/tmp/fake-cli.js',
      forkWorker: vi.fn().mockReturnValue(child),
      requestTimeoutMs: 250,
    });

    const promise = manager.call(REPO, 'queryClusters', 'repo-a', 100);
    const assertion = expect(promise).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(250);

    await assertion;
  });

  it('rejects in-flight requests if the worker exits', async () => {
    const child = createFakeChild();
    const manager = new RepoWorkerManager({
      cliEntry: '/tmp/fake-cli.js',
      forkWorker: vi.fn().mockReturnValue(child),
      requestTimeoutMs: 1000,
    });

    const promise = manager.call(REPO, 'queryClusters', 'repo-a', 100);
    await vi.waitFor(() => {
      const sentRequests = child.send.mock.calls
        .map(([message]) => message)
        .filter((message): message is WorkerRequestMessage => message?.kind === 'request');

      expect(sentRequests).toHaveLength(1);
    });
    child.emit('exit', 1, null);

    const error = await promise.catch((err) => err as Error);
    expect(error.message).toContain('repo-a');
    expect(error.message).toContain('exited');
  });
});
