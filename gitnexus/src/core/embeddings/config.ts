import { readFileSync } from 'node:fs';
import { defaultEmbeddingThreads } from '../platform/capabilities.js';
import { getGlobalConfigPath, type CLIConfig } from '../../storage/repo-manager.js';
import { DEFAULT_EMBEDDING_CONFIG, type EmbeddingConfig } from './types.js';

const parsePositiveInt = (name: string, value: string | undefined, fallback: number): number => {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer, got "${value}"`);
  }
  return parsed;
};

const parseDevice = (value: string | undefined): EmbeddingConfig['device'] | undefined => {
  if (value === undefined) return undefined;
  if (
    value === 'auto' ||
    value === 'dml' ||
    value === 'cuda' ||
    value === 'cpu' ||
    value === 'wasm'
  ) {
    return value;
  }
  throw new Error(`embedding device must be one of auto, dml, cuda, cpu, wasm; got "${value}"`);
};

export type StoredEmbeddingConfig = NonNullable<CLIConfig['embeddings']>;

export const loadStoredEmbeddingConfig = (): StoredEmbeddingConfig => {
  try {
    const raw = readFileSync(getGlobalConfigPath(), 'utf-8');
    const config = JSON.parse(raw) as CLIConfig;
    return config.embeddings ?? {};
  } catch {
    return {};
  }
};

const parseStoredPositiveInt = (
  name: string,
  value: number | undefined,
  fallback: number,
): number => {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`~/.gitnexus/config.json embeddings.${name} must be a positive integer`);
  }
  return value;
};

const parseStoredDevice = (
  value: StoredEmbeddingConfig['device'] | undefined,
  fallback: EmbeddingConfig['device'],
): EmbeddingConfig['device'] => value ?? fallback;

export const resolveEmbeddingNodeLimit = (
  explicitLimit: number | undefined,
): number | undefined => {
  if (explicitLimit !== undefined) return explicitLimit;
  const stored = loadStoredEmbeddingConfig();
  if (stored.nodeLimit === undefined) return undefined;
  if (!Number.isInteger(stored.nodeLimit) || stored.nodeLimit < 0) {
    throw new Error('~/.gitnexus/config.json embeddings.nodeLimit must be a non-negative integer');
  }
  return stored.nodeLimit;
};

export const resolveEmbeddingConfig = (
  overrides: Partial<EmbeddingConfig> = {},
): EmbeddingConfig => {
  const env = process.env;
  const stored = loadStoredEmbeddingConfig();
  const storedConfig: Partial<EmbeddingConfig> = {
    batchSize: parseStoredPositiveInt(
      'batchSize',
      stored.batchSize,
      DEFAULT_EMBEDDING_CONFIG.batchSize,
    ),
    subBatchSize: parseStoredPositiveInt(
      'subBatchSize',
      stored.subBatchSize,
      DEFAULT_EMBEDDING_CONFIG.subBatchSize,
    ),
    threads: parseStoredPositiveInt('threads', stored.threads, defaultEmbeddingThreads()),
    device: parseStoredDevice(stored.device, DEFAULT_EMBEDDING_CONFIG.device),
  };

  return {
    ...DEFAULT_EMBEDDING_CONFIG,
    ...storedConfig,
    ...overrides,
    batchSize: parsePositiveInt(
      'GITNEXUS_EMBEDDING_BATCH_SIZE',
      env.GITNEXUS_EMBEDDING_BATCH_SIZE,
      overrides.batchSize ?? storedConfig.batchSize ?? DEFAULT_EMBEDDING_CONFIG.batchSize,
    ),
    subBatchSize: parsePositiveInt(
      'GITNEXUS_EMBEDDING_SUB_BATCH_SIZE',
      env.GITNEXUS_EMBEDDING_SUB_BATCH_SIZE,
      overrides.subBatchSize ?? storedConfig.subBatchSize ?? DEFAULT_EMBEDDING_CONFIG.subBatchSize,
    ),
    threads: parsePositiveInt(
      'GITNEXUS_EMBEDDING_THREADS',
      env.GITNEXUS_EMBEDDING_THREADS,
      overrides.threads ?? storedConfig.threads ?? defaultEmbeddingThreads(),
    ),
    device:
      parseDevice(env.GITNEXUS_EMBEDDING_DEVICE) ??
      overrides.device ??
      storedConfig.device ??
      DEFAULT_EMBEDDING_CONFIG.device,
  };
};
