import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fork, type ChildProcess } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { withTestKuzuDB } from '../helpers/test-indexed-db.js';
import { LOCAL_BACKEND_FTS_INDEXES, LOCAL_BACKEND_SEED_DATA } from '../fixtures/local-backend-seed.js';
import type {
  WorkerBootstrapMessage,
  WorkerRequestMessage,
  WorkerResponseMessage,
} from '../../src/mcp/repo-worker-protocol.js';
import type { RepoHandle } from '../../src/mcp/local/runtime/types.js';

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

afterEach(async () => {
  await Promise.all([...activeChildren].map(async (child) => {
    await stopChild(child);
    activeChildren.delete(child);
  }));
});

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
      };
      child.send(initMessage);

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
  });
}, {
  seed: LOCAL_BACKEND_SEED_DATA,
  ftsIndexes: LOCAL_BACKEND_FTS_INDEXES,
  timeout: 20000,
});
