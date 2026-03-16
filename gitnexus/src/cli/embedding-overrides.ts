import { DEFAULT_EMBEDDING_CONFIG, type EmbeddingConfig } from '../core/embeddings/types.js';
import type { CLIConfig } from '../storage/repo-manager.js';
import { loadCLIConfigSync } from '../storage/repo-manager.js';

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

const readPositiveInt = (value: number | undefined, fallback: number): number =>
  Number.isFinite(value) && (value as number) > 0 ? (value as number) : fallback;

export const getEmbeddingNodeLimit = (cliConfig: CLIConfig = loadCLIConfigSync()): number =>
  readPositiveIntEnv(
    'GITNEXUS_EMBEDDING_NODE_LIMIT',
    readPositiveInt(cliConfig.embeddings?.nodeLimit, DEFAULT_EMBEDDING_NODE_LIMIT),
  );

export const getCliEmbeddingConfig = (cliConfig: CLIConfig = loadCLIConfigSync()): Partial<EmbeddingConfig> => {
  const batchSize = readPositiveIntEnv(
    'GITNEXUS_EMBEDDING_BATCH_SIZE',
    readPositiveInt(cliConfig.embeddings?.batchSize, DEFAULT_EMBEDDING_CONFIG.batchSize),
  );

  return batchSize === DEFAULT_EMBEDDING_CONFIG.batchSize
    ? {}
    : { batchSize };
};
