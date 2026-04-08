import { LocalBackend } from './local/local-backend.js';
import { PinnedRepoRuntime } from './local/runtime/pinned-repo-runtime.js';
import {
  type WorkerRequestMessage,
  type WorkerRequestMethod,
  type WorkerBootstrapMessage,
} from './repo-worker-protocol.js';
import {
  createMcpProcessRegistration,
  type McpProcessRegistration,
  readMcpProcessCommand,
  removeMcpProcessCommand,
} from '../runtime/mcp-process-registry.js';
import { getDefaultMcpProcessTimingConfig } from '../runtime/mcp-process-config.js';

const DEFAULT_CONTROL_CHECK_INTERVAL_MS = 250;

const isPidAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error: any) {
    if (error?.code === 'ESRCH') {
      return false;
    }
    return true;
  }
};

function isWorkerBootstrapMessage(message: unknown): message is WorkerBootstrapMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const candidate = message as Partial<WorkerBootstrapMessage>;
  return candidate.kind === 'init'
    && !!candidate.repo
    && typeof candidate.sessionId === 'string'
    && typeof candidate.routerPid === 'number';
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
  const timing = getDefaultMcpProcessTimingConfig();
  let backend: LocalBackend | null = null;
  let draining = false;
  let exitRequested = false;
  let inFlightRequests = 0;
  let controlCheckTimer: ReturnType<typeof setInterval> | null = null;
  let ownerCheckTimer: ReturnType<typeof setInterval> | null = null;
  let registration: McpProcessRegistration | null = null;
  let shutdownPromise: Promise<void> | null = null;
  let workerSessionId: string | null = null;
  let workerStoragePath: string | null = null;
  const controlCheckIntervalMs = Math.max(100, Math.min(
    timing.heartbeatIntervalMs,
    DEFAULT_CONTROL_CHECK_INTERVAL_MS,
  ));

  const stopOwnerCheck = () => {
    if (ownerCheckTimer) {
      clearInterval(ownerCheckTimer);
      ownerCheckTimer = null;
    }
  };

  const stopControlCheck = () => {
    if (controlCheckTimer) {
      clearInterval(controlCheckTimer);
      controlCheckTimer = null;
    }
  };

  const shutdown = async () => {
    if (shutdownPromise) {
      await shutdownPromise;
      return;
    }

    shutdownPromise = (async () => {
      stopOwnerCheck();
      stopControlCheck();
      try {
        await backend?.disconnect();
      } finally {
        backend = null;
      }

      try {
        await registration?.stop();
      } finally {
        registration = null;
      }

      try {
        if (workerSessionId) {
          await removeMcpProcessCommand(process.pid, workerSessionId);
          if (workerStoragePath) {
            await removeMcpProcessCommand(process.pid, workerSessionId, {
              storagePath: workerStoragePath,
            });
          }
        }
      } finally {
        workerSessionId = null;
        workerStoragePath = null;
      }
    })();

    await shutdownPromise;
  };

  const exitAfterShutdown = async (code: number): Promise<void> => {
    if (exitRequested) {
      return;
    }
    exitRequested = true;
    await shutdown();
    process.exit(code);
  };

  const exitWhenDrained = async (): Promise<void> => {
    if (!draining || inFlightRequests > 0) {
      return;
    }

    await registration?.updateState('stopping');
    await exitAfterShutdown(0);
  };

  const beginDrain = async (): Promise<void> => {
    if (draining) {
      return;
    }

    draining = true;
    await registration?.updateState('draining');
    await exitWhenDrained();
  };

  const checkForControlCommands = async (): Promise<void> => {
    if (!workerSessionId || exitRequested) {
      return;
    }

    const command = await readMcpProcessCommand(process.pid, workerSessionId)
      ?? (workerStoragePath
        ? await readMcpProcessCommand(process.pid, workerSessionId, {
          storagePath: workerStoragePath,
        })
        : null);
    if (!command) {
      return;
    }

    if (command.command === 'drain') {
      await beginDrain();
      await removeMcpProcessCommand(process.pid, workerSessionId);
      if (workerStoragePath) {
        await removeMcpProcessCommand(process.pid, workerSessionId, {
          storagePath: workerStoragePath,
        });
      }
    }
  };

  const startControlCheck = () => {
    stopControlCheck();
    controlCheckTimer = setInterval(() => {
      void checkForControlCommands().catch((error) => {
        const err = error instanceof Error ? error.message : String(error);
        console.error(`GitNexus repo worker control check failed: ${err}`);
      });
    }, controlCheckIntervalMs);
    controlCheckTimer.unref?.();
  };

  const startOwnerCheck = (routerPid: number) => {
    stopOwnerCheck();
    ownerCheckTimer = setInterval(() => {
      if (isPidAlive(routerPid)) {
        return;
      }

      void (async () => {
        await registration?.updateState('stopping');
        await exitAfterShutdown(0);
      })();
    }, timing.heartbeatIntervalMs);
    ownerCheckTimer.unref?.();
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
      try {
        workerSessionId = message.sessionId;
        workerStoragePath = message.repo.storagePath;
        registration = createMcpProcessRegistration({
          pid: process.pid,
          ppid: process.ppid,
          role: 'repo-worker',
          sessionId: message.sessionId,
          heartbeatIntervalMs: timing.heartbeatIntervalMs,
          cwd: process.cwd(),
          command: process.argv.slice(1).join(' '),
          state: 'starting',
          repoId: message.repo.id,
          repoName: message.repo.name,
          repoPath: message.repo.repoPath,
          storagePath: message.repo.storagePath,
          routerPid: message.routerPid,
        });
        await registration.start();
        const runtime = new PinnedRepoRuntime(message.repo);
        backend = new LocalBackend(runtime);
        await backend.init();
        await registration.updateState(draining ? 'draining' : 'ready', {
          lastActivityAt: new Date().toISOString(),
        });
        startOwnerCheck(message.routerPid);
        startControlCheck();
        process.send?.({ kind: 'ready' });
        await checkForControlCommands();
        await exitWhenDrained();
      } catch (error) {
        const err = error instanceof Error ? error.message : String(error);
        process.send?.({
          kind: 'bootstrap-error',
          error: err,
        });
        await exitAfterShutdown(1);
      }
      return;
    }

    if (!isWorkerRequestMessage(message)) {
      return;
    }

    if (draining) {
      process.send?.({
        kind: 'response',
        requestId: message.requestId,
        ok: false,
        error: 'Repo worker is draining',
      });
      return;
    }

    inFlightRequests += 1;
    try {
      const result = await dispatch(message.method, message.args);
      await registration?.heartbeat({
        lastActivityAt: new Date().toISOString(),
      });
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
    } finally {
      inFlightRequests = Math.max(0, inFlightRequests - 1);
      await exitWhenDrained();
    }
  });

  process.on('disconnect', async () => {
    await exitAfterShutdown(0);
  });
  process.on('SIGTERM', async () => {
    await exitAfterShutdown(0);
  });
  process.on('SIGINT', async () => {
    await exitAfterShutdown(0);
  });
  process.on('SIGUSR1', async () => {
    await beginDrain();
  });
}
