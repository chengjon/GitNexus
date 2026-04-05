import { fork, type ChildProcess, type ForkOptions } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { RepoHandle } from './local/runtime/types.js';
import {
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
}

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

export class RepoWorkerManager {
  private cliEntry: string;
  private forkWorker: ForkWorker;
  private requestTimeoutMs: number;
  private requestSeq = 0;
  private workerPromises = new Map<string, Promise<WorkerState>>();
  private workers = new Map<string, WorkerState>();

  constructor(options: RepoWorkerManagerOptions = {}) {
    this.cliEntry = options.cliEntry || process.argv[1] || fileURLToPath(new URL('../cli/index.js', import.meta.url));
    this.forkWorker = options.forkWorker || fork;
    this.requestTimeoutMs = options.requestTimeoutMs || DEFAULT_REQUEST_TIMEOUT_MS;
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

  private spawnWorker(repo: RepoHandle): WorkerState {
    const child = this.forkWorker(this.cliEntry, ['mcp', '--repo-worker'], {
      execArgv: [],
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });

    const state: WorkerState = {
      child,
      pending: new Map(),
      repo,
    };

    child.on('message', (message) => {
      this.handleMessage(state, message);
    });

    child.on('exit', (code, signal) => {
      this.workers.delete(repo.id);
      this.workerPromises.delete(repo.id);
      this.rejectPending(state, new Error(`Repo worker for ${repo.name} exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`));
    });

    child.on('error', (error) => {
      this.workers.delete(repo.id);
      this.workerPromises.delete(repo.id);
      this.rejectPending(state, error instanceof Error ? error : new Error(String(error)));
    });

    const initMessage: WorkerBootstrapMessage = {
      kind: 'init',
      repo,
    };
    child.send(initMessage);

    return state;
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
