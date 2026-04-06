import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  runPipelineFromRepo: vi.fn(async () => ({ communityResult: null })),
  getStoragePaths: vi.fn(() => ({
    storagePath: '/tmp/repo/.gitnexus',
    kuzuPath: '/tmp/repo/.gitnexus/kuzu',
  })),
  saveMeta: vi.fn(async () => undefined),
  loadMeta: vi.fn(async () => ({
    repoPath: '/tmp/repo',
    lastCommit: 'old-commit',
    indexedAt: '2026-04-05T00:00:00.000Z',
    toolVersion: '1.0.0',
  })),
  addToGitignore: vi.fn(async () => undefined),
  addToGitInfoExclude: vi.fn(async () => undefined),
  registerRepo: vi.fn(async () => undefined),
  getGlobalRegistryPath: vi.fn(() => '/tmp/does-not-exist-registry.json'),
  getCurrentCommit: vi.fn(() => 'new-commit'),
  isGitRepo: vi.fn(() => true),
  getGitRoot: vi.fn(() => '/tmp/repo'),
  generateAIContextFiles: vi.fn(async () => ({ files: [] })),
  generateSkillFiles: vi.fn(async () => undefined),
  getIndexFreshness: vi.fn(() => ({ isUpToDate: false })),
  getGitNexusVersion: vi.fn(() => '1.1.0'),
  getCliEmbeddingConfig: vi.fn(() => ({})),
  getEmbeddingNodeLimit: vi.fn(() => 1000),
  formatEmbeddingRunDetails: vi.fn(() => ''),
  formatEmbeddingSkipReason: vi.fn(() => ''),
  shouldSuggestIncrementalEmbeddingRefresh: vi.fn(() => false),
  cacheExistingEmbeddingsForAnalyze: vi.fn(async () => ({
    embeddingNodeIds: new Set(['node-1']),
    embeddings: [{ nodeId: 'node-1', embedding: [1, 2, 3] }],
  })),
  runAnalyzeEmbeddingOrchestration: vi.fn(async () => ({
    embeddableNodeCount: 0,
    embeddingTime: '0.0',
    embeddingSkipped: true,
    embeddingSkipReason: 'skipped',
    embeddingDetail: '',
  })),
  finalizeAnalyzeArtifacts: vi.fn(async () => ({
    aiContext: { files: [] },
    communityCount: 0,
    processCount: 0,
  })),
  createDefaultAnalyzeFTSIndexes: vi.fn(async () => ({ ftsTime: '0.1' })),
  reloadKuzuGraphForAnalyze: vi.fn(async () => ({
    kuzuTime: '0.1',
    kuzuWarnings: [],
  })),
  buildAnalyzeSummaryLines: vi.fn(() => []),
  createAnalyzeBarLogger: vi.fn(() => vi.fn()),
  createAnalyzeInterruptHandler: vi.fn(() => async () => undefined),
  createAnalyzeProgressTracker: vi.fn(() => ({
    updateBar: vi.fn(),
    tickElapsed: vi.fn(),
  })),
  quiesceGitNexusMcpHolders: vi.fn(async () => ({
    drainedPids: [],
    terminatedPids: [],
    waitTimedOut: false,
  })),
  listGitNexusMcpPidsHoldingPath: vi.fn(async () => []),
  describeGitNexusMcpHolderPids: vi.fn(async () => []),
  formatGitNexusMcpHolderDetails: vi.fn(() => ''),
  getEmbeddingRuntimeConfig: vi.fn(() => ({
    provider: 'ollama',
    ollamaModel: 'qwen3-embedding:0.6b',
  })),
  initKuzu: vi.fn(async () => undefined),
  loadGraphToKuzu: vi.fn(async () => undefined),
  getKuzuStats: vi.fn(async () => ({ nodes: 123, edges: 456 })),
  executeQuery: vi.fn(async (cypher: string) => (
    cypher.includes('count(e)') ? [{ cnt: 1 }] : []
  )),
  executeWithReusedStatement: vi.fn(async () => undefined),
  restoreCachedEmbeddings: vi.fn(async () => undefined),
  closeKuzu: vi.fn(async () => undefined),
  createFTSIndex: vi.fn(async () => undefined),
  loadCachedEmbeddings: vi.fn(async () => ({
    embeddingNodeIds: new Set<string>(),
    embeddings: [],
  })),
  barStart: vi.fn(),
  barUpdate: vi.fn(),
  barStop: vi.fn(),
  writeReindexLock: vi.fn(async () => '/tmp/reindex.lock'),
  removeReindexLock: vi.fn(async () => undefined),
  cleanupCoreRuntime: vi.fn(async () => undefined),
  runCleanupAndExit: vi.fn(async () => undefined),
  scheduleExit: vi.fn(),
  registerShutdownHandlers: vi.fn(() => () => undefined),
}));

