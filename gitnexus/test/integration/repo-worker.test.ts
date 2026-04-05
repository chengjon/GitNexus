import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fork, type ChildProcess } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { withTestKuzuDB } from '../helpers/test-indexed-db.js';
import { LOCAL_BACKEND_FTS_INDEXES, LOCAL_BACKEND_SEED_DATA } from '../fixtures/local-backend-seed.js';
import type {
  WorkerBootstrapMessage,
  WorkerReadyMessage,
  WorkerRequestMessage,
  WorkerResponseMessage,
} from '../../src/mcp/repo-worker-protocol.js';
import type { RepoHandle } from '../../src/mcp/local/runtime/types.js';
import { listMcpProcessRecords } from '../../src/runtime/mcp-process-registry.js';

const activeChildren = new Set<ChildProcess>();

async function stopChild(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.killed) {
    return;
  }

  await new Promise<void>((resolve) => {
    const finish = () => resolve();
    child.once('exit', finish);
    child.kill('SIGTERM');
    setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 1000).unref();
  });
}

function waitForWorkerResponse(
  child: ChildProcess,
  requestId: string,
  timeoutMs = 5000,
): Promise<WorkerResponseMessage> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for worker response ${requestId}`));
    }, timeoutMs);

    const onMessage = (message: unknown) => {
      if (!message || typeof message !== 'object') {
        return;
      }

      const candidate = message as Partial<WorkerResponseMessage>;
      if (candidate.kind !== 'response' || candidate.requestId !== requestId) {
        return;
      }

      cleanup();
      resolve(candidate as WorkerResponseMessage);
    };

    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
      cleanup();
      reject(new Error(`Worker exited before responding (code=${code ?? 'null'}, signal=${signal ?? 'null'})`));
    };

    const cleanup = () => {
      clearTimeout(timer);
      child.off('message', onMessage);
      child.off('exit', onExit);
    };

    child.on('message', onMessage);
    child.on('exit', onExit);
  });
}

function waitForWorkerReady(
  child: ChildProcess,
  timeoutMs = 5000,
): Promise<WorkerReadyMessage> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for worker ready message'));
    }, timeoutMs);

    const onMessage = (message: unknown) => {
      if (!message || typeof message !== 'object') {
        return;
      }

      const candidate = message as Partial<WorkerReadyMessage>;
      if (candidate.kind !== 'ready') {
        return;
      }

      cleanup();
      resolve(candidate as WorkerReadyMessage);
    };

    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
      cleanup();
      reject(new Error(`Worker exited before ready (code=${code ?? 'null'}, signal=${signal ?? 'null'})`));
    };

    const cleanup = () => {
      clearTimeout(timer);
      child.off('message', onMessage);
      child.off('exit', onExit);
    };

    child.on('message', onMessage);
    child.on('exit', onExit);
  });
}

afterEach(async () => {
  await Promise.all([...activeChildren].map(async (child) => {
    await stopChild(child);
    activeChildren.delete(child);
  }));
});

function waitForWorkerExit(
  child: ChildProcess,
  timeoutMs = 5000,
): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for worker exit'));
    }, timeoutMs);

    const onExit = (code: number | null, signal: NodeJS.Signals | null) => {
      cleanup();
      resolve({ code, signal });
    };

    const cleanup = () => {
      clearTimeout(timer);
      child.off('exit', onExit);
    };

    child.on('exit', onExit);
  });
}

withTestKuzuDB('repo-worker', (handle) => {
  describe('hidden repo worker mode', () => {
    it('serves callTool requests after a bootstrap init message', async () => {
      const repoPath = path.join(handle.tmpHandle.dbPath, 'repo');
      const workerKuzuPath = path.join(handle.tmpHandle.dbPath, 'worker-kuzu');
      await fs.mkdir(path.join(repoPath, 'src'), { recursive: true });
      await fs.cp(handle.dbPath, workerKuzuPath, { recursive: true });
      await fs.writeFile(
        path.join(repoPath, 'src', 'auth.ts'),
        'function login() { return validate(); }\nfunction validate() { return true; }\n',
        'utf-8',
      );

      const repo: RepoHandle = {
        id: handle.repoId,
        name: 'test-repo',
        repoPath,
        storagePath: handle.tmpHandle.dbPath,
        kuzuPath: workerKuzuPath,
        indexedAt: new Date().toISOString(),
        lastCommit: 'abc1234',
        stats: { files: 2, nodes: 3, communities: 1, processes: 1 },
      };

      const cliEntry = fileURLToPath(new URL('../../dist/cli/index.js', import.meta.url));
      const child = fork(cliEntry, ['mcp', '--repo-worker'], {
        cwd: fileURLToPath(new URL('../..', import.meta.url)),
        execArgv: [],
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      });
      activeChildren.add(child);

      const initMessage: WorkerBootstrapMessage = {
        kind: 'init',
        repo,
        routerPid: process.pid,
        sessionId: 'session-test-router',
      };
      child.send(initMessage);
      await waitForWorkerReady(child);

      const requestMessage: WorkerRequestMessage = {
        kind: 'request',
        requestId: 'req-1',
        method: 'callTool',
        args: ['context', { name: 'login' }],
      };
      const responsePromise = waitForWorkerResponse(child, requestMessage.requestId);
      child.send(requestMessage);

      const response = await responsePromise;
      if (!response.ok) {
        throw new Error(response.error);
      }
      expect(response.ok).toBe(true);
      expect((response as Extract<WorkerResponseMessage, { ok: true }>).result).toMatchObject({
        status: 'found',
        symbol: {
          name: 'login',
        },
      });
    });

    it('self-terminates when the owning router pid disappears', async () => {
      const repoPath = path.join(handle.tmpHandle.dbPath, 'repo-owner-loss');
      const workerKuzuPath = path.join(handle.tmpHandle.dbPath, 'worker-kuzu-owner-loss');
      await fs.mkdir(path.join(repoPath, 'src'), { recursive: true });
      await fs.cp(handle.dbPath, workerKuzuPath, { recursive: true });

      const repo: RepoHandle = {
        id: `${handle.repoId}-owner-loss`,
        name: 'test-repo-owner-loss',
        repoPath,
        storagePath: handle.tmpHandle.dbPath,
        kuzuPath: workerKuzuPath,
        indexedAt: new Date().toISOString(),
        lastCommit: 'owner-loss',
        stats: { files: 1, nodes: 1, communities: 1, processes: 1 },
      };

      const cliEntry = fileURLToPath(new URL('../../dist/cli/index.js', import.meta.url));
      const child = fork(cliEntry, ['mcp', '--repo-worker'], {
        cwd: fileURLToPath(new URL('../..', import.meta.url)),
        env: {
          ...process.env,
          GITNEXUS_MCP_HEARTBEAT_INTERVAL_MS: '25',
        },
        execArgv: [],
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      });
      activeChildren.add(child);

      const initMessage: WorkerBootstrapMessage = {
        kind: 'init',
        repo,
        routerPid: 2147483647,
        sessionId: 'session-dead-router',
      };
      child.send(initMessage);
      await waitForWorkerReady(child);

      const exitResult = await waitForWorkerExit(child, 2000);
      activeChildren.delete(child);

      expect(exitResult.code).toBe(0);
      expect(exitResult.signal).toBeNull();
    });

    it('publishes and removes registry records in a configured runtime dir', async () => {
      const repoPath = path.join(handle.tmpHandle.dbPath, 'repo-runtime-dir');
      const workerKuzuPath = path.join(handle.tmpHandle.dbPath, 'worker-kuzu-runtime-dir');
      const runtimeDir = path.join(handle.tmpHandle.dbPath, `runtime-${Date.now()}`);
      await fs.mkdir(path.join(repoPath, 'src'), { recursive: true });
      await fs.cp(handle.dbPath, workerKuzuPath, { recursive: true });

      const repo: RepoHandle = {
        id: `${handle.repoId}-runtime-dir`,
        name: 'test-repo-runtime-dir',
        repoPath,
        storagePath: handle.tmpHandle.dbPath,
        kuzuPath: workerKuzuPath,
        indexedAt: new Date().toISOString(),
        lastCommit: 'runtime-dir',
        stats: { files: 1, nodes: 1, communities: 1, processes: 1 },
      };

      const cliEntry = fileURLToPath(new URL('../../dist/cli/index.js', import.meta.url));
      const child = fork(cliEntry, ['mcp', '--repo-worker'], {
        cwd: fileURLToPath(new URL('../..', import.meta.url)),
        env: {
          ...process.env,
          GITNEXUS_RUNTIME_DIR: runtimeDir,
          GITNEXUS_MCP_HEARTBEAT_INTERVAL_MS: '25',
        },
        execArgv: [],
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      });
      activeChildren.add(child);

      child.send({
        kind: 'init',
        repo,
        routerPid: process.pid,
        sessionId: 'session-runtime-dir',
      } satisfies WorkerBootstrapMessage);
      await waitForWorkerReady(child);

      await vi.waitFor(async () => {
        const records = await listMcpProcessRecords({ runtimeDir });
        expect(records).toEqual([
          expect.objectContaining({
            pid: child.pid,
            role: 'repo-worker',
            sessionId: 'session-runtime-dir',
            repoId: repo.id,
            repoName: repo.name,
            repoPath: repo.repoPath,
            storagePath: repo.storagePath,
            routerPid: process.pid,
            state: 'ready',
          }),
        ]);
      });

      await stopChild(child);
      activeChildren.delete(child);

      await vi.waitFor(async () => {
        expect(await listMcpProcessRecords({ runtimeDir })).toEqual([]);
      });
    });

    it('cooperatively drains on SIGUSR1 and exits', async () => {
      const repoPath = path.join(handle.tmpHandle.dbPath, 'repo-drain');
      const workerKuzuPath = path.join(handle.tmpHandle.dbPath, 'worker-kuzu-drain');
      await fs.mkdir(path.join(repoPath, 'src'), { recursive: true });
      await fs.cp(handle.dbPath, workerKuzuPath, { recursive: true });

      const repo: RepoHandle = {
        id: `${handle.repoId}-drain`,
        name: 'test-repo-drain',
        repoPath,
        storagePath: handle.tmpHandle.dbPath,
        kuzuPath: workerKuzuPath,
        indexedAt: new Date().toISOString(),
        lastCommit: 'drain',
        stats: { files: 1, nodes: 1, communities: 1, processes: 1 },
      };

      const cliEntry = fileURLToPath(new URL('../../dist/cli/index.js', import.meta.url));
      const child = fork(cliEntry, ['mcp', '--repo-worker'], {
        cwd: fileURLToPath(new URL('../..', import.meta.url)),
        env: {
          ...process.env,
          GITNEXUS_RUNTIME_DIR: path.join(handle.tmpHandle.dbPath, `drain-runtime-${Date.now()}`),
        },
        execArgv: [],
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      });
      activeChildren.add(child);

      child.send({
        kind: 'init',
        repo,
        routerPid: process.pid,
        sessionId: 'session-drain',
      } satisfies WorkerBootstrapMessage);
      await waitForWorkerReady(child);

      process.kill(child.pid!, 'SIGUSR1');
      const exitResult = await waitForWorkerExit(child, 2000);
      activeChildren.delete(child);

      expect(exitResult.code).toBe(0);
      expect(exitResult.signal).toBeNull();
    });
  });
}, {
  seed: LOCAL_BACKEND_SEED_DATA,
  ftsIndexes: LOCAL_BACKEND_FTS_INDEXES,
  timeout: 20000,
});
