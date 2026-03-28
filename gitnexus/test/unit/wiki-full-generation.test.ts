import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModuleTreeNode } from '../../src/core/wiki/module-tree/types.js';

const mocks = vi.hoisted(() => ({
  getFilesWithExports: vi.fn(async () => []),
  getAllFiles: vi.fn(async () => []),
  shouldIgnorePath: vi.fn(() => false),
  buildModuleTree: vi.fn(async () => []),
  countModules: vi.fn(() => 0),
  flattenModuleTree: vi.fn(() => ({ leaves: [], parents: [] })),
}));

vi.mock('../../src/core/wiki/graph-queries.js', () => ({
  getFilesWithExports: mocks.getFilesWithExports,
  getAllFiles: mocks.getAllFiles,
}));

vi.mock('../../src/core/wiki/module-tree/builder.js', () => ({
  buildModuleTree: mocks.buildModuleTree,
  countModules: mocks.countModules,
  flattenModuleTree: mocks.flattenModuleTree,
}));

vi.mock('../../src/config/ignore-service.js', () => ({
  shouldIgnorePath: mocks.shouldIgnorePath,
}));

async function loadFullGenerationModule(): Promise<{
  runFullGeneration: (options: unknown, deps: unknown) => Promise<unknown>;
}> {
  const mod = await import('../../src/core/wiki/full-generation.js');
  return {
    runFullGeneration: mod.runFullGeneration,
  };
}

function makeLeafNode(overrides: Partial<ModuleTreeNode> = {}): ModuleTreeNode {
  return {
    name: 'Core',
    slug: 'core',
    files: ['src/core/util.ts'],
    ...overrides,
  };
}

function makeParentNode(overrides: Partial<ModuleTreeNode> = {}): ModuleTreeNode {
  return {
    name: 'Backend',
    slug: 'backend',
    files: [],
    children: [
      { name: 'Auth', slug: 'auth', files: ['src/auth/login.ts'] },
    ],
    ...overrides,
  };
}

function makeOptions(overrides: Record<string, unknown> = {}) {
  return {
    currentCommit: 'head-commit',
    wikiDir: '/tmp/wiki',
    llmConfig: { model: 'mock-model' },
    maxTokensPerModule: 1000,
    onProgress: vi.fn(),
    slugify: vi.fn((name: string) => name.toLowerCase()),
    estimateModuleTokens: vi.fn(async () => 100),
    streamOpts: vi.fn(() => ({})),
    fileExists: vi.fn(async () => false),
    saveModuleTree: vi.fn(async () => undefined),
    saveWikiMeta: vi.fn(async () => undefined),
    runParallel: vi.fn(async <T,>(items: T[], fn: (item: T) => Promise<number>) => {
      let total = 0;
      for (const item of items) {
        total += await fn(item);
      }
      return total;
    }),
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
  mocks.getFilesWithExports.mockResolvedValue([]);
  mocks.getAllFiles.mockResolvedValue([]);
  mocks.shouldIgnorePath.mockReturnValue(false);
  mocks.buildModuleTree.mockResolvedValue([]);
  mocks.countModules.mockReturnValue(0);
  mocks.flattenModuleTree.mockReturnValue({ leaves: [], parents: [] });
});

