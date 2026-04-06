import { EventEmitter } from 'node:events';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NativeRuntimeManager } from '../../src/runtime/native-runtime-manager.js';

describe('NativeRuntimeManager', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes and removes reindex lock files', async () => {
    const manager = new NativeRuntimeManager();
    const storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'gitnexus-runtime-'));

    try {
      const lockPath = await manager.writeReindexLock(storagePath, 12345);
      const raw = await fs.readFile(lockPath, 'utf8');
      const payload = JSON.parse(raw);

      expect(payload.pid).toBe(12345);
      expect(typeof payload.createdAt).toBe('string');

      await manager.removeReindexLock(lockPath);
      await expect(fs.access(lockPath)).rejects.toThrow();
    } finally {
      await fs.rm(storagePath, { recursive: true, force: true });
    }
  });

  it('clears stale reindex locks for dead pids and preserves live ones', async () => {
    const manager = new NativeRuntimeManager();
    const storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'gitnexus-runtime-'));
    const staleLockPath = path.join(storagePath, 'reindexing.lock');

    try {
      await fs.writeFile(staleLockPath, JSON.stringify({ pid: 999999999, createdAt: '2026-03-24T00:00:00.000Z' }), 'utf8');

      await expect(manager.clearStaleReindexLock(staleLockPath, () => false)).resolves.toBe(true);
      await expect(fs.access(staleLockPath)).rejects.toThrow();

      await fs.writeFile(staleLockPath, JSON.stringify({ pid: 123, createdAt: '2026-03-24T00:00:00.000Z' }), 'utf8');
      await expect(manager.clearStaleReindexLock(staleLockPath, () => true)).resolves.toBe(false);
      await expect(fs.access(staleLockPath)).resolves.toBeUndefined();
    } finally {
      await fs.rm(storagePath, { recursive: true, force: true });
    }
  });

  it('refuses to overwrite a live reindex lock held by another pid', async () => {
    const manager = new NativeRuntimeManager();
    const storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'gitnexus-runtime-'));
    const lockPath = path.join(storagePath, 'reindexing.lock');

    try {
      await fs.writeFile(lockPath, JSON.stringify({ pid: process.pid, createdAt: '2026-04-06T00:00:00.000Z' }), 'utf8');

      await expect(manager.writeReindexLock(storagePath, 54321)).rejects.toThrow(/already active|rebuilding/i);

      const payload = JSON.parse(await fs.readFile(lockPath, 'utf8'));
      expect(payload.pid).toBe(process.pid);
    } finally {
      await fs.rm(storagePath, { recursive: true, force: true });
    }
  });

  it('does not delete a newer live lock while clearing a stale lock during analyze startup', async () => {
    const manager = new NativeRuntimeManager();
    const storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'gitnexus-runtime-'));
    const lockPath = path.join(storagePath, 'reindexing.lock');
    const realRemoveReindexLock = manager.removeReindexLock.bind(manager);

    try {
      await fs.writeFile(lockPath, JSON.stringify({ pid: 999999999, createdAt: '2026-04-06T00:00:00.000Z' }), 'utf8');
      vi.spyOn(manager, 'removeReindexLock')
        .mockImplementationOnce(async (targetPath, options) => {
          await fs.writeFile(lockPath, JSON.stringify({ pid: process.pid, createdAt: '2026-04-06T00:00:01.000Z' }), 'utf8');
          return realRemoveReindexLock(targetPath, options);
        })
        .mockImplementation(realRemoveReindexLock);

      await expect(manager.writeReindexLock(storagePath, 54321)).rejects.toThrow(
        new RegExp(`already active with pid ${process.pid}`, 'i'),
      );

      const payload = JSON.parse(await fs.readFile(lockPath, 'utf8'));
      expect(payload.pid).toBe(process.pid);
    } finally {
      vi.restoreAllMocks();
      await fs.rm(storagePath, { recursive: true, force: true });
    }
  });

  it('does not remove a reindex lock owned by another pid', async () => {
    const manager = new NativeRuntimeManager();
    const storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'gitnexus-runtime-'));
    const lockPath = path.join(storagePath, 'reindexing.lock');

    try {
      await fs.writeFile(lockPath, JSON.stringify({ pid: 305228, createdAt: '2026-04-06T00:31:04.411Z' }), 'utf8');

      await expect(manager.removeReindexLock(lockPath, { expectedPid: 278449 })).resolves.toBe(false);
      await expect(fs.access(lockPath)).resolves.toBeUndefined();
    } finally {
      await fs.rm(storagePath, { recursive: true, force: true });
    }
  });

  it('surfaces stale lock cleanup failures instead of silently treating them as cleared', async () => {
    const manager = new NativeRuntimeManager();
    const storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'gitnexus-runtime-'));
    const lockPath = path.join(storagePath, 'reindexing.lock');

    try {
      await fs.writeFile(lockPath, JSON.stringify({ pid: 999999999, createdAt: '2026-04-06T00:00:00.000Z' }), 'utf8');
      vi.spyOn(fs, 'rm').mockRejectedValueOnce(Object.assign(new Error('permission denied'), { code: 'EPERM' }));

      await expect(manager.clearStaleReindexLock(lockPath, () => false)).rejects.toThrow(/stale reindex lock|permission denied|EPERM/i);
      await expect(fs.access(lockPath)).resolves.toBeUndefined();
    } finally {
      vi.restoreAllMocks();
      await fs.rm(storagePath, { recursive: true, force: true });
    }
  });

  it('reports a live reindex lock as an active rebuild with the owning pid', async () => {
    const manager = new NativeRuntimeManager();
    const storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'gitnexus-runtime-'));
    const lockPath = path.join(storagePath, 'reindexing.lock');

    try {
      await fs.writeFile(lockPath, JSON.stringify({ pid: process.pid, createdAt: '2026-04-06T00:00:00.000Z' }), 'utf8');

      await expect(manager.assertNoActiveReindexLock(storagePath, 'repo-a')).rejects.toThrow(
        new RegExp(`rebuilding the index \\(pid ${process.pid}\\)`, 'i'),
      );
    } finally {
      await fs.rm(storagePath, { recursive: true, force: true });
    }
  });

  it('reports stale undeletable locks differently from active rebuilds', async () => {
    const manager = new NativeRuntimeManager();
    const storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'gitnexus-runtime-'));
    const lockPath = path.join(storagePath, 'reindexing.lock');

    try {
      await fs.writeFile(lockPath, JSON.stringify({ pid: 999999999, createdAt: '2026-04-06T00:00:00.000Z' }), 'utf8');
      vi.spyOn(fs, 'rm').mockRejectedValueOnce(Object.assign(new Error('permission denied'), { code: 'EPERM' }));

      await expect(manager.assertNoActiveReindexLock(storagePath, 'repo-a')).rejects.toThrow(/stale reindex lock for dead pid 999999999/i);
    } finally {
      vi.restoreAllMocks();
      await fs.rm(storagePath, { recursive: true, force: true });
    }
  });

  it('rechecks the lock before MCP cleanup so a new live analyze lock is not deleted', async () => {
    const manager = new NativeRuntimeManager();
    const storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'gitnexus-runtime-'));
    const lockPath = path.join(storagePath, 'reindexing.lock');
    const realRemoveReindexLock = manager.removeReindexLock.bind(manager);

    try {
      await fs.writeFile(lockPath, JSON.stringify({ pid: 999999999, createdAt: '2026-04-06T00:00:00.000Z' }), 'utf8');
      vi.spyOn(manager, 'removeReindexLock')
        .mockImplementationOnce(async () => {
          await fs.writeFile(lockPath, JSON.stringify({ pid: process.pid, createdAt: '2026-04-06T00:00:01.000Z' }), 'utf8');
          return false;
        })
        .mockImplementation(realRemoveReindexLock);

      await expect(manager.assertNoActiveReindexLock(storagePath, 'repo-a')).rejects.toThrow(
        new RegExp(`rebuilding the index \\(pid ${process.pid}\\)`, 'i'),
      );

      const payload = JSON.parse(await fs.readFile(lockPath, 'utf8'));
      expect(payload.pid).toBe(process.pid);
    } finally {
      vi.restoreAllMocks();
      await fs.rm(storagePath, { recursive: true, force: true });
    }
  });

  it('treats a pid as dead on linux when the pid probe reports it missing even if process.kill succeeds', () => {
    const manager = new NativeRuntimeManager();
    const killSpy = vi.spyOn(process, 'kill').mockImplementation(() => true as never);

    expect(manager.isPidAlive(267021, {
      platform: 'linux',
      pidProbe: () => false,
    })).toBe(false);
    expect(killSpy).not.toHaveBeenCalled();
  });

  it('tracks Kuzu repo active state', () => {
    const manager = new NativeRuntimeManager();

    expect(manager.isKuzuRepoActive('repo-a')).toBe(false);
    manager.markKuzuRepoActive('repo-a');
    expect(manager.isKuzuRepoActive('repo-a')).toBe(true);
    manager.markKuzuRepoInactive('repo-a');
    expect(manager.isKuzuRepoActive('repo-a')).toBe(false);
    expect(manager.getSnapshot()).toEqual({
      activeKuzuRepos: 0,
      activeRepoIds: [],
      coreEmbedderActive: false,
      mcpEmbedderActive: false,
    });
  });

  it('registers and unregisters shutdown handlers', () => {
    const manager = new NativeRuntimeManager();
    const processLike = new EventEmitter();
    let sigintCalls = 0;
    let sigtermCalls = 0;

    const unregister = manager.registerShutdownHandlers(
      processLike,
      () => { sigintCalls++; },
      () => { sigtermCalls++; },
    );

    processLike.emit('SIGINT');
    processLike.emit('SIGTERM');

    expect(sigintCalls).toBe(1);
    expect(sigtermCalls).toBe(1);

    unregister();
    processLike.emit('SIGINT');
    processLike.emit('SIGTERM');

    expect(sigintCalls).toBe(1);
    expect(sigtermCalls).toBe(1);
  });

  it('schedules delayed process exits through an injectable timer', () => {
    const manager = new NativeRuntimeManager();
    const exitCalls: number[] = [];
    const scheduled: Array<{ delayMs: number; fn: () => void }> = [];

    manager.scheduleExit(143, {
      delayMs: 25,
      exit: (code) => { exitCalls.push(code); },
      schedule: (fn, delayMs) => {
        scheduled.push({ fn, delayMs });
        return { delayMs };
      },
    });

    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].delayMs).toBe(25);
    scheduled[0].fn();
    expect(exitCalls).toEqual([143]);
  });

  it('returns a runtime snapshot for diagnostics', () => {
    const manager = new NativeRuntimeManager();

    manager.markKuzuRepoActive('repo-a');
    manager.markKuzuRepoActive('repo-b');

    expect(manager.getSnapshot()).toEqual({
      activeKuzuRepos: 2,
      activeRepoIds: ['repo-a', 'repo-b'],
      coreEmbedderActive: false,
      mcpEmbedderActive: false,
    });
  });

  it('tracks core and mcp embedder readiness in the runtime snapshot', () => {
    const manager = new NativeRuntimeManager();

    manager.markEmbedderActive('core');
    manager.markEmbedderActive('mcp');

    expect(manager.getSnapshot()).toEqual({
      activeKuzuRepos: 0,
      activeRepoIds: [],
      coreEmbedderActive: true,
      mcpEmbedderActive: true,
    });

    manager.markEmbedderInactive('mcp');
    expect(manager.getSnapshot()).toEqual({
      activeKuzuRepos: 0,
      activeRepoIds: [],
      coreEmbedderActive: true,
      mcpEmbedderActive: false,
    });
  });

  it('runs async cleanup before scheduling exit', async () => {
    const manager = new NativeRuntimeManager();
    const calls: string[] = [];

    await manager.runCleanupAndExit(130, {
      cleanup: async () => {
        calls.push('cleanup');
      },
      scheduleExit: async (code) => {
        calls.push(`exit:${code}`);
      },
    });

    expect(calls).toEqual(['cleanup', 'exit:130']);
  });

  it('cleans up MCP runtime without disposing the embedder state', async () => {
    const manager = new NativeRuntimeManager();
    const calls: string[] = [];

    manager.markEmbedderActive('mcp');

    await manager.cleanupMcpRuntime(async () => {
      calls.push('close-kuzu');
    });

    expect(calls).toEqual(['close-kuzu']);
    expect(manager.getSnapshot().mcpEmbedderActive).toBe(true);
  });

  it('cleans up core runtime without disposing the embedder state', async () => {
    const manager = new NativeRuntimeManager();
    const calls: string[] = [];

    manager.markEmbedderActive('core');

    await manager.cleanupCoreRuntime(async () => {
      calls.push('close-kuzu');
    });

    expect(calls).toEqual(['close-kuzu']);
    expect(manager.getSnapshot().coreEmbedderActive).toBe(true);
  });
});
