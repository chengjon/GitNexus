import type { RepoHandle } from '../runtime/types.js';
import type { BackendRuntime } from '../runtime/backend-runtime.js';

export interface ToolContext {
  runtime: BackendRuntime;
  repo: RepoHandle;
  logQueryError: (context: string, err: unknown) => void;
}
