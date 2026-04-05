import fs from 'node:fs/promises';
import path from 'node:path';
import { fork } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { listGitNexusMcpPidsHoldingPath } from '../../src/cli/platform-process-scan.js';
import { BackendRuntime } from '../../src/mcp/local/runtime/backend-runtime.js';
import { RepoWorkerManager } from '../../src/mcp/repo-worker-manager.js';
import { RouterBackend } from '../../src/mcp/router-backend.js';
import { listRegisteredRepos } from '../../src/storage/repo-manager.js';
import { LOCAL_BACKEND_FTS_INDEXES, LOCAL_BACKEND_SEED_DATA } from '../fixtures/local-backend-seed.js';
import { withTestKuzuDB } from '../helpers/test-indexed-db.js';

vi.mock('../../src/storage/repo-manager.js', () => ({
  listRegisteredRepos: vi.fn().mockResolvedValue([]),
}));

withTestKuzuDB('mcp-worker-isolation', (handle) => {
  describe('per-repo worker isolation', () => {
    const activeManagers: RepoWorkerManager[] = [];

    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(async () => {
      await Promise.all(activeManagers.splice(0).map((manager) => manager.disconnect()));
    });

    it('isolates repo workers and respawns only the repo that exited', async () => {
      const repoPathA = path.join(handle.tmpHandle.dbPath, 'repo-a');
      const repoPathB = path.join(handle.tmpHandle.dbPath, 'repo-b');
      const workerKuzuPathA = path.join(handle.tmpHandle.dbPath, `isolation-kuzu-a-${Date.now()}`);
      const workerKuzuPathB = path.join(handle.tmpHandle.dbPath, `isolation-kuzu-b-${Date.now()}`);

      await Promise.all([
        fs.mkdir(path.join(repoPathA, 'src'), { recursive: true }),
        fs.mkdir(path.join(repoPathB, 'src'), { recursive: true }),
        fs.cp(handle.dbPath, workerKuzuPathA, { recursive: true }),
        fs.cp(handle.dbPath, workerKuzuPathB, { recursive: true }),
      ]);
      await Promise.all([
        fs.writeFile(path.join(repoPathA, 'src', 'auth.ts'), 'function login() { return validate(); }\nfunction validate() { return true; }\n', 'utf-8'),
        fs.writeFile(path.join(repoPathB, 'src', 'auth.ts'), 'function login() { return validate(); }\nfunction validate() { return true; }\n', 'utf-8'),
      ]);

      vi.mocked(listRegisteredRepos).mockResolvedValue([
        {
          name: 'repo-a',
          path: repoPathA,
          storagePath: handle.tmpHandle.dbPath,
          kuzuPath: workerKuzuPathA,
          indexedAt: new Date().toISOString(),
          lastCommit: 'aaa1111',
          stats: { files: 2, nodes: 3, communities: 1, processes: 1 },
        },
        {
          name: 'repo-b',
          path: repoPathB,
          storagePath: handle.tmpHandle.dbPath,
          kuzuPath: workerKuzuPathB,
          indexedAt: new Date().toISOString(),
          lastCommit: 'bbb2222',
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

      await expect(backend.callTool('context', { name: 'login', repo: 'repo-a' })).resolves.toMatchObject({
        status: 'found',
        symbol: { name: 'login' },
      });
      await expect(backend.callTool('context', { name: 'login', repo: 'repo-b' })).resolves.toMatchObject({
        status: 'found',
        symbol: { name: 'login' },
      });

      const pidA = manager.__testOnlyGetWorkerPid('repo-a');
      const pidB = manager.__testOnlyGetWorkerPid('repo-b');

      expect(pidA).toBeTruthy();
      expect(pidB).toBeTruthy();
      expect(pidA).not.toBe(pidB);

      if (process.platform === 'linux') {
        const holdersA = await listGitNexusMcpPidsHoldingPath(workerKuzuPathA);
        const holdersB = await listGitNexusMcpPidsHoldingPath(workerKuzuPathB);
        expect(holdersA).toContain(String(pidA));
        expect(holdersA).not.toContain(String(process.pid));
        expect(holdersB).toContain(String(pidB));
        expect(holdersB).not.toContain(String(process.pid));
      }

      process.kill(pidB!, 'SIGTERM');
      await vi.waitFor(() => {
        expect(manager.__testOnlyGetWorkerPid('repo-b')).toBeNull();
      });

      await expect(backend.callTool('context', { name: 'login', repo: 'repo-a' })).resolves.toMatchObject({
        status: 'found',
        symbol: { name: 'login' },
      });
      expect(manager.__testOnlyGetWorkerPid('repo-a')).toBe(pidA);

      await expect(backend.callTool('context', { name: 'login', repo: 'repo-b' })).resolves.toMatchObject({
        status: 'found',
        symbol: { name: 'login' },
      });

      const respawnedPidB = manager.__testOnlyGetWorkerPid('repo-b');
      expect(respawnedPidB).toBeTruthy();
      expect(respawnedPidB).not.toBe(pidB);
    });
  });
}, {
  seed: LOCAL_BACKEND_SEED_DATA,
  ftsIndexes: LOCAL_BACKEND_FTS_INDEXES,
  timeout: 20000,
});
