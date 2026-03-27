import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModuleTreeNode } from '../../src/core/wiki/module-tree/types.js';

const mocks = vi.hoisted(() => ({
  unlink: vi.fn(async () => undefined),
  shouldIgnorePath: vi.fn(() => false),
}));

vi.mock('fs/promises', () => ({
  __esModule: true,
  unlink: mocks.unlink,
  default: {
    unlink: mocks.unlink,
  },
}));

vi.mock('../../src/config/ignore-service.js', () => ({
  shouldIgnorePath: mocks.shouldIgnorePath,
}));

async function loadIncrementalModule(): Promise<{
  runIncrementalUpdate: (options: unknown, deps: unknown) => Promise<unknown>;
}> {
  const incrementalModule = await import('../../src/core/wiki/incremental-update.js');
  return {
    runIncrementalUpdate: incrementalModule.runIncrementalUpdate,
  };
}

function makeLeafNode(): ModuleTreeNode {
  return {
    name: 'Core',
    slug: 'core',
    files: ['src/core/util.ts'],
  };
}

function makeParentNode(): ModuleTreeNode {
  return {
    name: 'Backend',
    slug: 'backend',
    files: [],
    children: [
      { name: 'Auth', slug: 'auth', files: ['src/auth/login.ts'] },
    ],
  };
}

function makeExistingMeta() {
  return {
    fromCommit: 'old-commit',
    generatedAt: '2026-03-27T00:00:00.000Z',
    model: 'mock-model',
    moduleFiles: {
      Backend: ['src/auth/login.ts'],
      Core: ['src/core/util.ts'],
    },
    moduleTree: [makeParentNode(), makeLeafNode()],
  };
}

function makeBaseOptions(overrides: Record<string, unknown> = {}) {
  const existingMeta = makeExistingMeta();

  return {
    existingMeta,
    currentCommit: 'new-commit',
    wikiDir: '/tmp/wiki',
    repoPath: '/tmp/repo',
    llmConfig: { model: 'mock-model' },
    maxTokensPerModule: 1000,
    failedModules: [],
    onProgress: vi.fn(),
    streamOpts: vi.fn(() => ({})),
    getChangedFiles: vi.fn(() => []),
    slugify: vi.fn((name: string) => name.toLowerCase()),
    findNodeBySlug: vi.fn((tree: ModuleTreeNode[], slug: string) => tree.find((node) => node.slug === slug) ?? null),
    saveWikiMeta: vi.fn(async () => undefined),
    deleteSnapshot: vi.fn(async () => undefined),
    fullGeneration: vi.fn(async () => ({ pagesGenerated: 7, mode: 'full', failedModules: ['Backend'] })),
    runParallel: vi.fn(async <T,>(items: T[], fn: (item: T) => Promise<number>) => {
      let total = 0;
      for (const item of items) {
        total += await fn(item);
      }
      return total;
    }),
    readSourceFiles: vi.fn(async () => 'source'),
    truncateSource: vi.fn((source: string) => source),
    ...overrides,
  };
}

function makeDeps(overrides: Record<string, unknown> = {}) {
  return {
    generateLeafPage: vi.fn(async () => undefined),
    generateParentPage: vi.fn(async () => undefined),
    generateOverviewPage: vi.fn(async () => undefined),
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.unlink.mockResolvedValue(undefined);
  mocks.shouldIgnorePath.mockReturnValue(false);
});

describe('runIncrementalUpdate contracts', () => {
  it('returns metadata-only incremental updates when no files changed', async () => {
    const { runIncrementalUpdate } = await loadIncrementalModule();
    const options = makeBaseOptions({
      getChangedFiles: vi.fn(() => []),
    });
    const deps = makeDeps();

    const result = await runIncrementalUpdate(options as any, deps as any);

    expect(options.saveWikiMeta).toHaveBeenCalledWith(expect.objectContaining({
      fromCommit: 'new-commit',
      model: 'mock-model',
    }));
    expect(deps.generateOverviewPage).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      pagesGenerated: 0,
      mode: 'incremental',
      failedModules: [],
    });
  });

  it('falls back to full generation after deleting the snapshot when many new files appear', async () => {
    const { runIncrementalUpdate } = await loadIncrementalModule();
    const changedFiles = [
      'src/new/a.ts',
      'src/new/b.ts',
      'src/new/c.ts',
      'src/new/d.ts',
      'src/new/e.ts',
      'src/new/f.ts',
    ];
    const deleteSnapshot = vi.fn(async () => {
      await mocks.unlink('/tmp/wiki/first_module_tree.json');
    });
    const options = makeBaseOptions({
      getChangedFiles: vi.fn(() => changedFiles),
      deleteSnapshot,
    });
    const result = await runIncrementalUpdate(options as any, makeDeps() as any);

    expect(options.deleteSnapshot).toHaveBeenCalledTimes(1);
    expect(mocks.unlink).toHaveBeenCalledWith('/tmp/wiki/first_module_tree.json');
    expect(options.fullGeneration).toHaveBeenCalledWith('new-commit');
    expect(options.deleteSnapshot.mock.invocationCallOrder[0]).toBeLessThan(
      options.fullGeneration.mock.invocationCallOrder[0],
    );
    expect(result).toMatchObject({
      pagesGenerated: 7,
      mode: 'incremental',
      failedModules: ['Backend'],
    });
  });

  it('regenerates affected parent and leaf nodes through injected page helpers', async () => {
    const { runIncrementalUpdate } = await loadIncrementalModule();
    const options = makeBaseOptions({
      getChangedFiles: vi.fn(() => ['src/auth/login.ts', 'src/core/util.ts']),
    });
    const deps = makeDeps();

    await runIncrementalUpdate(options as any, deps as any);

    expect(mocks.unlink).toHaveBeenCalledWith('/tmp/wiki/backend.md');
    expect(mocks.unlink).toHaveBeenCalledWith('/tmp/wiki/core.md');
    expect(deps.generateParentPage).toHaveBeenCalledWith(expect.objectContaining({ slug: 'backend' }));
    expect(deps.generateLeafPage).toHaveBeenCalledWith(expect.objectContaining({ slug: 'core' }));
    expect(deps.generateOverviewPage).toHaveBeenCalledWith(options.existingMeta.moduleTree);
  });

  it('does not regenerate overview when changed files do not map to module nodes', async () => {
    const { runIncrementalUpdate } = await loadIncrementalModule();
    const options = makeBaseOptions({
      getChangedFiles: vi.fn(() => ['src/new-file.ts']),
      findNodeBySlug: vi.fn(() => null),
    });
    const deps = makeDeps();

    const result = await runIncrementalUpdate(options as any, deps as any);

    expect(deps.generateParentPage).not.toHaveBeenCalled();
    expect(deps.generateLeafPage).not.toHaveBeenCalled();
    expect(deps.generateOverviewPage).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      pagesGenerated: 0,
      mode: 'incremental',
    });
  });
});
