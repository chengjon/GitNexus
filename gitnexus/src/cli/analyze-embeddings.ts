import type { EmbeddingRuntimeConfig } from '../core/embeddings/runtime-config.js';
import { formatEmbeddingRunDetails, formatEmbeddingSkipReason } from './embedding-insights.js';

export interface CachedEmbeddingRecord {
  nodeId: string;
  embedding: number[];
}

export interface CachedEmbeddingSnapshot {
  embeddingNodeIds: Set<string>;
  embeddings: CachedEmbeddingRecord[];
}

export interface CacheExistingEmbeddingsOptions {
  embeddingsEnabled?: boolean;
  hasExistingMeta: boolean;
  force?: boolean;
  kuzuPath: string;
  updateBar: (value: number, phaseLabel: string) => void;
}

export interface CacheExistingEmbeddingsDeps {
  initKuzu: (dbPath: string) => Promise<unknown>;
  closeKuzu: () => Promise<void>;
  loadCachedEmbeddings: () => Promise<CachedEmbeddingSnapshot>;
}

export interface AnalyzeEmbeddingOrchestrationOptions {
  embeddingsEnabled?: boolean;
  embeddingNodeLimit: number;
  embeddingConfig: any;
  embeddingRuntimeConfig: EmbeddingRuntimeConfig;
  cachedEmbeddingNodeIds: Set<string>;
  cachedEmbeddings: CachedEmbeddingRecord[];
  restoreCachedEmbeddings: (entries: CachedEmbeddingRecord[]) => Promise<void>;
  executeQuery: (cypher: string) => Promise<any[]>;
  executeWithReusedStatement: (cypher: string, paramsList: Record<string, unknown>[]) => Promise<void>;
  updateBar: (value: number, phaseLabel: string) => void;
}

export interface AnalyzeEmbeddingOrchestrationDeps {
  loadEmbeddingPipelineFns?: () => Promise<{
    countEmbeddableNodes: (executeQuery: (cypher: string) => Promise<any[]>) => Promise<number>;
    runEmbeddingPipeline: (
      executeQuery: (cypher: string) => Promise<any[]>,
      executeWithReusedStatement: (cypher: string, paramsList: Record<string, unknown>[]) => Promise<void>,
      onProgress: (progress: {
        percent: number;
        phase: string;
        nodesProcessed?: number;
        totalNodes?: number;
        currentBatch?: number;
        totalBatches?: number;
      }) => void,
      embeddingConfig: any,
      cachedEmbeddingNodeIds?: Set<string>,
    ) => Promise<{
      embeddableNodeCount: number;
      totalBatches: number;
      batchSize: number;
    }>;
  }>;
  formatEmbeddingSkipReason?: typeof formatEmbeddingSkipReason;
  formatEmbeddingRunDetails?: typeof formatEmbeddingRunDetails;
}

const EMPTY_CACHED_EMBEDDINGS: CachedEmbeddingSnapshot = {
  embeddingNodeIds: new Set<string>(),
  embeddings: [],
};

const DEFAULT_EMBED_BATCH = 200;

const defaultLoadEmbeddingPipelineFns = async () => {
  const mod = await import('../core/embeddings/embedding-pipeline.js');
  return {
    countEmbeddableNodes: mod.countEmbeddableNodes,
    runEmbeddingPipeline: mod.runEmbeddingPipeline,
  };
};

export async function cacheExistingEmbeddingsForAnalyze(
  options: CacheExistingEmbeddingsOptions,
  deps: CacheExistingEmbeddingsDeps,
): Promise<CachedEmbeddingSnapshot> {
  if (!options.embeddingsEnabled || !options.hasExistingMeta || options.force) {
    return EMPTY_CACHED_EMBEDDINGS;
  }

  try {
    options.updateBar(0, 'Caching embeddings...');
    await deps.initKuzu(options.kuzuPath);
    return await deps.loadCachedEmbeddings();
  } catch {
    return EMPTY_CACHED_EMBEDDINGS;
  } finally {
    try {
      await deps.closeKuzu();
    } catch {
      // best-effort cleanup only
    }
  }
}

