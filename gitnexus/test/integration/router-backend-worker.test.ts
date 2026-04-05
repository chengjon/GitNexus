import fs from 'node:fs/promises';
import path from 'node:path';
import { fork } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BackendRuntime } from '../../src/mcp/local/runtime/backend-runtime.js';
import { RouterBackend } from '../../src/mcp/router-backend.js';
import { RepoWorkerManager } from '../../src/mcp/repo-worker-manager.js';
import { listRegisteredRepos } from '../../src/storage/repo-manager.js';
import { withTestKuzuDB } from '../helpers/test-indexed-db.js';
import { LOCAL_BACKEND_FTS_INDEXES, LOCAL_BACKEND_SEED_DATA } from '../fixtures/local-backend-seed.js';

vi.mock('../../src/storage/repo-manager.js', () => ({
  listRegisteredRepos: vi.fn().mockResolvedValue([]),
}));

withTestKuzuDB('router-backend-worker', (handle) => {
  describe('RouterBackend tool forwarding', () => {
    const activeManagers: RepoWorkerManager[] = [];

    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(async () => {
      await Promise.all(activeManagers.splice(0).map((manager) => manager.disconnect()));
    });

    it('reuses one worker process for multiple repo-scoped calls', async () => {
      const repoPath = path.join(handle.tmpHandle.dbPath, 'repo');
      const workerKuzuPath = path.join(handle.tmpHandle.dbPath, `router-worker-kuzu-${Date.now()}`);
      await fs.mkdir(path.join(repoPath, 'src'), { recursive: true });
      await fs.cp(handle.dbPath, workerKuzuPath, { recursive: true });
      await fs.writeFile(
        path.join(repoPath, 'src', 'auth.ts'),
        'function login() { return validate(); }\nfunction validate() { return true; }\n',
        'utf-8',
      );
      await fs.writeFile(
        path.join(repoPath, 'src', 'utils.ts'),
        'function hash() { return "x"; }\n',
        'utf-8',
      );

      vi.mocked(listRegisteredRepos).mockResolvedValue([
        {
          name: 'test-repo',
          path: repoPath,
          storagePath: handle.tmpHandle.dbPath,
          kuzuPath: workerKuzuPath,
          indexedAt: new Date().toISOString(),
          lastCommit: 'abc1234',
          stats: { files: 2, nodes: 3, communities: 1, processes: 1 },
        },
      ]);

      const cliEntry = path.resolve(process.cwd(), 'dist/cli/index.js');
      const forkWorker = vi.fn((modulePath: string, args: string[], options: any) =>
        fork(modulePath, args, { ...options, execArgv: [] }),
      );
      const manager = new RepoWorkerManager({
        cliEntry,
        forkWorker,
        requestTimeoutMs: 5000,
      });
      activeManagers.push(manager);

      const backend = new RouterBackend({
        runtime: new BackendRuntime(),
        workerManager: manager,
      });

      const queryResult = await backend.callTool('query', { query: 'login' });
      const contextResult = await backend.callTool('context', { name: 'login' });

      expect(forkWorker).toHaveBeenCalledTimes(1);
      expect(queryResult).toMatchObject({
        processes: expect.any(Array),
        process_symbols: expect.any(Array),
        definitions: expect.any(Array),
      });
      expect(contextResult).toMatchObject({
        status: 'found',
        symbol: {
          name: 'login',
        },
      });
    });

    it('forwards repo-scoped resource helpers through the worker', async () => {
      const repoPath = path.join(handle.tmpHandle.dbPath, 'resource-repo');
      const workerKuzuPath = path.join(handle.tmpHandle.dbPath, `router-resource-kuzu-${Date.now()}`);
      await fs.mkdir(path.join(repoPath, 'src'), { recursive: true });
      await fs.cp(handle.dbPath, workerKuzuPath, { recursive: true });

      vi.mocked(listRegisteredRepos).mockResolvedValue([
        {
          name: 'test-repo',
          path: repoPath,
          storagePath: handle.tmpHandle.dbPath,
          kuzuPath: workerKuzuPath,
          indexedAt: new Date().toISOString(),
          lastCommit: 'abc1234',
          stats: { files: 2, nodes: 3, communities: 1, processes: 1 },
        },
      ]);

      const manager = new RepoWorkerManager({
        cliEntry: path.resolve(process.cwd(), 'dist/cli/index.js'),
        forkWorker: (modulePath, args, options) => fork(modulePath, args, { ...options, execArgv: [] }),
        requestTimeoutMs: 5000,
      });
      activeManagers.push(manager);

      const backend = new RouterBackend({
        runtime: new BackendRuntime(),
        workerManager: manager,
      });

      await expect(backend.queryClusters('test-repo', 100)).resolves.toMatchObject({
        clusters: expect.arrayContaining([
          expect.objectContaining({ heuristicLabel: 'Authentication' }),
        ]),
      });
      await expect(backend.queryProcesses('test-repo', 50)).resolves.toMatchObject({
        processes: expect.arrayContaining([
          expect.objectContaining({ heuristicLabel: 'User Login' }),
        ]),
      });
      await expect(backend.queryClusterDetail('Authentication', 'test-repo')).resolves.toMatchObject({
        cluster: expect.objectContaining({ heuristicLabel: 'Authentication' }),
      });
      await expect(backend.queryProcessDetail('User Login', 'test-repo')).resolves.toMatchObject({
        process: expect.objectContaining({ heuristicLabel: 'User Login' }),
      });
    });
  });
}, {
  seed: [
    ...LOCAL_BACKEND_SEED_DATA,
    `CREATE (c:Community {id: 'comm:auth-extra', label: 'Auth Extra', heuristicLabel: 'Authentication', cohesion: 0.7, symbolCount: 5})`,
  ],
  ftsIndexes: LOCAL_BACKEND_FTS_INDEXES,
  timeout: 20000,
});
