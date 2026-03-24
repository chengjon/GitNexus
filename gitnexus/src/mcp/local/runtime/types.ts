import type { RegistryEntry } from '../../../storage/repo-manager.js';

export interface CodebaseContext {
  projectName: string;
  stats: {
    fileCount: number;
    functionCount: number;
    communityCount: number;
    processCount: number;
  };
}

export interface RepoHandle {
  id: string;
  name: string;
  repoPath: string;
  storagePath: string;
  kuzuPath: string;
  indexState?: RegistryEntry['indexState'];
  suggestedFix?: string;
  indexedAt: string;
  lastCommit: string;
  stats?: RegistryEntry['stats'];
}

export interface BackendRuntimeLike {
  ensureInitialized(repoId: string): Promise<void>;
}
