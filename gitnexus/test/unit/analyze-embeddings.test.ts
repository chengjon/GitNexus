import { describe, expect, it, vi } from 'vitest';

import {
  cacheExistingEmbeddingsForAnalyze,
  runAnalyzeEmbeddingOrchestration,
} from '../../src/cli/analyze-embeddings.js';

describe('analyze embedding helpers', () => {
  it('caches existing embeddings only when embeddings are enabled and closes Kuzu afterwards', async () => {
    const updateBar = vi.fn();
    const initKuzu = vi.fn(async () => undefined);
    const closeKuzu = vi.fn(async () => undefined);
    const loadCachedEmbeddings = vi.fn(async () => ({
      embeddingNodeIds: new Set(['node-1']),
      embeddings: [{ nodeId: 'node-1', embedding: [1, 2, 3] }],
    }));

    const result = await cacheExistingEmbeddingsForAnalyze({
      embeddingsEnabled: true,
      hasExistingMeta: true,
      force: false,
      kuzuPath: '/tmp/repo/.gitnexus/kuzu',
      updateBar,
    }, {
      initKuzu,
      closeKuzu,
      loadCachedEmbeddings,
    });

    expect(updateBar).toHaveBeenCalledWith(0, 'Caching embeddings...');
    expect(initKuzu).toHaveBeenCalledWith('/tmp/repo/.gitnexus/kuzu');
    expect(loadCachedEmbeddings).toHaveBeenCalledTimes(1);
    expect(closeKuzu).toHaveBeenCalledTimes(1);
    expect(result.embeddingNodeIds).toEqual(new Set(['node-1']));
    expect(result.embeddings).toEqual([{ nodeId: 'node-1', embedding: [1, 2, 3] }]);
  });

  it('restores cached embeddings in batches and skips fresh embedding when the node limit is exceeded', async () => {
    const updateBar = vi.fn();
    const restoreCachedEmbeddings = vi.fn(async () => undefined);
    const executeWithReusedStatement = vi.fn(async () => undefined);
    const loadEmbeddingPipelineFns = vi.fn(async () => ({
      countEmbeddableNodes: vi.fn(async () => 501),
      runEmbeddingPipeline: vi.fn(async () => {
        throw new Error('should not run pipeline when skipped');
      }),
    }));

    const result = await runAnalyzeEmbeddingOrchestration({
      embeddingsEnabled: true,
      embeddingNodeLimit: 500,
      embeddingConfig: {},
      embeddingRuntimeConfig: { provider: 'huggingface', localModelPath: null },
      cachedEmbeddingNodeIds: new Set(['node-1']),
      cachedEmbeddings: [{ nodeId: 'node-1', embedding: [1, 2, 3] }],
      restoreCachedEmbeddings,
      executeQuery: vi.fn(),
      executeWithReusedStatement,
      updateBar,
    }, {
      loadEmbeddingPipelineFns,
      formatEmbeddingSkipReason: (count, limit) => `skip ${count}/${limit}`,
      formatEmbeddingRunDetails: vi.fn(),
    });

    expect(updateBar).toHaveBeenCalledWith(88, 'Restoring 1 cached embeddings...');
    expect(restoreCachedEmbeddings).toHaveBeenCalledTimes(1);
    expect(restoreCachedEmbeddings).toHaveBeenCalledWith([{ nodeId: 'node-1', embedding: [1, 2, 3] }]);
    expect(executeWithReusedStatement).not.toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({
      embeddableNodeCount: 501,
      embeddingSkipped: true,
      embeddingSkipReason: 'skip 501/500',
      embeddingDetail: '501 embeddable | limit 500',
      embeddingTime: '0.0',
    }));
  });

  it('runs the embedding pipeline and formats detail when embedding is enabled within limits', async () => {
    const updateBar = vi.fn();
    const runEmbeddingPipeline = vi.fn(async () => ({
      embeddableNodeCount: 12,
      totalBatches: 3,
      batchSize: 4,
    }));
    const countEmbeddableNodes = vi.fn(async () => 12);

    const result = await runAnalyzeEmbeddingOrchestration({
      embeddingsEnabled: true,
      embeddingNodeLimit: 500,
      embeddingConfig: { modelId: 'model-x' },
      embeddingRuntimeConfig: { provider: 'ollama', ollamaModel: 'qwen-embed' },
      cachedEmbeddingNodeIds: new Set(['node-1']),
      cachedEmbeddings: [],
      executeQuery: vi.fn(),
      executeWithReusedStatement: vi.fn(async () => undefined),
      updateBar,
    }, {
      loadEmbeddingPipelineFns: async () => ({
        countEmbeddableNodes,
        runEmbeddingPipeline,
      }),
      formatEmbeddingSkipReason: vi.fn(),
      formatEmbeddingRunDetails: vi.fn(() => 'detail text'),
    });

    expect(runEmbeddingPipeline).toHaveBeenCalledTimes(1);
    expect(updateBar).toHaveBeenCalledWith(90, 'Loading embedding model...');
    expect(result.embeddingSkipped).toBe(false);
    expect(result.embeddingDetail).toBe('detail text');
    expect(result.embeddingTime).toMatch(/^\d+\.\d$/);
  });
});
