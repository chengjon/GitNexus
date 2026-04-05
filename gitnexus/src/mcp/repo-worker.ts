import { LocalBackend } from './local/local-backend.js';
import { PinnedRepoRuntime } from './local/runtime/pinned-repo-runtime.js';
import {
  type WorkerRequestMessage,
  type WorkerRequestMethod,
  type WorkerBootstrapMessage,
} from './repo-worker-protocol.js';

function isWorkerBootstrapMessage(message: unknown): message is WorkerBootstrapMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const candidate = message as Partial<WorkerBootstrapMessage>;
  return candidate.kind === 'init' && !!candidate.repo;
}

function isWorkerRequestMessage(message: unknown): message is WorkerRequestMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const candidate = message as Partial<WorkerRequestMessage>;
  return candidate.kind === 'request'
    && typeof candidate.requestId === 'string'
    && typeof candidate.method === 'string'
    && Array.isArray(candidate.args);
}

export async function startRepoWorkerProcess(): Promise<void> {
  let backend: LocalBackend | null = null;
  let shutdownPromise: Promise<void> | null = null;

  const shutdown = async () => {
    if (!backend) {
      return;
    }
    if (shutdownPromise) {
      await shutdownPromise;
      return;
    }

    shutdownPromise = (async () => {
      try {
        await backend?.disconnect();
      } finally {
        backend = null;
      }
    })();

    await shutdownPromise;
  };

  const dispatch = async (method: WorkerRequestMethod, args: unknown[]): Promise<unknown> => {
    if (!backend) {
      throw new Error('Repo worker has not been initialized');
    }

    switch (method) {
      case 'callTool':
        return backend.callTool(args[0] as string, args[1]);
      case 'queryClusters':
        return backend.queryClusters(args[0] as string | undefined, args[1] as number | undefined);
      case 'queryProcesses':
        return backend.queryProcesses(args[0] as string | undefined, args[1] as number | undefined);
      case 'queryClusterDetail':
        return backend.queryClusterDetail(args[0] as string, args[1] as string | undefined);
      case 'queryProcessDetail':
        return backend.queryProcessDetail(args[0] as string, args[1] as string | undefined);
      default:
        throw new Error(`Unknown worker method: ${method satisfies never}`);
    }
  };

  process.on('message', async (message: unknown) => {
    if (!backend && isWorkerBootstrapMessage(message)) {
      const runtime = new PinnedRepoRuntime(message.repo);
      backend = new LocalBackend(runtime);
      await backend.init();
      return;
    }

    if (!isWorkerRequestMessage(message)) {
      return;
    }

    try {
      const result = await dispatch(message.method, message.args);
      process.send?.({
        kind: 'response',
        requestId: message.requestId,
        ok: true,
        result,
      });
    } catch (error) {
      const err = error instanceof Error ? error.message : String(error);
      process.send?.({
        kind: 'response',
        requestId: message.requestId,
        ok: false,
        error: err,
      });
    }
  });

  process.on('disconnect', async () => {
    await shutdown();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    await shutdown();
    process.exit(0);
  });
  process.on('SIGINT', async () => {
    await shutdown();
    process.exit(0);
  });
}
