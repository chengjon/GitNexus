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
  routerPid: number;
  sessionId: string;
};

export type WorkerReadyMessage = {
  kind: 'ready';
};

export type WorkerBootstrapErrorMessage = {
  kind: 'bootstrap-error';
  error: string;
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
export type WorkerLifecycleMessage = WorkerReadyMessage | WorkerBootstrapErrorMessage;

export function isWorkerResponseMessage(message: unknown): message is WorkerResponseMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const candidate = message as Partial<WorkerResponseMessage>;
  return candidate.kind === 'response'
    && typeof candidate.requestId === 'string'
    && typeof candidate.ok === 'boolean';
}

export function isWorkerReadyMessage(message: unknown): message is WorkerReadyMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }

  return (message as Partial<WorkerReadyMessage>).kind === 'ready';
}

export function isWorkerBootstrapErrorMessage(message: unknown): message is WorkerBootstrapErrorMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const candidate = message as Partial<WorkerBootstrapErrorMessage>;
  return candidate.kind === 'bootstrap-error'
    && typeof candidate.error === 'string';
}
