/**
 * Embedder Module (Read-Only)
 * 
 * Singleton factory for transformers.js embedding pipeline.
 * For MCP, we only need to compute query embeddings, not batch embed.
 */

import { pipeline, env, type FeatureExtractionPipeline } from '@huggingface/transformers';
import { DEFAULT_EMBEDDING_CONFIG } from '../../core/embeddings/types.js';
import {
  applyEmbeddingRuntimeConfig,
  formatEmbeddingInitError,
  getEmbeddingRuntimeConfig,
} from '../../core/embeddings/runtime-config.js';
import { embedQueryWithOllama } from '../../core/embeddings/ollama-client.js';
import { nativeRuntimeManager } from '../../runtime/native-runtime-manager.js';

// Model config
const MODEL_ID = 'Snowflake/snowflake-arctic-embed-xs';
const EMBEDDING_DIMS = DEFAULT_EMBEDDING_CONFIG.dimensions;

// Module-level state for singleton pattern
let embedderInstance: FeatureExtractionPipeline | null = null;
let isInitializing = false;
let initPromise: Promise<FeatureExtractionPipeline> | null = null;
let activeProvider: 'huggingface' | 'ollama' | null = null;

/**
 * Initialize the embedding model (lazy, on first search)
 */
export const initEmbedder = async (): Promise<FeatureExtractionPipeline> => {
  const runtimeConfig = getEmbeddingRuntimeConfig();

  if (embedderInstance && activeProvider === runtimeConfig.provider) {
    nativeRuntimeManager.markEmbedderActive('mcp');
    return embedderInstance;
  }

  if (embedderInstance && activeProvider !== runtimeConfig.provider) {
    embedderInstance = null;
    initPromise = null;
    activeProvider = null;
    nativeRuntimeManager.markEmbedderInactive('mcp');
  }

  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;

  initPromise = (async () => {
    try {
      if (runtimeConfig.provider === 'ollama') {
        embedderInstance = {} as FeatureExtractionPipeline;
        activeProvider = 'ollama';
        nativeRuntimeManager.markEmbedderActive('mcp');
        console.error(`GitNexus: Using Ollama embedding model (${runtimeConfig.ollamaModel})`);
        return embedderInstance;
      }

      env.allowLocalModels = false;
      applyEmbeddingRuntimeConfig(env as any, runtimeConfig);
      activeProvider = 'huggingface';
      
      console.error('GitNexus: Loading embedding model (first search may take a moment)...');

      // Try GPU first (DirectML on Windows, CUDA on Linux), fall back to CPU
      const isWindows = process.platform === 'win32';
      const gpuDevice = isWindows ? 'dml' : 'cuda';
      const devicesToTry: Array<'dml' | 'cuda' | 'cpu'> = [gpuDevice, 'cpu'];
      
      for (const device of devicesToTry) {
        try {
          // Silence stdout and stderr during model load — ONNX Runtime and transformers.js
          // may write progress/init messages that corrupt MCP stdio protocol or produce
          // noisy warnings (e.g. node assignment to execution providers).
          const origStdout = process.stdout.write;
          const origStderr = process.stderr.write;
          process.stdout.write = (() => true) as any;
          process.stderr.write = (() => true) as any;
          try {
            embedderInstance = await (pipeline as any)(
              'feature-extraction',
              MODEL_ID,
              {
                device: device,
                dtype: 'fp32',
              }
            );
          } finally {
            process.stdout.write = origStdout;
            process.stderr.write = origStderr;
          }
          nativeRuntimeManager.markEmbedderActive('mcp');
          console.error(`GitNexus: Embedding model loaded (${device})`);
          return embedderInstance!;
        } catch {
          if (device === 'cpu') throw new Error('Failed to load embedding model');
        }
      }

      throw new Error('No suitable device found');
    } catch (error) {
      isInitializing = false;
      initPromise = null;
      embedderInstance = null;
      activeProvider = null;
      nativeRuntimeManager.markEmbedderInactive('mcp');
      throw formatEmbeddingInitError(error, runtimeConfig);
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
};

/**
 * Check if embedder is ready
 */
export const isEmbedderReady = (): boolean => embedderInstance !== null && activeProvider !== null;

/**
 * Embed a query text for semantic search
 */
export const embedQuery = async (query: string): Promise<number[]> => {
  const runtimeConfig = getEmbeddingRuntimeConfig();
  await initEmbedder();

  if (runtimeConfig.provider === 'ollama') {
    return embedQueryWithOllama(query, {
      baseUrl: runtimeConfig.ollamaBaseUrl,
      model: runtimeConfig.ollamaModel,
      dimensions: EMBEDDING_DIMS,
    });
  }

  const embedder = embedderInstance!;
  
  const result = await embedder(query, {
    pooling: 'mean',
    normalize: true,
  });
  
  return Array.from(result.data as ArrayLike<number>);
};

/**
 * Get embedding dimensions
 */
export const getEmbeddingDims = (): number => EMBEDDING_DIMS;

/**
 * Cleanup embedder
 */
export const disposeEmbedder = async (): Promise<void> => {
  if (embedderInstance) {
    try {
      if ('dispose' in embedderInstance && typeof embedderInstance.dispose === 'function') {
        await embedderInstance.dispose();
      }
    } catch {}
    embedderInstance = null;
    initPromise = null;
  }
  activeProvider = null;
  nativeRuntimeManager.markEmbedderInactive('mcp');
};
