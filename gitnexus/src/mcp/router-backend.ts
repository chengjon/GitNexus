import type { McpBackendLike, ListedRepo } from './backend-contract.js';
import type { LocalBackendRuntimeLike, RepoHandle } from './local/runtime/types.js';
import type { WorkerRequestMethod } from './repo-worker-protocol.js';

interface RepoWorkerManagerLike {
  call?(repo: RepoHandle, method: WorkerRequestMethod, ...args: unknown[]): Promise<unknown>;
  disconnect?(): Promise<void>;
}

interface RouterBackendOptions {
  runtime: LocalBackendRuntimeLike;
  workerManager: RepoWorkerManagerLike;
}

export class RouterBackend implements McpBackendLike {
  private runtime: LocalBackendRuntimeLike;
  private workerManager: RepoWorkerManagerLike;

  constructor({ runtime, workerManager }: RouterBackendOptions) {
    this.runtime = runtime;
    this.workerManager = workerManager;
  }

  async init(): Promise<boolean> {
    return this.runtime.init();
  }

  async listRepos(): Promise<ListedRepo[]> {
    await this.runtime.refreshRepos();
    return this.runtime.getRepos().map((repo) => this.mapRepo(repo));
  }

  async resolveRepo(repoParam?: string): Promise<RepoHandle> {
    return this.runtime.resolveRepo(repoParam);
  }

  getContext(repoId?: string) {
    return this.runtime.getContext(repoId);
  }

  async callTool(method: string, params: any): Promise<any> {
    if (method === 'list_repos') {
      return this.listRepos();
    }

    const repo = await this.runtime.resolveRepo(params?.repo);
    return this.callRepoWorker(repo, 'callTool', method, params);
  }

  async queryClusters(repoName?: string, limit?: number): Promise<{ clusters: any[] }> {
    const repo = await this.runtime.resolveRepo(repoName);
    return this.callRepoWorker(repo, 'queryClusters', repo.name, limit) as Promise<{ clusters: any[] }>;
  }

  async queryProcesses(repoName?: string, limit?: number): Promise<{ processes: any[] }> {
    const repo = await this.runtime.resolveRepo(repoName);
    return this.callRepoWorker(repo, 'queryProcesses', repo.name, limit) as Promise<{ processes: any[] }>;
  }

  async queryClusterDetail(name: string, repoName?: string): Promise<any> {
    const repo = await this.runtime.resolveRepo(repoName);
    return this.callRepoWorker(repo, 'queryClusterDetail', name, repo.name);
  }

  async queryProcessDetail(name: string, repoName?: string): Promise<any> {
    const repo = await this.runtime.resolveRepo(repoName);
    return this.callRepoWorker(repo, 'queryProcessDetail', name, repo.name);
  }

  async disconnect(): Promise<void> {
    await this.runtime.disconnect();
    await this.workerManager.disconnect?.();
  }

  private mapRepo(repo: RepoHandle): ListedRepo {
    return {
      name: repo.name,
      path: repo.repoPath,
      storagePath: repo.storagePath,
      kuzuPath: repo.kuzuPath,
      indexState: repo.indexState || 'ready',
      suggestedFix: repo.suggestedFix,
      indexedAt: repo.indexedAt,
      lastCommit: repo.lastCommit,
      stats: repo.stats,
    };
  }

  private async callRepoWorker(
    repo: RepoHandle,
    method: WorkerRequestMethod,
    ...args: unknown[]
  ): Promise<unknown> {
    if (!this.workerManager.call) {
      throw new Error('Repo worker manager does not implement call()');
    }

    return this.workerManager.call(repo, method, ...args);
  }
}
