import type { BackendRuntimeLike, RepoHandle } from '../runtime/types.js';

export interface ToolContext {
  runtime: BackendRuntimeLike;
  repo: RepoHandle;
  logQueryError: (context: string, err: unknown) => void;
}
