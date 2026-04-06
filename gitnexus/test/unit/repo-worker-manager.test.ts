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
      sessionId: 'session-router',
      routerPid: 999,
    });

    const firstWorkerPromise = manager.ensureWorker(REPO);
    const secondWorkerPromise = manager.ensureWorker(REPO);
    child.emit('message', { kind: 'ready' });

    await firstWorkerPromise;
    await secondWorkerPromise;

    expect(forkWorker).toHaveBeenCalledTimes(1);
    expect(forkWorker.mock.calls[0][1]).toEqual(['mcp', '--repo-worker']);
    expect(child.send).toHaveBeenCalledWith({
      kind: 'init',
      repo: REPO,
      sessionId: 'session-router',
      routerPid: 999,
    });
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
    child.emit('message', { kind: 'ready' });
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

  it('waits for a ready message before sending worker requests', async () => {
    const child = createFakeChild();
    const manager = new RepoWorkerManager({
      cliEntry: '/tmp/fake-cli.js',
      forkWorker: vi.fn().mockReturnValue(child),
      requestTimeoutMs: 1000,
    });

    const promise = manager.call(REPO, 'queryClusters', 'repo-a', 100);

    await vi.waitFor(() => {
      expect(child.send).toHaveBeenCalledWith({
        kind: 'init',
        repo: REPO,
        sessionId: expect.any(String),
        routerPid: expect.any(Number),
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    let sentRequests = child.send.mock.calls
      .map(([message]) => message)
      .filter((message): message is WorkerRequestMessage => message?.kind === 'request');
    expect(sentRequests).toHaveLength(0);

    child.emit('message', { kind: 'ready' });

    await vi.waitFor(() => {
      sentRequests = child.send.mock.calls
        .map(([message]) => message)
        .filter((message): message is WorkerRequestMessage => message?.kind === 'request');

      expect(sentRequests).toHaveLength(1);
    });

    child.emit('message', {
      kind: 'response',
      requestId: sentRequests[0].requestId,
      ok: true,
      result: { clusters: [{ heuristicLabel: 'Auth' }] },
    });

    await expect(promise).resolves.toEqual({ clusters: [{ heuristicLabel: 'Auth' }] });
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
    child.emit('message', { kind: 'ready' });
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
    child.emit('message', { kind: 'ready' });
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

  it('retries startup when a worker exits right after ready', async () => {
    const firstChild = createFakeChild();
    const secondChild = createFakeChild();
    secondChild.pid = 5252;
    const forkWorker = vi.fn()
      .mockReturnValueOnce(firstChild)
      .mockReturnValueOnce(secondChild);
    const manager = new RepoWorkerManager({
      cliEntry: '/tmp/fake-cli.js',
      forkWorker,
      requestTimeoutMs: 1000,
    });

    const workerPromise = manager.ensureWorker(REPO);
    firstChild.emit('message', { kind: 'ready' });
    firstChild.emit('exit', 1, null);

    await vi.waitFor(() => {
      expect(forkWorker).toHaveBeenCalledTimes(2);
    });
    expect(forkWorker).toHaveBeenCalledTimes(2);

    secondChild.emit('message', { kind: 'ready' });
    const secondState = await workerPromise;
    expect(secondState.child.pid).toBe(5252);
    expect(manager.__testOnlyGetWorkerPid('repo-a')).toBe(5252);
  });

  it('disconnects workers that are still spawning and rejects their startup promises', async () => {
    const child = createFakeChild();
    const manager = new RepoWorkerManager({
      cliEntry: '/tmp/fake-cli.js',
      forkWorker: vi.fn().mockReturnValue(child),
      requestTimeoutMs: 1000,
    });

    const workerPromise = manager.ensureWorker(REPO);
    await manager.disconnect();

    expect(child.kill).toHaveBeenCalledWith('SIGTERM');

    child.emit('message', { kind: 'ready' });
    await expect(workerPromise).rejects.toThrow('disconnected');
    expect(manager.__testOnlyGetWorkerPid('repo-a')).toBeNull();
  });
});
