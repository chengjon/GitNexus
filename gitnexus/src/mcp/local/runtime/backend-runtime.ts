import path from 'path';
import { closeKuzu, initKuzu, isKuzuReady } from '../../core/kuzu-adapter.js';
import { listRegisteredRepos } from '../../../storage/repo-manager.js';
import type { CodebaseContext, LocalBackendRuntimeLike, RepoHandle } from './types.js';

export class BackendRuntime implements LocalBackendRuntimeLike {
  private repos: Map<string, RepoHandle> = new Map();
  private contextCache: Map<string, CodebaseContext> = new Map();
  private initializedRepos: Set<string> = new Set();

  private samePath(left: string, right: string): boolean {
    return process.platform === 'win32'
      ? left.toLowerCase() === right.toLowerCase()
      : left === right;
  }

  private ambiguousRepoError(repoParam: string, candidates: RepoHandle[]): Error {
    const formatted = candidates
      .map((candidate) => `${candidate.name} (${candidate.repoPath})`)
      .join(', ');
    const nameCounts = new Map<string, number>();
    for (const candidate of candidates) {
      nameCounts.set(candidate.name, (nameCounts.get(candidate.name) || 0) + 1);
    }
    const suggestedParams = candidates.map((candidate) => {
      const value = nameCounts.get(candidate.name) === 1 ? candidate.name : candidate.repoPath;
      return `repo: "${value}"`;
    }).join(', ');
    return new Error(
      `Repository "${repoParam}" is ambiguous. Candidates: ${formatted}. Use one of: ${suggestedParams}`,
    );
  }

  private resolveUniqueRepo(
    repoParam: string,
    candidates: RepoHandle[],
  ): RepoHandle | null {
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];
    throw this.ambiguousRepoError(repoParam, candidates);
  }

  async init(): Promise<boolean> {
    await this.refreshRepos();
    return this.repos.size > 0;
  }

  async refreshRepos(): Promise<void> {
    const entries = await listRegisteredRepos({ validate: true });
    const freshIds = new Set<string>();

    for (const entry of entries) {
      const id = this.repoId(entry.name, entry.path);
      freshIds.add(id);

      const storagePath = entry.storagePath;
      const kuzuPath = path.join(storagePath, 'kuzu');

      const handle: RepoHandle = {
        id,
        name: entry.name,
        repoPath: entry.path,
        storagePath,
        kuzuPath: entry.kuzuPath || kuzuPath,
        indexState: entry.indexState,
        suggestedFix: entry.suggestedFix,
        indexedAt: entry.indexedAt,
        lastCommit: entry.lastCommit,
        stats: entry.stats,
      };

      this.repos.set(id, handle);

      const s = entry.stats || {};
      this.contextCache.set(id, {
        projectName: entry.name,
        stats: {
          fileCount: s.files || 0,
          functionCount: s.nodes || 0,
          communityCount: s.communities || 0,
          processCount: s.processes || 0,
        },
      });
    }

    for (const id of this.repos.keys()) {
      if (!freshIds.has(id)) {
        this.repos.delete(id);
        this.contextCache.delete(id);
        this.initializedRepos.delete(id);
      }
    }
  }

  private repoId(name: string, repoPath: string): string {
    const base = name.toLowerCase();
    for (const [id, handle] of this.repos) {
      if (id === base && handle.repoPath !== path.resolve(repoPath)) {
        const hash = Buffer.from(repoPath).toString('base64url').slice(0, 6);
        return `${base}-${hash}`;
      }
    }
    return base;
  }

  async resolveRepo(repoParam?: string): Promise<RepoHandle> {
    const result = this.resolveRepoFromCache(repoParam);
    if (result) return result;

    await this.refreshRepos();
    const retried = this.resolveRepoFromCache(repoParam);
    if (retried) return retried;

    if (this.repos.size === 0) {
      throw new Error('No indexed repositories. Run: gitnexus analyze');
    }
    if (repoParam) {
      const names = [...this.repos.values()].map((h) => h.name);
      throw new Error(`Repository "${repoParam}" not found. Available: ${names.join(', ')}`);
    }
    const names = [...this.repos.values()].map((h) => h.name);
    throw new Error(
      `Multiple repositories indexed. Specify which one with the "repo" parameter. Available: ${names.join(', ')}`,
    );
  }

  private resolveRepoFromCache(repoParam?: string): RepoHandle | null {
    if (this.repos.size === 0) return null;

    if (repoParam) {
      const handles = [...this.repos.values()];
      const paramLower = repoParam.toLowerCase();
      const resolved = path.resolve(repoParam);

      const exactPathMatch = this.resolveUniqueRepo(
        repoParam,
        handles.filter((handle) => this.samePath(handle.repoPath, resolved)),
      );
      if (exactPathMatch) return exactPathMatch;

      const exactNameMatch = this.resolveUniqueRepo(
        repoParam,
        handles.filter((handle) => handle.name === repoParam),
      );
      if (exactNameMatch) return exactNameMatch;

      const caseInsensitiveNameMatch = this.resolveUniqueRepo(
        repoParam,
        handles.filter((handle) => handle.name.toLowerCase() === paramLower),
      );
      if (caseInsensitiveNameMatch) return caseInsensitiveNameMatch;

      if (this.repos.has(paramLower)) return this.repos.get(paramLower)!;

      const partialNameMatch = this.resolveUniqueRepo(
        repoParam,
        handles.filter((handle) => handle.name.toLowerCase().includes(paramLower)),
      );
      if (partialNameMatch) return partialNameMatch;

      return null;
    }

    if (this.repos.size === 1) {
      return this.repos.values().next().value!;
    }

    return null;
  }

  async ensureInitialized(repoId: string): Promise<void> {
    if (this.initializedRepos.has(repoId) && isKuzuReady(repoId)) return;

    const handle = this.repos.get(repoId);
    if (!handle) throw new Error(`Unknown repo: ${repoId}`);

    try {
      await initKuzu(repoId, handle.kuzuPath);
      this.initializedRepos.add(repoId);
    } catch (err) {
      this.initializedRepos.delete(repoId);
      throw err;
    }
  }

  getContext(repoId?: string): CodebaseContext | null {
    if (repoId && this.contextCache.has(repoId)) {
      return this.contextCache.get(repoId)!;
    }
    if (this.repos.size === 1) {
      return this.contextCache.values().next().value ?? null;
    }
    return null;
  }

  getRepos(): RepoHandle[] {
    return [...this.repos.values()];
  }

  async disconnect(): Promise<void> {
    await closeKuzu();
    this.repos.clear();
    this.contextCache.clear();
    this.initializedRepos.clear();
  }
}
