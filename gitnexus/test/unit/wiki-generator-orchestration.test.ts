import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModuleTreeNode } from '../../src/core/wiki/module-tree/types.js';

const mocks = vi.hoisted(() => ({
  mkdir: vi.fn(async () => undefined),
  readdir: vi.fn(async () => ['overview.md']),
  unlink: vi.fn(async () => undefined),
  access: vi.fn(async () => { throw new Error('missing'); }),
  readFile: vi.fn(async () => { throw new Error('missing'); }),
  writeFile: vi.fn(async () => undefined),
  execSync: vi.fn(() => Buffer.from('head-commit\n')),
  execFileSync: vi.fn(() => Buffer.from('src/auth/login.ts\n')),
  initWikiDb: vi.fn(async () => undefined),
  closeWikiDb: vi.fn(async () => undefined),
  getFilesWithExports: vi.fn(async () => [{ filePath: 'src/auth/login.ts', symbols: [] }]),
  getAllFiles: vi.fn(async () => ['src/auth/login.ts']),
  getInterFileCallEdges: vi.fn(async () => []),
  getAllProcesses: vi.fn(async () => []),
  getInterModuleEdgesForOverview: vi.fn(async () => []),
  callLLM: vi.fn(async () => ({ content: 'Overview content' })),
  estimateTokens: vi.fn(() => 10),
  fillTemplate: vi.fn((_template: string, values: Record<string, string>) => JSON.stringify(values)),
  formatProcesses: vi.fn(() => 'processes:none'),
  generateLeafPage: vi.fn(async () => undefined),
  generateParentPage: vi.fn(async () => undefined),
  generateOverviewPage: vi.fn(async () => undefined),
  generateHTMLViewer: vi.fn(async () => undefined),
  shouldIgnorePath: vi.fn(() => false),
  buildModuleTree: vi.fn(async () => []),
  countModules: vi.fn(() => 1),
  flattenModuleTree: vi.fn(() => ({ leaves: [], parents: [] })),
}));

vi.mock('fs/promises', () => ({
  __esModule: true,
  default: {
    mkdir: mocks.mkdir,
    readdir: mocks.readdir,
    unlink: mocks.unlink,
    access: mocks.access,
    readFile: mocks.readFile,
    writeFile: mocks.writeFile,
  },
  mkdir: mocks.mkdir,
  readdir: mocks.readdir,
  unlink: mocks.unlink,
  access: mocks.access,
  readFile: mocks.readFile,
  writeFile: mocks.writeFile,
}));

vi.mock('child_process', () => ({
  execSync: mocks.execSync,
  execFileSync: mocks.execFileSync,
}));

vi.mock('../../src/core/wiki/graph-queries.js', () => ({
  initWikiDb: mocks.initWikiDb,
  closeWikiDb: mocks.closeWikiDb,
  getFilesWithExports: mocks.getFilesWithExports,
  getAllFiles: mocks.getAllFiles,
  getInterFileCallEdges: mocks.getInterFileCallEdges,
  getAllProcesses: mocks.getAllProcesses,
  getInterModuleEdgesForOverview: mocks.getInterModuleEdgesForOverview,
}));

vi.mock('../../src/core/wiki/llm-client.js', () => ({
  callLLM: mocks.callLLM,
  estimateTokens: mocks.estimateTokens,
}));

vi.mock('../../src/core/wiki/prompts.js', () => ({
  GROUPING_SYSTEM_PROMPT: 'GROUPING_SYSTEM_PROMPT',
  OVERVIEW_SYSTEM_PROMPT: 'OVERVIEW_SYSTEM_PROMPT',
  OVERVIEW_USER_PROMPT: 'OVERVIEW_USER_PROMPT',
  fillTemplate: mocks.fillTemplate,
  formatProcesses: mocks.formatProcesses,
}));

vi.mock('../../src/core/wiki/pages/leaf-page.js', () => ({
  generateLeafPage: mocks.generateLeafPage,
}));

vi.mock('../../src/core/wiki/pages/parent-page.js', () => ({
  generateParentPage: mocks.generateParentPage,
}));

vi.mock('../../src/core/wiki/pages/overview-page.js', () => ({
  generateOverviewPage: mocks.generateOverviewPage,
}), { virtual: true });

