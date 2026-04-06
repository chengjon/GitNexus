import fs from 'fs/promises';
import { spawnSync } from 'child_process';
import path from 'path';

const REINDEX_LOCK_FILENAME = 'reindexing.lock';

export interface ReindexLockPayload {
  pid: number;
  createdAt: string;
}

export interface NativeRuntimeSnapshot {
  activeKuzuRepos: number;
  activeRepoIds: string[];
  coreEmbedderActive: boolean;
  mcpEmbedderActive: boolean;
}

interface SignalTarget {
  on(event: 'SIGINT' | 'SIGTERM', listener: () => void): unknown;
  removeListener(event: 'SIGINT' | 'SIGTERM', listener: () => void): unknown;
}

interface ScheduleExitOptions {
  delayMs?: number;
  exit?: (code: number) => void;
  schedule?: (fn: () => void, delayMs: number) => unknown;
}

interface CleanupAndExitOptions {
  cleanup?: () => Promise<void> | void;
  scheduleExit?: (code: number) => Promise<void> | void;
}

interface RemoveReindexLockOptions {
  expectedPid?: number;
  strict?: boolean;
}

export class NativeRuntimeManager {
  private activeKuzuRepos = new Set<string>();
  private activeEmbedders = new Set<'core' | 'mcp'>();

  getReindexLockPath(storagePath: string): string {
    return path.join(storagePath, REINDEX_LOCK_FILENAME);
  }

  async writeReindexLock(storagePath: string, pid = process.pid): Promise<string> {
    const lockPath = this.getReindexLockPath(storagePath);
    await fs.mkdir(storagePath, { recursive: true });

    for (let attempt = 0; attempt < 2; attempt++) {
      const existingPayload = await this.readReindexLock(lockPath);
      if (existingPayload) {
        if (!Number.isInteger(existingPayload.pid)) {
          throw new Error(`Found invalid reindex lock at ${lockPath}. Remove it and retry.`);
        }
        if (this.isPidAlive(existingPayload.pid)) {
          throw new Error(`Reindex already active with pid ${existingPayload.pid} (${lockPath})`);
        }
        await this.clearStaleReindexLock(lockPath);
      } else if (await this.reindexLockExists(lockPath)) {
        throw new Error(`Found unreadable reindex lock at ${lockPath}. Remove it and retry.`);
      }

      try {
        await fs.writeFile(lockPath, JSON.stringify({
          pid,
          createdAt: new Date().toISOString(),
        }, null, 2), {
          encoding: 'utf8',
          flag: 'wx',
        });
        return lockPath;
      } catch (err: any) {
        if (err?.code === 'EEXIST') continue;
        throw err;
      }
    }

    throw new Error(`Reindex already active with another process (${lockPath})`);
  }

  async removeReindexLock(lockPath: string, options: RemoveReindexLockOptions = {}): Promise<boolean> {
    if (typeof options.expectedPid === 'number') {
      const payload = await this.readReindexLock(lockPath);
      if (payload && Number.isInteger(payload.pid) && payload.pid !== options.expectedPid) {
        return false;
      }
      if (!payload && await this.reindexLockExists(lockPath)) {
        return false;
      }
    }

    try {
      await fs.rm(lockPath);
      return true;
    } catch (err: any) {
      if (err?.code === 'ENOENT') return false;
      if (options.strict) throw err;
      return false;
    }
  }

  async readReindexLock(lockPath: string): Promise<ReindexLockPayload | null> {
    try {
      const raw = await fs.readFile(lockPath, 'utf8');
      return JSON.parse(raw) as ReindexLockPayload;
    } catch {
      return null;
    }
  }

  private async reindexLockExists(lockPath: string): Promise<boolean> {
    try {
      await fs.access(lockPath);
      return true;
    } catch {
      return false;
    }
  }

