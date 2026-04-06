import type { CodebaseContext, RepoHandle } from './local/runtime/types.js';

export interface ListedRepo {
  name: string;
  path: string;
  storagePath: string;
  kuzuPath: string;
  indexState: RepoHandle['indexState'] | 'ready';
  suggestedFix?: string;
  indexedAt: string;
  lastCommit: string;
  stats?: RepoHandle['stats'];
}

export interface McpBackendLike {
  callTool(method: string, params: any): Promise<any>;
  listRepos(): Promise<ListedRepo[]>;
  resolveRepo(repoParam?: string): Promise<RepoHandle>;
  getContext(repoId?: string): CodebaseContext | null;
  queryClusters(repoName?: string, limit?: number): Promise<{ clusters: any[] }>;
  queryProcesses(repoName?: string, limit?: number): Promise<{ processes: any[] }>;
  queryClusterDetail(name: string, repoName?: string): Promise<any>;
  queryProcessDetail(name: string, repoName?: string): Promise<any>;
  disconnect(): Promise<void>;
}