vi.mock('../../src/core/wiki/html-viewer.js', () => ({
  generateHTMLViewer: mocks.generateHTMLViewer,
}));

vi.mock('../../src/config/ignore-service.js', () => ({
  shouldIgnorePath: mocks.shouldIgnorePath,
}));

vi.mock('../../src/core/wiki/module-tree/builder.js', () => ({
  buildModuleTree: mocks.buildModuleTree,
  countModules: mocks.countModules,
  flattenModuleTree: mocks.flattenModuleTree,
}));

async function loadGenerator(): Promise<{ WikiGenerator: typeof import('../../src/core/wiki/generator.js').WikiGenerator }> {
  const mod = await import('../../src/core/wiki/generator.js');
  return {
    WikiGenerator: mod.WikiGenerator,
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

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();

  mocks.readdir.mockResolvedValue(['overview.md']);
  mocks.access.mockImplementation(async () => {
    throw new Error('missing');
  });
  mocks.readFile.mockImplementation(async (filePath: string) => {
    if (filePath.endsWith('meta.json')) {
      throw new Error('missing');
    }
    throw new Error(`unexpected read: ${filePath}`);
  });
  mocks.execSync.mockReturnValue(Buffer.from('head-commit\n'));
  mocks.execFileSync.mockReturnValue(Buffer.from('src/auth/login.ts\n'));
  mocks.getFilesWithExports.mockResolvedValue([{ filePath: 'src/auth/login.ts', symbols: [] }]);
  mocks.getAllFiles.mockResolvedValue(['src/auth/login.ts']);
  mocks.getAllProcesses.mockResolvedValue([]);
  mocks.getInterModuleEdgesForOverview.mockResolvedValue([]);
  mocks.callLLM.mockResolvedValue({ content: 'Overview content' });
  mocks.fillTemplate.mockImplementation((_template: string, values: Record<string, string>) => JSON.stringify(values));
  mocks.formatProcesses.mockReturnValue('processes:none');
  mocks.generateLeafPage.mockResolvedValue(undefined);
  mocks.generateParentPage.mockResolvedValue(undefined);
  mocks.generateOverviewPage.mockResolvedValue(undefined);
  mocks.generateHTMLViewer.mockResolvedValue(undefined);
  mocks.shouldIgnorePath.mockReturnValue(false);
  mocks.countModules.mockReturnValue(1);
});

