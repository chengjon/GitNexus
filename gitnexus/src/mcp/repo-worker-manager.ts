import { fork, type ChildProcess, type ForkOptions } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { RepoHandle } from './local/runtime/types.js';
import {
  isWorkerBootstrapErrorMessage,
  isWorkerReadyMessage,
  isWorkerResponseMessage,
  type WorkerBootstrapMessage,
  type WorkerRequestMessage,
  type WorkerRequestMethod,
} from './repo-worker-protocol.js';

type ForkWorker = (modulePath: string, args: string[], options: ForkOptions) => ChildProcess;

interface PendingRequest {
  reject: (error: Error) => void;
  resolve: (value: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface WorkerState {
  child: ChildProcess;
  pending: Map<string, PendingRequest>;
  repo: RepoHandle;
}

export interface RepoWorkerManagerOptions {
  cliEntry?: string;
  forkWorker?: ForkWorker;
  requestTimeoutMs?: number;
  routerPid?: number;
  sessionId?: string;
}

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

export class RepoWorkerManager {
  private cliEntry: string;
  private forkWorker: ForkWorker;
  private requestTimeoutMs: number;
  private routerPid: number;
  private requestSeq = 0;
  private sessionId: string;
  private workerPromises = new Map<string, Promise<WorkerState>>();
  private workers = new Map<string, WorkerState>();

  constructor(options: RepoWorkerManagerOptions = {}) {
    this.cliEntry = options.cliEntry || process.argv[1] || fileURLToPath(new URL('../cli/index.js', import.meta.url));
    this.forkWorker = options.forkWorker || fork;
    this.requestTimeoutMs = options.requestTimeoutMs || DEFAULT_REQUEST_TIMEOUT_MS;
    this.routerPid = options.routerPid ?? process.pid;
    this.sessionId = options.sessionId ?? `session-${this.routerPid}`;
  }

  async ensureWorker(repo: RepoHandle): Promise<WorkerState> {
    const existing = this.workers.get(repo.id);
    if (existing) {
      return existing;
    }

    const inFlight = this.workerPromises.get(repo.id);
    if (inFlight) {
      return inFlight;
    }

    const pendingSpawn = Promise.resolve(this.spawnWorker(repo));
    this.workerPromises.set(repo.id, pendingSpawn);

    try {
      const state = await pendingSpawn;
      this.workers.set(repo.id, state);
      return state;
    } finally {
      this.workerPromises.delete(repo.id);
    }
  }

  async call(repo: RepoHandle, method: WorkerRequestMethod, ...args: unknown[]): Promise<unknown> {
    const state = await this.ensureWorker(repo);
    const requestId = `worker-request-${++this.requestSeq}`;
    const message: WorkerRequestMessage = {
      kind: 'request',
      requestId,
      method,
      args,
    };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        state.pending.delete(requestId);
        reject(new Error(`Repo worker request ${requestId} for ${repo.name} timed out after ${this.requestTimeoutMs}ms`));
      }, this.requestTimeoutMs);

      state.pending.set(requestId, { resolve, reject, timer });

      try {
        state.child.send(message);
      } catch (error) {
        clearTimeout(timer);
        state.pending.delete(requestId);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  async disconnect(): Promise<void> {
    const states = [...this.workers.values()];
    this.workers.clear();
    this.workerPromises.clear();

    for (const state of states) {
      this.rejectPending(state, new Error(`Repo worker for ${state.repo.name} disconnected`));
      try {
        state.child.kill('SIGTERM');
      } catch {}
    }
  }

  __testOnlyGetWorkerPid(repoId: string): number | null {
    return this.workers.get(repoId)?.child.pid ?? null;
  }

  private spawnWorker(repo: RepoHandle): Promise<WorkerState> {
    const child = this.forkWorker(this.cliEntry, ['mcp', '--repo-worker'], {
      execArgv: [],
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });

    const state: WorkerState = {
      child,
      pending: new Map(),
      repo,
    };

    return new Promise((resolve, reject) => {
      let ready = false;
      let settled = false;

      const settle = (fn: () => void) => {
        if (settled) {
          return;
        }
        settled = true;
        fn();
      };

      child.on('message', (message) => {
        if (isWorkerReadyMessage(message)) {
          ready = true;
          settle(() => resolve(state));
          return;
        }

        if (isWorkerBootstrapErrorMessage(message)) {
          settle(() => reject(new Error(`Repo worker for ${repo.name} failed to initialize: ${message.error}`)));
          return;
        }

        this.handleMessage(state, message);
      });

      child.on('exit', (code, signal) => {
        this.workers.delete(repo.id);
        this.workerPromises.delete(repo.id);
        const error = new Error(`Repo worker for ${repo.name} exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`);
        if (!ready) {
          settle(() => reject(error));
          return;
        }
        this.rejectPending(state, error);
      });

      child.on('error', (error) => {
        this.workers.delete(repo.id);
        this.workerPromises.delete(repo.id);
        const normalizedError = error instanceof Error ? error : new Error(String(error));
        if (!ready) {
          settle(() => reject(normalizedError));
          return;
        }
        this.rejectPending(state, normalizedError);
      });

      const initMessage: WorkerBootstrapMessage = {
        kind: 'init',
        repo,
        routerPid: this.routerPid,
        sessionId: this.sessionId,
      };

      try {
        child.send(initMessage);
      } catch (error) {
        settle(() => reject(error instanceof Error ? error : new Error(String(error))));
      }
    });
  }

  private handleMessage(state: WorkerState, message: unknown): void {
    if (!isWorkerResponseMessage(message)) {
      return;
    }

    const pending = state.pending.get(message.requestId);
    if (!pending) {
      return;
    }

    clearTimeout(pending.timer);
    state.pending.delete(message.requestId);

    if (message.ok) {
      pending.resolve(message.result);
      return;
    }

    pending.reject(new Error('error' in message ? message.error : 'Unknown repo worker error'));
  }

  private rejectPending(state: WorkerState, error: Error): void {
    for (const [requestId, pending] of state.pending) {
      clearTimeout(pending.timer);
      pending.reject(error);
      state.pending.delete(requestId);
    }
  }
}
