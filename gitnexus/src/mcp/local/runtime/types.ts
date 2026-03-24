export interface CodebaseContext {
  projectName: string;
  stats: {
    fileCount: number;
    functionCount: number;
    communityCount: number;
    processCount: number;
  };
}

export type RepoIndexState = string;

export interface RepoStats {
  files?: number;
  nodes?: number;
  communities?: number;
  processes?: number;
  [key: string]: unknown;
}

export interface RepoHandle {
  id: string;
  name: string;
  repoPath: string;
  storagePath: string;
  kuzuPath: string;
  indexState?: RepoIndexState;
  suggestedFix?: string;
  indexedAt: string;
  lastCommit: string;
  stats?: RepoStats;
}

export interface BackendRuntimeLike {
  ensureInitialized(repoId: string): Promise<void>;
}

export interface LocalBackendRuntimeLike extends BackendRuntimeLike {
  init(): Promise<boolean>;
  refreshRepos(): Promise<void>;
  resolveRepo(repoParam?: string): Promise<RepoHandle>;
  getContext(repoId?: string): CodebaseContext | null;
  getRepos(): RepoHandle[];
  disconnect(): Promise<void>;
}
