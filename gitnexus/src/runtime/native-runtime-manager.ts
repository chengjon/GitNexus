import fs from 'fs/promises';
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

export class NativeRuntimeManager {
  private activeKuzuRepos = new Set<string>();
  private activeEmbedders = new Set<'core' | 'mcp'>();

  getReindexLockPath(storagePath: string): string {
    return path.join(storagePath, REINDEX_LOCK_FILENAME);
  }

  async writeReindexLock(storagePath: string, pid = process.pid): Promise<string> {
    const lockPath = this.getReindexLockPath(storagePath);
    await fs.mkdir(storagePath, { recursive: true });
    await fs.writeFile(lockPath, JSON.stringify({
      pid,
      createdAt: new Date().toISOString(),
    }, null, 2), 'utf8');
    return lockPath;
  }

  async removeReindexLock(lockPath: string): Promise<void> {
    try {
      await fs.rm(lockPath, { force: true });
    } catch {
      // best-effort cleanup only
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

  isPidAlive(pid: number): boolean {
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
    await this.removeReindexLock(lockPath);
    return true;
  }

  async assertNoActiveReindexLock(storagePath: string, repoId: string): Promise<void> {
    const lockPath = this.getReindexLockPath(storagePath);
    const cleared = await this.clearStaleReindexLock(lockPath);
    if (cleared) return;

    try {
      await fs.access(lockPath);
      throw new Error(
        `KuzuDB unavailable for ${repoId}. GitNexus is rebuilding the index. ` +
        `Retry after analyze completes. (${lockPath})`,
      );
    } catch (err: any) {
      if (err?.code === 'ENOENT') return;
      throw err;
    }
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
