import path from 'node:path';
import { closeKuzu, initKuzu, isKuzuReady } from '../../core/kuzu-adapter.js';
import type { CodebaseContext, LocalBackendRuntimeLike, RepoHandle } from './types.js';

export class PinnedRepoRuntime implements LocalBackendRuntimeLike {
  private context: CodebaseContext;
  private initialized = false;
  private repo: RepoHandle;

  constructor(repo: RepoHandle) {
    this.repo = repo;
    const stats = repo.stats || {};
    this.context = {
      projectName: repo.name,
      stats: {
        fileCount: stats.files || 0,
        functionCount: stats.nodes || 0,
        communityCount: stats.communities || 0,
        processCount: stats.processes || 0,
      },
    };
  }

  async init(): Promise<boolean> {
    return true;
  }

  async refreshRepos(): Promise<void> {
    // Repo worker is pinned to a single repo handle for its full lifetime.
  }

  async resolveRepo(repoParam?: string): Promise<RepoHandle> {
    if (!repoParam) {
      return this.repo;
    }

    const normalizedParam = this.normalizePath(repoParam);
    if (
      repoParam === this.repo.id
      || repoParam === this.repo.name
      || repoParam.toLowerCase() === this.repo.name.toLowerCase()
      || normalizedParam === this.normalizePath(this.repo.repoPath)
    ) {
      return this.repo;
    }

    throw new Error(`Repository "${repoParam}" not available in repo worker for "${this.repo.name}"`);
  }

  getContext(repoId?: string): CodebaseContext | null {
    if (!repoId || repoId === this.repo.id || repoId === this.repo.name.toLowerCase()) {
      return this.context;
    }
    return null;
  }

  getRepos(): RepoHandle[] {
    return [this.repo];
  }

  async ensureInitialized(repoId: string): Promise<void> {
    if (repoId !== this.repo.id) {
      throw new Error(`Unknown repo: ${repoId}`);
    }
    if (this.initialized && isKuzuReady(repoId)) {
      return;
    }

    await initKuzu(this.repo.id, this.repo.kuzuPath);
    this.initialized = true;
  }

  async disconnect(): Promise<void> {
    await closeKuzu(this.repo.id);
    this.initialized = false;
  }

  private normalizePath(candidate: string): string {
    const resolved = path.resolve(candidate);
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
  }
}