vi.mock('v8', () => ({
  default: {
    getHeapStatistics: () => ({
      heap_size_limit: 16 * 1024 * 1024 * 1024,
    }),
  },
}));

vi.mock('cli-progress', () => ({
  default: {
    SingleBar: class {
      start = mocks.barStart;
      update = mocks.barUpdate;
      stop = mocks.barStop;
    },
    Presets: {
      shades_grey: {},
    },
  },
}));

vi.mock('../../src/core/ingestion/pipeline.js', () => ({
  runPipelineFromRepo: mocks.runPipelineFromRepo,
}));

vi.mock('../../src/core/kuzu/kuzu-adapter.js', () => ({
  initKuzu: mocks.initKuzu,
  loadGraphToKuzu: mocks.loadGraphToKuzu,
  getKuzuStats: mocks.getKuzuStats,
  executeQuery: mocks.executeQuery,
  executeWithReusedStatement: mocks.executeWithReusedStatement,
  restoreCachedEmbeddings: mocks.restoreCachedEmbeddings,
  closeKuzu: mocks.closeKuzu,
  createFTSIndex: mocks.createFTSIndex,
  loadCachedEmbeddings: mocks.loadCachedEmbeddings,
}));

vi.mock('../../src/storage/repo-manager.js', () => ({
  getStoragePaths: mocks.getStoragePaths,
  saveMeta: mocks.saveMeta,
  loadMeta: mocks.loadMeta,
  addToGitignore: mocks.addToGitignore,
  addToGitInfoExclude: mocks.addToGitInfoExclude,
  registerRepo: mocks.registerRepo,
  getGlobalRegistryPath: mocks.getGlobalRegistryPath,
}));

vi.mock('../../src/storage/git.js', () => ({
  getCurrentCommit: mocks.getCurrentCommit,
  isGitRepo: mocks.isGitRepo,
  getGitRoot: mocks.getGitRoot,
}));

vi.mock('../../src/cli/ai-context.js', () => ({
  generateAIContextFiles: mocks.generateAIContextFiles,
}));

vi.mock('../../src/cli/skill-gen.js', () => ({
  generateSkillFiles: mocks.generateSkillFiles,
}));

vi.mock('../../src/cli/index-freshness.js', () => ({
  getIndexFreshness: mocks.getIndexFreshness,
  getGitNexusVersion: mocks.getGitNexusVersion,
}));

vi.mock('../../src/cli/embedding-overrides.js', () => ({
  getCliEmbeddingConfig: mocks.getCliEmbeddingConfig,
  getEmbeddingNodeLimit: mocks.getEmbeddingNodeLimit,
}));

vi.mock('../../src/cli/embedding-insights.js', () => ({
  formatEmbeddingRunDetails: mocks.formatEmbeddingRunDetails,
  formatEmbeddingSkipReason: mocks.formatEmbeddingSkipReason,
  shouldSuggestIncrementalEmbeddingRefresh: mocks.shouldSuggestIncrementalEmbeddingRefresh,
}));

vi.mock('../../src/cli/analyze-embeddings.js', () => ({
  cacheExistingEmbeddingsForAnalyze: mocks.cacheExistingEmbeddingsForAnalyze,
  runAnalyzeEmbeddingOrchestration: mocks.runAnalyzeEmbeddingOrchestration,
}));

vi.mock('../../src/cli/analyze-finalization.js', () => ({
  finalizeAnalyzeArtifacts: mocks.finalizeAnalyzeArtifacts,
}));

vi.mock('../../src/cli/analyze-kuzu.js', () => ({
  createDefaultAnalyzeFTSIndexes: mocks.createDefaultAnalyzeFTSIndexes,
  reloadKuzuGraphForAnalyze: mocks.reloadKuzuGraphForAnalyze,
}));

