import type { RepoHandle } from './local/runtime/types.js';

export type WorkerRequestMethod =
  | 'callTool'
  | 'queryClusters'
  | 'queryProcesses'
  | 'queryClusterDetail'
  | 'queryProcessDetail';

export type WorkerBootstrapMessage = {
  kind: 'init';
  repo: RepoHandle;
};

export type WorkerRequestMessage = {
  kind: 'request';
  requestId: string;
  method: WorkerRequestMethod;
  args: unknown[];
};

export type WorkerSuccessResponseMessage = {
  kind: 'response';
  requestId: string;
  ok: true;
  result: unknown;
};

export type WorkerErrorResponseMessage = {
  kind: 'response';
  requestId: string;
  ok: false;
  error: string;
};

export type WorkerResponseMessage = WorkerSuccessResponseMessage | WorkerErrorResponseMessage;

export function isWorkerResponseMessage(message: unknown): message is WorkerResponseMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const candidate = message as Partial<WorkerResponseMessage>;
  return candidate.kind === 'response'
    && typeof candidate.requestId === 'string'
    && typeof candidate.ok === 'boolean';
}
