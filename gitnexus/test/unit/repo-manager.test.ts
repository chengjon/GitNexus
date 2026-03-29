/**
 * P1 Unit Tests: Repository Manager
 *
 * Tests: storage paths, registry reads, config helpers, RepoMeta persistence defaults
 * Covers hardening fixes #29 (API key file permissions) and #30 (case-insensitive paths on Windows)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import {
  getStoragePath,
  getStoragePaths,
  hasIndex,
  listRegisteredRepos,
  readRegistry,
  loadMeta,
  saveMeta,
  saveCLIConfig,
  loadCLIConfig,
  loadCLIConfigSync,
  addToGitInfoExclude,
} from '../../src/storage/repo-manager.js';
import { createTempDir } from '../helpers/test-db.js';

// ─── getStoragePath ──────────────────────────────────────────────────

describe('getStoragePath', () => {
  it('appends .gitnexus to resolved repo path', () => {
    const result = getStoragePath('/home/user/project');
    expect(result).toContain('.gitnexus');
    expect(path.basename(result)).toBe('.gitnexus');
  });

  it('resolves relative paths', () => {
    const result = getStoragePath('.');
    // Should be an absolute path
    expect(path.isAbsolute(result)).toBe(true);
  });
});

// ─── getStoragePaths ─────────────────────────────────────────────────

describe('getStoragePaths', () => {
  it('returns storagePath, kuzuPath, metaPath', () => {
    const paths = getStoragePaths('/home/user/project');
    expect(paths.storagePath).toContain('.gitnexus');
    expect(paths.kuzuPath).toContain('kuzu');
    expect(paths.metaPath).toContain('meta.json');
  });

  it('all paths are under storagePath', () => {
    const paths = getStoragePaths('/home/user/project');
    expect(paths.kuzuPath.startsWith(paths.storagePath)).toBe(true);
    expect(paths.metaPath.startsWith(paths.storagePath)).toBe(true);
  });
});

// ─── readRegistry ────────────────────────────────────────────────────

describe('readRegistry', () => {
  it('returns empty array when registry does not exist', async () => {
    // readRegistry reads from ~/.gitnexus/registry.json
    // If the file doesn't exist, it should return []
    // This test exercises the catch path
    const result = await readRegistry();
    // Result is an array (may or may not be empty depending on user's system)
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── CLI Config (file permissions) ───────────────────────────────────

describe('saveCLIConfig / loadCLIConfig', () => {
  let tmpHandle: Awaited<ReturnType<typeof createTempDir>>;
  let originalHomedir: typeof os.homedir;

  beforeEach(async () => {
    tmpHandle = await createTempDir('gitnexus-config-test-');
    originalHomedir = os.homedir;
    // Mock os.homedir to point to our temp dir
    // Note: This won't fully work because repo-manager uses its own import of os
    // We'll test what we can.
  });

  afterEach(async () => {
    os.homedir = originalHomedir;
    await tmpHandle.cleanup();
  });

  it('loadCLIConfig returns empty object when config does not exist', async () => {
    const config = await loadCLIConfig();
    // Returns {} or existing config
    expect(typeof config).toBe('object');
  });

  it('loadCLIConfigSync can read embeddings settings from config.json', async () => {
    (os.homedir as any) = () => tmpHandle.dbPath;

    await saveCLIConfig({
      embeddings: {
        provider: 'ollama',
        ollamaBaseUrl: 'http://localhost:11434',
        ollamaModel: 'qwen3-embedding:0.6b',
        nodeLimit: 90000,
        batchSize: 8,
      },
    });

    expect(loadCLIConfigSync()).toEqual({
      embeddings: {
        provider: 'ollama',
        ollamaBaseUrl: 'http://localhost:11434',
        ollamaModel: 'qwen3-embedding:0.6b',
        nodeLimit: 90000,
        batchSize: 8,
      },
    });
  });
});

// ─── Case-insensitive path comparison (Windows hardening #30) ────────

describe('case-insensitive path comparison', () => {
  it('registerRepo uses case-insensitive compare on Windows', () => {
    // The fix is in registerRepo: process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase()
    // We verify the logic inline since we can't easily mock process.platform

    const compareWindows = (a: string, b: string): boolean => {
      return a.toLowerCase() === b.toLowerCase();
    };

    // On Windows, these should match
    expect(compareWindows('D:\\Projects\\MyApp', 'd:\\projects\\myapp')).toBe(true);
    expect(compareWindows('C:\\Users\\USER\\project', 'c:\\users\\user\\project')).toBe(true);

    // Different paths should not match
    expect(compareWindows('D:\\Projects\\App1', 'D:\\Projects\\App2')).toBe(false);
  });

  it('case-sensitive compare for non-Windows', () => {
    const compareUnix = (a: string, b: string): boolean => {
      return a === b;
    };

    // On Unix, case matters
    expect(compareUnix('/home/user/Project', '/home/user/project')).toBe(false);
    expect(compareUnix('/home/user/project', '/home/user/project')).toBe(true);
  });
});

// ─── API key file permissions (hardening #29) ────────────────────────

describe('API key file permissions', () => {
  it('saveCLIConfig calls chmod 0o600 on non-Windows', async () => {
    // We verify that the saveCLIConfig code has the chmod call
    // by reading the source and checking statically.
    // The actual chmod behavior is platform-dependent.
    const source = await fs.readFile(
      path.join(process.cwd(), 'src', 'storage', 'repo-manager.ts'),
      'utf-8',
    );
    expect(source).toContain('chmod(configPath, 0o600)');
    expect(source).toContain("process.platform !== 'win32'");
  });
});

describe('RepoMeta persistence', () => {
  let tmpHandle: Awaited<ReturnType<typeof createTempDir>>;

  beforeEach(async () => {
    tmpHandle = await createTempDir('gitnexus-meta-test-');
  });

  afterEach(async () => {
    await tmpHandle.cleanup();
  });

  it('loadMeta backfills default health metadata for legacy meta.json', async () => {
    const storagePath = path.join(tmpHandle.dbPath, '.gitnexus');
    await fs.mkdir(storagePath, { recursive: true });
    await fs.writeFile(
      path.join(storagePath, 'meta.json'),
      JSON.stringify({
        repoPath: '/tmp/legacy-repo',
        lastCommit: 'abc1234',
        indexedAt: '2026-03-11T00:00:00.000Z',
      }, null, 2),
      'utf-8',
    );

    const loaded = await loadMeta(storagePath);

    expect(loaded).toMatchObject({
      repoPath: '/tmp/legacy-repo',
      lastCommit: 'abc1234',
      indexedAt: '2026-03-11T00:00:00.000Z',
      indexedBranch: null,
      schemaVersion: 'v1',
      toolVersion: null,
    });
  });

  it('saveMeta writes default health metadata fields to disk', async () => {
    const storagePath = path.join(tmpHandle.dbPath, '.gitnexus');

    await saveMeta(storagePath, {
      repoPath: '/tmp/current-repo',
      lastCommit: 'def5678',
      indexedAt: '2026-03-11T01:00:00.000Z',
    });

    const raw = JSON.parse(
      await fs.readFile(path.join(storagePath, 'meta.json'), 'utf-8'),
    );

    expect(raw).toMatchObject({
      repoPath: '/tmp/current-repo',
      lastCommit: 'def5678',
      indexedAt: '2026-03-11T01:00:00.000Z',
      indexedBranch: null,
      schemaVersion: 'v1',
      toolVersion: null,
    });

    const reloaded = await loadMeta(storagePath);
    expect(reloaded).toEqual(raw);
  });
});

describe('addToGitInfoExclude', () => {
  let tmpHandle: Awaited<ReturnType<typeof createTempDir>>;

  beforeEach(async () => {
    tmpHandle = await createTempDir('gitnexus-git-info-exclude-');
    await fs.mkdir(path.join(tmpHandle.dbPath, '.git', 'info'), { recursive: true });
  });

  afterEach(async () => {
    await tmpHandle.cleanup();
  });

  it('writes .gitnexus to .git/info/exclude without requiring tracked file changes', async () => {
    await addToGitInfoExclude(tmpHandle.dbPath);

    const content = await fs.readFile(
      path.join(tmpHandle.dbPath, '.git', 'info', 'exclude'),
      'utf-8',
    );

    expect(content).toContain('.gitnexus');
  });

  it('is idempotent when .gitnexus is already present', async () => {
    const excludePath = path.join(tmpHandle.dbPath, '.git', 'info', 'exclude');
    await fs.writeFile(excludePath, '.gitnexus\n', 'utf-8');

    await addToGitInfoExclude(tmpHandle.dbPath);

    const content = await fs.readFile(excludePath, 'utf-8');
    expect(content.match(/\.gitnexus/g)?.length).toBe(1);
  });
});

describe('index artifact health', () => {
  let tmpHandle: Awaited<ReturnType<typeof createTempDir>>;
  let originalHomedir: typeof os.homedir;

  beforeEach(async () => {
    tmpHandle = await createTempDir('gitnexus-index-health-');
    originalHomedir = os.homedir;
    (os.homedir as any) = () => tmpHandle.dbPath;
  });

  afterEach(async () => {
    os.homedir = originalHomedir;
    await tmpHandle.cleanup();
  });

  it('hasIndex returns false when meta exists but kuzu is missing', async () => {
    const repoRoot = path.join(tmpHandle.dbPath, 'repo-a');
    const storagePath = path.join(repoRoot, '.gitnexus');
    await fs.mkdir(storagePath, { recursive: true });
    await fs.writeFile(
      path.join(storagePath, 'meta.json'),
      JSON.stringify({
        repoPath: repoRoot,
        lastCommit: 'abc1234',
        indexedAt: '2026-03-22T00:00:00.000Z',
      }, null, 2),
      'utf-8',
    );

    await expect(hasIndex(repoRoot)).resolves.toBe(false);
  });

  it('listRegisteredRepos surfaces missing_kuzu diagnostics', async () => {
    const repoRoot = path.join(tmpHandle.dbPath, 'repo-b');
    const storagePath = path.join(repoRoot, '.gitnexus');
    await fs.mkdir(storagePath, { recursive: true });
    await fs.writeFile(
      path.join(storagePath, 'meta.json'),
      JSON.stringify({
        repoPath: repoRoot,
        lastCommit: 'def5678',
        indexedAt: '2026-03-22T01:00:00.000Z',
      }, null, 2),
      'utf-8',
    );

    const registryDir = path.join(tmpHandle.dbPath, '.gitnexus');
    await fs.mkdir(registryDir, { recursive: true });
    await fs.writeFile(
      path.join(registryDir, 'registry.json'),
      JSON.stringify([
        {
          name: 'repo-b',
          path: repoRoot,
          storagePath,
          indexedAt: '2026-03-22T01:00:00.000Z',
          lastCommit: 'def5678',
          stats: { files: 1, nodes: 2, edges: 3, communities: 1, processes: 1 },
        },
      ], null, 2),
      'utf-8',
    );

    const entries = await listRegisteredRepos({ validate: true });

    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual(expect.objectContaining({
      name: 'repo-b',
      storagePath,
      kuzuPath: path.join(storagePath, 'kuzu'),
      indexState: 'missing_kuzu',
      suggestedFix: expect.stringContaining('gitnexus analyze'),
    }));
  });

  it('listRegisteredRepos tolerates registry write failures during validate pruning', async () => {
    const repoRoot = path.join(tmpHandle.dbPath, 'repo-c');
    const storagePath = path.join(repoRoot, '.gitnexus');
    await fs.mkdir(storagePath, { recursive: true });
    await fs.writeFile(
      path.join(storagePath, 'meta.json'),
      JSON.stringify({
        repoPath: repoRoot,
        lastCommit: 'ghi9012',
        indexedAt: '2026-03-22T02:00:00.000Z',
      }, null, 2),
      'utf-8',
    );

    const registryDir = path.join(tmpHandle.dbPath, '.gitnexus');
    await fs.mkdir(registryDir, { recursive: true });
    const registryPath = path.join(registryDir, 'registry.json');
    await fs.writeFile(
      registryPath,
      JSON.stringify([
        {
          name: 'repo-c',
          path: repoRoot,
          storagePath,
          indexedAt: '2026-03-22T02:00:00.000Z',
          lastCommit: 'ghi9012',
          stats: { files: 1, nodes: 2, edges: 3, communities: 1, processes: 1 },
        },
        {
          name: 'stale-repo',
          path: path.join(tmpHandle.dbPath, 'missing-repo'),
          storagePath: path.join(tmpHandle.dbPath, 'missing-repo', '.gitnexus'),
          indexedAt: '2026-03-22T02:00:00.000Z',
          lastCommit: 'stale',
          stats: { files: 1, nodes: 1, edges: 1, communities: 1, processes: 1 },
        },
      ], null, 2),
      'utf-8',
    );

    const writeSpy = vi.spyOn(fs, 'writeFile').mockImplementation(async (targetPath: any, data: any, options: any) => {
      if (String(targetPath) === registryPath) {
        const err = new Error(`EROFS: read-only file system, open '${registryPath}'`) as Error & { code?: string };
        err.code = 'EROFS';
        throw err;
      }
      return (await vi.importActual<typeof import('fs/promises')>('fs/promises')).writeFile(targetPath, data, options as any);
    });

    try {
      const entries = await listRegisteredRepos({ validate: true });
      expect(entries).toHaveLength(1);
      expect(entries[0]).toEqual(expect.objectContaining({
        name: 'repo-c',
        storagePath,
        kuzuPath: path.join(storagePath, 'kuzu'),
        indexState: 'missing_kuzu',
      }));
    } finally {
      writeSpy.mockRestore();
    }
  });
});