vi.mock('../../src/cli/analyze-summary.js', () => ({
  buildAnalyzeSummaryLines: mocks.buildAnalyzeSummaryLines,
}));

vi.mock('../../src/cli/analyze-session.js', () => ({
  createAnalyzeBarLogger: mocks.createAnalyzeBarLogger,
  createAnalyzeInterruptHandler: mocks.createAnalyzeInterruptHandler,
  createAnalyzeProgressTracker: mocks.createAnalyzeProgressTracker,
}));

vi.mock('../../src/cli/platform-process-scan.js', () => ({
  describeGitNexusMcpHolderPids: mocks.describeGitNexusMcpHolderPids,
  formatGitNexusMcpHolderDetails: mocks.formatGitNexusMcpHolderDetails,
  listGitNexusMcpPidsHoldingPath: mocks.listGitNexusMcpPidsHoldingPath,
  quiesceGitNexusMcpHolders: mocks.quiesceGitNexusMcpHolders,
}));

vi.mock('../../src/core/embeddings/runtime-config.js', () => ({
  getEmbeddingRuntimeConfig: mocks.getEmbeddingRuntimeConfig,
}));

vi.mock('../../src/runtime/native-runtime-manager.js', () => ({
  nativeRuntimeManager: {
    writeReindexLock: mocks.writeReindexLock,
    removeReindexLock: mocks.removeReindexLock,
    cleanupCoreRuntime: mocks.cleanupCoreRuntime,
    runCleanupAndExit: mocks.runCleanupAndExit,
    scheduleExit: mocks.scheduleExit,
    registerShutdownHandlers: mocks.registerShutdownHandlers,
  },
}));

async function loadAnalyzeModule(): Promise<{
  analyzeCommand: (inputPath?: string, options?: { embeddings?: boolean }) => Promise<void>;
}> {
  const mod = await import('../../src/cli/analyze.js');
  return {
    analyzeCommand: mod.analyzeCommand,
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.loadMeta.mockResolvedValue({
    repoPath: '/tmp/repo',
    lastCommit: 'old-commit',
    indexedAt: '2026-04-05T00:00:00.000Z',
    toolVersion: '1.0.0',
  });
  mocks.getIndexFreshness.mockReturnValue({
    commitMatches: false,
    toolVersionMatches: false,
    isUpToDate: false,
  });
  mocks.executeQuery.mockImplementation(async (cypher: string) => (
    cypher.includes('count(e)') ? [{ cnt: 1 }] : []
  ));
});