describe('runFullGeneration contracts', () => {
  it('throws when no source files remain after filtering', async () => {
    const { runFullGeneration } = await loadFullGenerationModule();
    mocks.getAllFiles.mockResolvedValue(['README.md']);
    mocks.shouldIgnorePath.mockReturnValue(true);

    await expect(runFullGeneration(makeOptions() as any, makeDeps() as any)).rejects.toThrow(
      'No source files found in the knowledge graph. Nothing to document.',
    );
  });

  it('builds an enriched file list for module tree generation', async () => {
    const { runFullGeneration } = await loadFullGenerationModule();
    mocks.getFilesWithExports.mockResolvedValue([
      { filePath: 'src/auth/login.ts', symbols: [{ name: 'login', type: 'Function' }] },
    ]);
    mocks.getAllFiles.mockResolvedValue(['src/auth/login.ts', 'src/core/util.ts']);

    await runFullGeneration(makeOptions() as any, makeDeps() as any);

    expect(mocks.buildModuleTree).toHaveBeenCalledWith(expect.objectContaining({
      files: [
        { filePath: 'src/auth/login.ts', symbols: [{ name: 'login', type: 'Function' }] },
        { filePath: 'src/core/util.ts', symbols: [] },
      ],
      wikiDir: '/tmp/wiki',
      llmConfig: { model: 'mock-model' },
      maxTokensPerModule: 1000,
      onProgress: expect.any(Function),
      slugify: expect.any(Function),
      estimateModuleTokens: expect.any(Function),
      streamOpts: expect.any(Function),
    }));
  });

  it('dispatches leaf and parent generation, skips existing pages, and saves metadata', async () => {
    const { runFullGeneration } = await loadFullGenerationModule();
    const parentNode = makeParentNode();
    const leafNode = makeLeafNode();
    const cachedLeaf = makeLeafNode({
      name: 'Utils',
      slug: 'utils',
      files: ['src/utils/format.ts'],
    });

    mocks.getAllFiles.mockResolvedValue(['src/auth/login.ts', 'src/core/util.ts', 'src/utils/format.ts']);
    mocks.buildModuleTree.mockResolvedValue([parentNode, leafNode, cachedLeaf]);
    mocks.countModules.mockReturnValue(3);
    mocks.flattenModuleTree.mockReturnValue({
      leaves: [leafNode, cachedLeaf],
      parents: [parentNode],
    });

    const options = makeOptions({
      fileExists: vi.fn(async (filePath: string) => filePath.endsWith('/utils.md')),
    });
    const deps = makeDeps();

    const result = await runFullGeneration(options as any, deps as any);

    expect(deps.generateLeafPage).toHaveBeenCalledTimes(1);
    expect(deps.generateLeafPage).toHaveBeenCalledWith(leafNode);
    expect(deps.generateParentPage).toHaveBeenCalledWith(parentNode);
    expect(deps.generateOverviewPage).toHaveBeenCalledWith([parentNode, leafNode, cachedLeaf]);
    expect(options.saveModuleTree).toHaveBeenCalledWith([parentNode, leafNode, cachedLeaf]);
    expect(options.saveWikiMeta).toHaveBeenCalledWith(expect.objectContaining({
      fromCommit: 'head-commit',
      model: 'mock-model',
      moduleTree: [parentNode, leafNode, cachedLeaf],
    }));
    expect(result).toMatchObject({
      pagesGenerated: 3,
      mode: 'full',
      failedModules: [],
    });
  });

  it('accumulates failed modules when page generation helpers throw', async () => {
    const { runFullGeneration } = await loadFullGenerationModule();
    const parentNode = makeParentNode();
    const leafNode = makeLeafNode();

    mocks.getAllFiles.mockResolvedValue(['src/auth/login.ts', 'src/core/util.ts']);
    mocks.buildModuleTree.mockResolvedValue([parentNode, leafNode]);
    mocks.countModules.mockReturnValue(2);
    mocks.flattenModuleTree.mockReturnValue({
      leaves: [leafNode],
      parents: [parentNode],
    });

    const deps = makeDeps({
      generateLeafPage: vi.fn(async () => {
        throw new Error('leaf failed');
      }),
      generateParentPage: vi.fn(async () => {
        throw new Error('parent failed');
      }),
    });
    const options = makeOptions();

    const result = await runFullGeneration(options as any, deps as any);

    expect(result).toMatchObject({
      pagesGenerated: 1,
      mode: 'full',
      failedModules: ['Core', 'Backend'],
    });
  });

  it('tracks failed modules internally without requiring a mutable input array', async () => {
    const { runFullGeneration } = await loadFullGenerationModule();
    const leafNode = makeLeafNode();

    mocks.getAllFiles.mockResolvedValue(['src/core/util.ts']);
    mocks.buildModuleTree.mockResolvedValue([leafNode]);
    mocks.countModules.mockReturnValue(1);
    mocks.flattenModuleTree.mockReturnValue({
      leaves: [leafNode],
      parents: [],
    });

    const result = await runFullGeneration(makeOptions({
      fileExists: vi.fn(async () => false),
    }) as any, makeDeps({
      generateLeafPage: vi.fn(async () => {
        throw new Error('leaf failed');
      }),
    }) as any);

    expect(result).toMatchObject({
      pagesGenerated: 1,
      mode: 'full',
      failedModules: ['Core'],
    });
  });

  it('emits the core progress phases with expected percent windows', async () => {
    const { runFullGeneration } = await loadFullGenerationModule();
    const parentNode = makeParentNode();
    const leafNode = makeLeafNode();
    const onProgress = vi.fn();

    mocks.getAllFiles.mockResolvedValue(['src/auth/login.ts', 'src/core/util.ts']);
    mocks.buildModuleTree.mockResolvedValue([parentNode, leafNode]);
    mocks.countModules.mockReturnValue(2);
    mocks.flattenModuleTree.mockReturnValue({
      leaves: [leafNode],
      parents: [parentNode],
    });

    await runFullGeneration(makeOptions({ onProgress }) as any, makeDeps() as any);

    expect(onProgress).toHaveBeenCalledWith('gather', 5, expect.any(String));
    expect(onProgress).toHaveBeenCalledWith('gather', 10, expect.any(String));
    expect(onProgress).toHaveBeenCalledWith('overview', 88, 'Generating overview page...');
    expect(onProgress).toHaveBeenCalledWith('finalize', 95, 'Saving metadata...');
    expect(onProgress).toHaveBeenCalledWith('done', 100, 'Wiki generation complete');

    const moduleCalls = onProgress.mock.calls.filter(([phase]) => phase === 'modules');
    expect(moduleCalls.length).toBeGreaterThan(0);
    for (const [, percent] of moduleCalls) {
      expect(percent).toBeGreaterThanOrEqual(30);
      expect(percent).toBeLessThanOrEqual(85);
    }
  });
});