export async function runAnalyzeEmbeddingOrchestration(
  options: AnalyzeEmbeddingOrchestrationOptions,
  deps: AnalyzeEmbeddingOrchestrationDeps = {},
): Promise<{
  embeddableNodeCount: number;
  embeddingTime: string;
  embeddingSkipped: boolean;
  embeddingSkipReason: string;
  embeddingDetail: string;
}> {
  if (options.cachedEmbeddings.length > 0) {
    options.updateBar(88, `Restoring ${options.cachedEmbeddings.length} cached embeddings...`);
    try {
      await options.restoreCachedEmbeddings(options.cachedEmbeddings);
    } catch {
      for (let i = 0; i < options.cachedEmbeddings.length; i += DEFAULT_EMBED_BATCH) {
        const batch = options.cachedEmbeddings.slice(i, i + DEFAULT_EMBED_BATCH);
        const paramsList = batch.map((entry) => ({ nodeId: entry.nodeId, embedding: entry.embedding }));
        try {
          await options.executeWithReusedStatement(
            `CREATE (e:CodeEmbedding {nodeId: $nodeId, embedding: $embedding})`,
            paramsList,
          );
        } catch {
          // some may fail if nodes were removed during rebuild; keep best-effort semantics
        }
      }
    }
  }

  let embeddableNodeCount = 0;
  let embeddingTime = '0.0';
  let embeddingSkipped = true;
  let embeddingSkipReason = 'off (use --embeddings to enable)';
  let embeddingDetail = '';

  if (!options.embeddingsEnabled) {
    return {
      embeddableNodeCount,
      embeddingTime,
      embeddingSkipped,
      embeddingSkipReason,
      embeddingDetail,
    };
  }

  const loadEmbeddingPipelineFns = deps.loadEmbeddingPipelineFns ?? defaultLoadEmbeddingPipelineFns;
  const {
    countEmbeddableNodes,
    runEmbeddingPipeline,
  } = await loadEmbeddingPipelineFns();
  const formatSkipReason = deps.formatEmbeddingSkipReason ?? formatEmbeddingSkipReason;
  const formatRunDetails = deps.formatEmbeddingRunDetails ?? formatEmbeddingRunDetails;

  embeddableNodeCount = await countEmbeddableNodes(options.executeQuery);
  if (embeddableNodeCount > options.embeddingNodeLimit) {
    embeddingSkipReason = formatSkipReason(embeddableNodeCount, options.embeddingNodeLimit);
    embeddingDetail = `${embeddableNodeCount.toLocaleString()} embeddable | limit ${options.embeddingNodeLimit.toLocaleString()}`;
    return {
      embeddableNodeCount,
      embeddingTime,
      embeddingSkipped,
      embeddingSkipReason,
      embeddingDetail,
    };
  }

  embeddingSkipped = false;
  options.updateBar(90, 'Loading embedding model...');
  const t0Emb = Date.now();
  const embeddingStats = await runEmbeddingPipeline(
    options.executeQuery,
    options.executeWithReusedStatement,
    (progress) => {
      const scaled = 90 + Math.round((progress.percent / 100) * 8);
      const label = progress.phase === 'loading-model'
        ? 'Loading embedding model...'
        : progress.phase === 'embedding'
          ? `Embedding ${progress.nodesProcessed || 0}/${progress.totalNodes || '?'} (batch ${progress.currentBatch || 0}/${progress.totalBatches || '?'})`
          : `Embedding ${progress.nodesProcessed || 0}/${progress.totalNodes || '?'}`;
      options.updateBar(scaled, label);
    },
    options.embeddingConfig,
    options.cachedEmbeddingNodeIds.size > 0 ? options.cachedEmbeddingNodeIds : undefined,
  );
  const embeddingSeconds = (Date.now() - t0Emb) / 1000;
  embeddingTime = embeddingSeconds.toFixed(1);
  embeddingDetail = formatRunDetails({
    provider: options.embeddingRuntimeConfig.provider,
    model: options.embeddingRuntimeConfig.provider === 'ollama'
      ? options.embeddingRuntimeConfig.ollamaModel
      : (options.embeddingConfig.modelId || options.embeddingRuntimeConfig.localModelPath || 'Snowflake/snowflake-arctic-embed-xs'),
    embeddableNodeCount: embeddableNodeCount || embeddingStats.embeddableNodeCount,
    totalBatches: embeddingStats.totalBatches,
    batchSize: embeddingStats.batchSize,
    seconds: embeddingSeconds,
  });

  return {
    embeddableNodeCount,
    embeddingTime,
    embeddingSkipped,
    embeddingSkipReason,
    embeddingDetail,
  };
}
