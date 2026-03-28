import { beforeEach, describe, expect, it, vi } from 'vitest';

async function loadRunPipelineModule(): Promise<{
  runWikiGeneration: (options: unknown) => Promise<unknown>;
}> {
  const mod = await import('../../src/core/wiki/run-pipeline.js');
  return {
    runWikiGeneration: mod.runWikiGeneration,
  };
}

function makeBaseOptions(overrides: Record<string, unknown> = {}) {
  return {
    forceMode: false,
    repoPath: '/tmp/repo',
    wikiDir: '/tmp/wiki',
    kuzuPath: '/tmp/kuzu',
    onProgress: vi.fn(),
    prepareWikiDir: vi.fn(async () => undefined),
    cleanupForceMode: vi.fn(async () => undefined),
    loadWikiMeta: vi.fn(async () => null),
    getCurrentCommit: vi.fn(() => 'head-commit'),
    initWikiDb: vi.fn(async () => undefined),
    closeWikiDb: vi.fn(async () => undefined),
    ensureHTMLViewer: vi.fn(async () => undefined),
    fullGeneration: vi.fn(async () => ({ pagesGenerated: 3, mode: 'full', failedModules: [] })),
    runIncrementalUpdate: vi.fn(async () => ({ pagesGenerated: 1, mode: 'incremental', failedModules: [] })),
    ...overrides,
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe('runWikiGeneration contracts', () => {
  it('short-circuits to up-to-date and still ensures the HTML viewer', async () => {
    const { runWikiGeneration } = await loadRunPipelineModule();
    const existingMeta = { fromCommit: 'head-commit' };
    const options = makeBaseOptions({
      loadWikiMeta: vi.fn(async () => existingMeta),
    });

    const result = await runWikiGeneration(options as any);

    expect(options.prepareWikiDir).toHaveBeenCalledTimes(1);
    expect(options.ensureHTMLViewer).toHaveBeenCalledTimes(1);
    expect(options.cleanupForceMode).not.toHaveBeenCalled();
    expect(options.initWikiDb).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      pagesGenerated: 0,
      mode: 'up-to-date',
      failedModules: [],
    });
  });

  it('runs force-mode cleanup before full generation', async () => {
    const { runWikiGeneration } = await loadRunPipelineModule();
    const options = makeBaseOptions({
      forceMode: true,
    });

    await runWikiGeneration(options as any);

    expect(options.cleanupForceMode).toHaveBeenCalledTimes(1);
    expect(options.fullGeneration).toHaveBeenCalledWith('head-commit');
    expect(options.cleanupForceMode.mock.invocationCallOrder[0]).toBeLessThan(
      options.fullGeneration.mock.invocationCallOrder[0],
    );
  });

  it('dispatches to incremental updates when metadata exists and force mode is off', async () => {
    const { runWikiGeneration } = await loadRunPipelineModule();
    const existingMeta = { fromCommit: 'old-commit' };
    const options = makeBaseOptions({
      loadWikiMeta: vi.fn(async () => existingMeta),
      getCurrentCommit: vi.fn(() => 'new-commit'),
    });

    await runWikiGeneration(options as any);

    expect(options.runIncrementalUpdate).toHaveBeenCalledWith(existingMeta, 'new-commit');
    expect(options.fullGeneration).not.toHaveBeenCalled();
  });

  it('initializes and closes the wiki db around non-up-to-date generation', async () => {
    const { runWikiGeneration } = await loadRunPipelineModule();
    const options = makeBaseOptions();

    await runWikiGeneration(options as any);

    expect(options.initWikiDb).toHaveBeenCalledWith('/tmp/kuzu');
    expect(options.closeWikiDb).toHaveBeenCalledTimes(1);
    expect(options.closeWikiDb.mock.invocationCallOrder[0]).toBeGreaterThan(
      options.initWikiDb.mock.invocationCallOrder[0],
    );
    expect(options.ensureHTMLViewer.mock.invocationCallOrder[0]).toBeGreaterThan(
      options.closeWikiDb.mock.invocationCallOrder[0],
    );
  });

  it('still closes the wiki db when generation throws', async () => {
    const { runWikiGeneration } = await loadRunPipelineModule();
    const options = makeBaseOptions({
      fullGeneration: vi.fn(async () => {
        throw new Error('boom');
      }),
    });

    await expect(runWikiGeneration(options as any)).rejects.toThrow('boom');

    expect(options.initWikiDb).toHaveBeenCalledWith('/tmp/kuzu');
    expect(options.closeWikiDb).toHaveBeenCalledTimes(1);
  });
});