  isPidAlive(
    pid: number,
    options: {
      platform?: NodeJS.Platform;
      pidProbe?: (pid: number) => boolean;
    } = {},
  ): boolean {
    const platform = options.platform ?? process.platform;
    const pidProbe = options.pidProbe ?? ((targetPid: number) => {
      const result = spawnSync('ps', ['-p', String(targetPid), '-o', 'pid='], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      return result.status === 0 && result.stdout.trim() === String(targetPid);
    });

    if (platform === 'linux') {
      return pidProbe(pid);
    }

    try {
      process.kill(pid, 0);
      return true;
    } catch (err: any) {
      if (err?.code === 'ESRCH') return false;
      if (err?.code === 'EPERM') return true;
      return true;
    }
  }

  async clearStaleReindexLock(
    lockPath: string,
    isPidAlive: (pid: number) => boolean = (pid) => this.isPidAlive(pid),
  ): Promise<boolean> {
    const payload = await this.readReindexLock(lockPath);
    if (!payload) return false;
    if (!Number.isInteger(payload.pid)) return false;
    if (isPidAlive(payload.pid)) return false;
    try {
      const removed = await this.removeReindexLock(lockPath, {
        expectedPid: payload.pid,
        strict: true,
      });
      return removed;
    } catch (err: any) {
      throw new Error(
        `Found stale reindex lock for dead pid ${payload.pid} at ${lockPath} but could not remove it: ${err?.message ?? String(err)}`,
      );
    }
  }

  async assertNoActiveReindexLock(storagePath: string, repoId: string): Promise<void> {
    const lockPath = this.getReindexLockPath(storagePath);
    for (let attempt = 0; attempt < 2; attempt++) {
      const payload = await this.readReindexLock(lockPath);

      if (!payload) {
        if (!await this.reindexLockExists(lockPath)) return;
        throw new Error(
          `KuzuDB unavailable for ${repoId}. Found unreadable reindex lock. ` +
          `Remove it or rerun analyze. (${lockPath})`,
        );
      }

      if (!Number.isInteger(payload.pid)) {
        throw new Error(
          `KuzuDB unavailable for ${repoId}. Found invalid reindex lock payload. ` +
          `Remove it or rerun analyze. (${lockPath})`,
        );
      }

      if (this.isPidAlive(payload.pid)) {
        throw new Error(
          `KuzuDB unavailable for ${repoId}. GitNexus is rebuilding the index ` +
          `(pid ${payload.pid}). Retry after analyze completes. (${lockPath})`,
        );
      }

      try {
        const removed = await this.removeReindexLock(lockPath, {
          expectedPid: payload.pid,
          strict: true,
        });
        if (removed) return;
      } catch (err: any) {
        throw new Error(
          `KuzuDB unavailable for ${repoId}. Found stale reindex lock for dead pid ${payload.pid} ` +
          `but could not remove it. ${err?.message ?? String(err)} (${lockPath})`,
        );
      }
    }

    throw new Error(
      `KuzuDB unavailable for ${repoId}. Reindex lock changed while stale-lock cleanup was in progress. ` +
      `Retry after analyze completes. (${lockPath})`,
    );
  }

  markKuzuRepoActive(repoId: string): void {
    this.activeKuzuRepos.add(repoId);
  }

  markKuzuRepoInactive(repoId: string): void {
    this.activeKuzuRepos.delete(repoId);
  }

  isKuzuRepoActive(repoId: string): boolean {
    return this.activeKuzuRepos.has(repoId);
  }

  markEmbedderActive(kind: 'core' | 'mcp'): void {
    this.activeEmbedders.add(kind);
  }

  markEmbedderInactive(kind: 'core' | 'mcp'): void {
    this.activeEmbedders.delete(kind);
  }

  isEmbedderActive(kind: 'core' | 'mcp'): boolean {
    return this.activeEmbedders.has(kind);
  }

  getSnapshot(): NativeRuntimeSnapshot {
    return {
      activeKuzuRepos: this.activeKuzuRepos.size,
      activeRepoIds: [...this.activeKuzuRepos].sort(),
      coreEmbedderActive: this.activeEmbedders.has('core'),
      mcpEmbedderActive: this.activeEmbedders.has('mcp'),
    };
  }

  registerShutdownHandlers(
    target: SignalTarget,
    onSigInt: () => void,
    onSigTerm: () => void,
  ): () => void {
    target.on('SIGINT', onSigInt);
    target.on('SIGTERM', onSigTerm);
    return () => {
      target.removeListener('SIGINT', onSigInt);
      target.removeListener('SIGTERM', onSigTerm);
    };
  }

  scheduleExit(
    exitCode: number,
    options: ScheduleExitOptions = {},
  ): unknown {
    const delayMs = options.delayMs ?? 0;
    const exit = options.exit ?? ((code: number) => process.exit(code));
    const schedule = options.schedule ?? ((fn: () => void, ms: number) => setTimeout(fn, ms));
    return schedule(() => exit(exitCode), delayMs);
  }

  async runCleanupAndExit(
    exitCode: number,
    options: CleanupAndExitOptions = {},
  ): Promise<void> {
    if (options.cleanup) {
      await options.cleanup();
    }
    if (options.scheduleExit) {
      await options.scheduleExit(exitCode);
      return;
    }
    this.scheduleExit(exitCode);
  }

  async cleanupMcpRuntime(closeKuzu: () => Promise<void>): Promise<void> {
    await closeKuzu();
    // Intentionally do not dispose the MCP embedder here.
    // The current ONNX / transformers native cleanup path is not considered
    // safe enough to make implicit during shutdown, so runtime policy keeps
    // the embedder loaded until process exit.
  }

  async cleanupCoreRuntime(closeKuzu: () => Promise<void>): Promise<void> {
    await closeKuzu();
    // Intentionally do not dispose the core embedder here for the same reason.
  }
}

export const nativeRuntimeManager = new NativeRuntimeManager();