describe('analyzeCommand cached embedding restore', () => {
  it('refuses to start a second analyze when another reindex lock is already active', async () => {
    const { analyzeCommand } = await loadAnalyzeModule();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const previousExitCode = process.exitCode;
    process.exitCode = undefined;
    mocks.writeReindexLock.mockRejectedValueOnce(new Error('Reindex already active with pid 305228 (/tmp/reindex.lock)'));

    try {
      await analyzeCommand('/tmp/repo', { embeddings: true });

      expect(process.exitCode).toBe(1);
      expect(mocks.runPipelineFromRepo).not.toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Reindex already active with pid 305228'));
    } finally {
      process.exitCode = previousExitCode;
      logSpy.mockRestore();
    }
  });

  it('does not skip an up-to-date embeddings index when persisted rows differ from metadata', async () => {
    const { analyzeCommand } = await loadAnalyzeModule();
    mocks.loadMeta.mockResolvedValue({
      repoPath: '/tmp/repo',
      lastCommit: 'new-commit',
      indexedAt: '2026-04-05T00:00:00.000Z',
      toolVersion: '1.1.0',
      stats: {
        embeddings: 84551,
      },
    });
    mocks.getIndexFreshness.mockReturnValue({
      commitMatches: true,
      toolVersionMatches: true,
      isUpToDate: true,
    });
    mocks.executeQuery.mockImplementation(async (cypher: string) => (
      cypher.includes('count(e)') ? [{ cnt: 6975 }] : []
    ));

    await analyzeCommand('/tmp/repo', { embeddings: true });

    expect(mocks.initKuzu).toHaveBeenCalledWith('/tmp/repo/.gitnexus/kuzu');
    expect(mocks.runPipelineFromRepo).toHaveBeenCalled();
  });

  it('does not skip an up-to-date index when embeddings are requested but metadata has none', async () => {
    const { analyzeCommand } = await loadAnalyzeModule();
    mocks.loadMeta.mockResolvedValue({
      repoPath: '/tmp/repo',
      lastCommit: 'new-commit',
      indexedAt: '2026-04-05T00:00:00.000Z',
      toolVersion: '1.1.0',
      stats: {
        embeddings: 0,
      },
    });
    mocks.getIndexFreshness.mockReturnValue({
      commitMatches: true,
      toolVersionMatches: true,
      isUpToDate: true,
    });

    await analyzeCommand('/tmp/repo', { embeddings: true });

    expect(mocks.runPipelineFromRepo).toHaveBeenCalled();
  });

  it('skips an up-to-date embeddings index when persisted rows match metadata', async () => {
    const { analyzeCommand } = await loadAnalyzeModule();
    mocks.loadMeta.mockResolvedValue({
      repoPath: '/tmp/repo',
      lastCommit: 'new-commit',
      indexedAt: '2026-04-05T00:00:00.000Z',
      toolVersion: '1.1.0',
      stats: {
        embeddings: 1452,
      },
    });
    mocks.getIndexFreshness.mockReturnValue({
      commitMatches: true,
      toolVersionMatches: true,
      isUpToDate: true,
    });
    mocks.executeQuery.mockImplementation(async (cypher: string) => (
      cypher.includes('count(e)') ? [{ cnt: 1452 }] : []
    ));

    await analyzeCommand('/tmp/repo', { embeddings: true });

    expect(mocks.initKuzu).toHaveBeenCalledWith('/tmp/repo/.gitnexus/kuzu');
    expect(mocks.runPipelineFromRepo).not.toHaveBeenCalled();
  });

  it('does not restore cached embeddings before orchestration runs', async () => {
    const { analyzeCommand } = await loadAnalyzeModule();

    await analyzeCommand('/tmp/repo', { embeddings: true });

    expect(mocks.executeWithReusedStatement).not.toHaveBeenCalled();
    expect(mocks.runAnalyzeEmbeddingOrchestration).toHaveBeenCalledWith(
      expect.objectContaining({
        cachedEmbeddingNodeIds: new Set(['node-1']),
        cachedEmbeddings: [{ nodeId: 'node-1', embedding: [1, 2, 3] }],
      }),
      expect.any(Object),
    );
  });

  it('persists the latest HEAD when the repo advances during analyze', async () => {
    const { analyzeCommand } = await loadAnalyzeModule();
    mocks.getCurrentCommit
      .mockReturnValueOnce('start-commit')
      .mockReturnValueOnce('final-commit');

    await analyzeCommand('/tmp/repo', { embeddings: true });

    expect(mocks.finalizeAnalyzeArtifacts).toHaveBeenCalledWith(
      expect.objectContaining({
        currentCommit: 'final-commit',
      }),
      expect.any(Object),
    );
  });

  it('uses the reopened persisted embedding count for saved metadata and summary warnings', async () => {
    const { analyzeCommand } = await loadAnalyzeModule();
    mocks.executeQuery.mockImplementation(async (cypher: string) => {
      if (!cypher.includes('count(e)')) return [];
      if (mocks.executeQuery.mock.calls.filter(([query]) => String(query).includes('count(e)')).length === 1) {
        return [{ cnt: 84546 }];
      }
      return [{ cnt: 6380 }];
    });

    await analyzeCommand('/tmp/repo', { embeddings: true });

    expect(mocks.finalizeAnalyzeArtifacts).toHaveBeenCalledWith(
      expect.objectContaining({
        stats: expect.objectContaining({
          embeddings: 6380,
        }),
      }),
      expect.any(Object),
    );
    expect(mocks.buildAnalyzeSummaryLines).toHaveBeenCalledWith(
      expect.objectContaining({
        embeddingPersistenceWarning: 'Embedding persistence mismatch: session counted 84,546 rows but reopening Kuzu found 6,380.',
      }),
    );
  });

  it('releases the reindex lock only for the current analyze pid', async () => {
    const { analyzeCommand } = await loadAnalyzeModule();

    await analyzeCommand('/tmp/repo', { embeddings: true });

    expect(mocks.removeReindexLock).toHaveBeenCalledWith('/tmp/reindex.lock', { expectedPid: process.pid });
  });
});