describe('WikiGenerator orchestration', () => {
  it('dispatches parent nodes through generateParentPage during full generation', async () => {
    const parentNode = makeParentNode();
    mocks.buildModuleTree.mockResolvedValue([parentNode]);
    mocks.flattenModuleTree.mockReturnValue({ leaves: [], parents: [parentNode] });

    const { WikiGenerator } = await loadGenerator();
    const generator = new WikiGenerator(
      '/tmp/repo',
      '/tmp/storage',
      '/tmp/kuzu',
      { model: 'mock-model' } as any,
    );

    await generator.run();

    expect(mocks.generateParentPage).toHaveBeenCalledTimes(1);
    expect(mocks.generateParentPage).toHaveBeenCalledWith(
      expect.objectContaining({
        node: parentNode,
        wikiDir: '/tmp/storage/wiki',
        llmConfig: { model: 'mock-model' },
        streamOpts: expect.any(Function),
      }),
    );
    expect(mocks.generateLeafPage).not.toHaveBeenCalled();
  });

  it('dispatches affected parent nodes through generateParentPage during incremental updates', async () => {
    const parentNode = makeParentNode();
    const existingMeta = {
      fromCommit: 'old-commit',
      generatedAt: '2026-03-27T00:00:00.000Z',
      model: 'mock-model',
      moduleFiles: {
        Backend: ['src/auth/login.ts'],
      },
      moduleTree: [parentNode],
    };

    mocks.readFile.mockImplementation(async (filePath: string) => {
      if (filePath.endsWith('meta.json')) {
        return JSON.stringify(existingMeta);
      }
      throw new Error(`unexpected read: ${filePath}`);
    });
    mocks.execSync.mockReturnValue(Buffer.from('new-commit\n'));

    const { WikiGenerator } = await loadGenerator();
    const generator = new WikiGenerator(
      '/tmp/repo',
      '/tmp/storage',
      '/tmp/kuzu',
      { model: 'mock-model' } as any,
    );

    await generator.run();

    expect(mocks.generateParentPage).toHaveBeenCalledTimes(1);
    expect(mocks.generateParentPage).toHaveBeenCalledWith(
      expect.objectContaining({
        node: parentNode,
        wikiDir: '/tmp/storage/wiki',
        llmConfig: { model: 'mock-model' },
        streamOpts: expect.any(Function),
      }),
    );
    expect(mocks.generateLeafPage).not.toHaveBeenCalled();
    expect(mocks.unlink).toHaveBeenCalledWith('/tmp/storage/wiki/backend.md');
  });

  it('dispatches overview work through generateOverviewPage during full generation', async () => {
    const parentNode = makeParentNode();
    mocks.buildModuleTree.mockResolvedValue([parentNode]);
    mocks.flattenModuleTree.mockReturnValue({ leaves: [], parents: [parentNode] });

    const { WikiGenerator } = await loadGenerator();
    const generator = new WikiGenerator(
      '/tmp/repo',
      '/tmp/storage',
      '/tmp/kuzu',
      { model: 'mock-model' } as any,
    );

    await generator.run();

    expect(mocks.generateOverviewPage).toHaveBeenCalledTimes(1);
    expect(mocks.generateOverviewPage).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleTree: [parentNode],
        wikiDir: '/tmp/storage/wiki',
        repoPath: '/tmp/repo',
        llmConfig: { model: 'mock-model' },
        streamOpts: expect.any(Function),
      }),
    );
  });

  it('dispatches overview work through generateOverviewPage during incremental updates when module pages regenerate', async () => {
    const parentNode = makeParentNode();
    const existingMeta = {
      fromCommit: 'old-commit',
      generatedAt: '2026-03-27T00:00:00.000Z',
      model: 'mock-model',
      moduleFiles: {
        Backend: ['src/auth/login.ts'],
      },
      moduleTree: [parentNode],
    };

    mocks.readFile.mockImplementation(async (filePath: string) => {
      if (filePath.endsWith('meta.json')) {
        return JSON.stringify(existingMeta);
      }
      throw new Error(`unexpected read: ${filePath}`);
    });
    mocks.execSync.mockReturnValue(Buffer.from('new-commit\n'));
    mocks.execFileSync.mockReturnValue(Buffer.from('src/auth/login.ts\n'));

    const { WikiGenerator } = await loadGenerator();
    const generator = new WikiGenerator(
      '/tmp/repo',
      '/tmp/storage',
      '/tmp/kuzu',
      { model: 'mock-model' } as any,
    );

    await generator.run();

    expect(mocks.generateOverviewPage).toHaveBeenCalledTimes(1);
    expect(mocks.generateOverviewPage).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleTree: [parentNode],
        wikiDir: '/tmp/storage/wiki',
        repoPath: '/tmp/repo',
        llmConfig: { model: 'mock-model' },
        streamOpts: expect.any(Function),
      }),
    );
  });

  it('does not dispatch overview work during incremental updates when no module pages regenerate', async () => {
    const parentNode = makeParentNode();
    const existingMeta = {
      fromCommit: 'old-commit',
      generatedAt: '2026-03-27T00:00:00.000Z',
      model: 'mock-model',
      moduleFiles: {
        Backend: ['src/auth/login.ts'],
      },
      moduleTree: [parentNode],
    };

    mocks.readFile.mockImplementation(async (filePath: string) => {
      if (filePath.endsWith('meta.json')) {
        return JSON.stringify(existingMeta);
      }
      throw new Error(`unexpected read: ${filePath}`);
    });
    mocks.execSync.mockReturnValue(Buffer.from('new-commit\n'));
    mocks.execFileSync.mockReturnValue(Buffer.from('src/new-file.ts\n'));

    const { WikiGenerator: WikiGeneratorFailing } = await loadGenerator();
    const failingGenerator = new WikiGeneratorFailing(
      '/tmp/repo',
      '/tmp/storage',
      '/tmp/kuzu',
      { model: 'mock-model' } as any,
    );

    const result = await failingGenerator.run();

    expect(mocks.generateOverviewPage).not.toHaveBeenCalled();
    expect(mocks.generateParentPage).not.toHaveBeenCalled();
    expect(mocks.generateLeafPage).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      mode: 'incremental',
      pagesGenerated: 0,
    });
  });

  it('dispatches incremental updates through runIncrementalUpdate when metadata exists and force mode is off', async () => {
    const parentNode = makeParentNode();
    const existingMeta = {
      fromCommit: 'old-commit',
      generatedAt: '2026-03-27T00:00:00.000Z',
      model: 'mock-model',
      moduleFiles: {
        Backend: ['src/auth/login.ts'],
      },
      moduleTree: [parentNode],
    };

    mocks.readFile.mockImplementation(async (filePath: string) => {
      if (filePath.endsWith('meta.json')) {
        return JSON.stringify(existingMeta);
      }
      throw new Error(`unexpected read: ${filePath}`);
    });
    mocks.execSync.mockReturnValue(Buffer.from('new-commit\n'));

    vi.resetModules();
    const runIncrementalUpdate = vi.fn(async () => ({
      pagesGenerated: 0,
      mode: 'incremental' as const,
      failedModules: [],
    }));
    vi.doMock('../../src/core/wiki/incremental-update.js', () => ({
      runIncrementalUpdate,
    }), { virtual: true });

    try {
      const { WikiGenerator } = await loadGenerator();
      const generator = new WikiGenerator(
        '/tmp/repo',
        '/tmp/storage',
        '/tmp/kuzu',
        { model: 'mock-model' } as any,
        { force: false },
      );

      await generator.run();

      expect(runIncrementalUpdate).toHaveBeenCalledTimes(1);
      expect(runIncrementalUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          existingMeta,
          currentCommit: 'new-commit',
          wikiDir: '/tmp/storage/wiki',
          llmConfig: { model: 'mock-model' },
        }),
        expect.objectContaining({
          generateLeafPage: expect.any(Function),
          generateParentPage: expect.any(Function),
          generateOverviewPage: expect.any(Function),
        }),
      );
    } finally {
      vi.doUnmock('../../src/core/wiki/incremental-update.js');
    }
  });

  it('delegates run() through runWikiGeneration with resolved shell dependencies', async () => {
    const existingMeta = {
      fromCommit: 'old-commit',
      generatedAt: '2026-03-28T00:00:00.000Z',
      model: 'mock-model',
      moduleFiles: {},
      moduleTree: [],
    };

    mocks.readFile.mockImplementation(async (filePath: string) => {
      if (filePath.endsWith('meta.json')) {
        return JSON.stringify(existingMeta);
      }
      throw new Error(`unexpected read: ${filePath}`);
    });
    mocks.execSync.mockReturnValue(Buffer.from('new-commit\n'));

    vi.resetModules();
    const runWikiGeneration = vi.fn(async () => ({
      pagesGenerated: 0,
      mode: 'up-to-date' as const,
      failedModules: [],
    }));
    vi.doMock('../../src/core/wiki/run-pipeline.js', () => ({
      runWikiGeneration,
    }));

    try {
      const { WikiGenerator } = await loadGenerator();
      const generator = new WikiGenerator(
        '/tmp/repo',
        '/tmp/storage',
        '/tmp/kuzu',
        { model: 'mock-model' } as any,
        { force: false },
      );

      await generator.run();

      expect(runWikiGeneration).toHaveBeenCalledTimes(1);
      expect(runWikiGeneration).toHaveBeenCalledWith(expect.objectContaining({
        forceMode: false,
        repoPath: '/tmp/repo',
        wikiDir: '/tmp/storage/wiki',
        kuzuPath: '/tmp/kuzu',
        loadWikiMeta: expect.any(Function),
        getCurrentCommit: expect.any(Function),
        prepareWikiDir: expect.any(Function),
        cleanupForceMode: expect.any(Function),
        ensureHTMLViewer: expect.any(Function),
        fullGeneration: expect.any(Function),
        runIncrementalUpdate: expect.any(Function),
      }));
      const forwardedOptions = runWikiGeneration.mock.calls[0]?.[0];
      expect(await forwardedOptions?.loadWikiMeta()).toEqual(existingMeta);
      expect(forwardedOptions?.getCurrentCommit()).toBe('new-commit');
    } finally {
      vi.doUnmock('../../src/core/wiki/run-pipeline.js');
    }
  });
});
