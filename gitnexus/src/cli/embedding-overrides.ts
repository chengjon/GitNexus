import { DEFAULT_EMBEDDING_CONFIG, type EmbeddingConfig } from '../core/embeddings/types.js';

export const DEFAULT_EMBEDDING_NODE_LIMIT = 50_000;

const readPositiveIntEnv = (envName: string, fallback: number): number => {
  const raw = process.env[envName];
  if (!raw) return fallback;

  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return value;
};

export const getEmbeddingNodeLimit = (): number =>
  readPositiveIntEnv('GITNEXUS_EMBEDDING_NODE_LIMIT', DEFAULT_EMBEDDING_NODE_LIMIT);

export const getCliEmbeddingConfig = (): Partial<EmbeddingConfig> => {
  const batchSize = readPositiveIntEnv(
    'GITNEXUS_EMBEDDING_BATCH_SIZE',
    DEFAULT_EMBEDDING_CONFIG.batchSize,
  );

  return batchSize === DEFAULT_EMBEDDING_CONFIG.batchSize
    ? {}
    : { batchSize };
};
