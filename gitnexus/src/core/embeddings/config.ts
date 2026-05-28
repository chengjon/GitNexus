import { readFileSync } from 'node:fs';
import { defaultEmbeddingThreads } from '../platform/capabilities.js';
import { getGlobalConfigPath, type CLIConfig } from '../../storage/repo-manager.js';
import { logger } from '../logger.js';
import { DEFAULT_EMBEDDING_CONFIG, type EmbeddingConfig } from './types.js';

export const DEFAULT_VECTOR_MAX_DISTANCE = 0.5;
export const DEFAULT_MCP_VECTOR_MAX_DISTANCE = 0.6;

/**
 * Cosine distance over normalized embeddings is bounded to [0, 2], so any threshold
 * above this accepts every row and silently disables the relevance filter. Values
 * over the ceiling are clamped to it rather than passed through.
 */
export const VECTOR_MAX_DISTANCE_CEILING = 2;

const warned = new Set<string>();

const warnOnce = (key: string, message: string): void => {
  if (warned.has(key)) return;
  warned.add(key);
  logger.warn(message);
};

/**
 * Resolve the effective max accepted vector/semantic cosine distance.
 * Reads `GITNEXUS_VECTOR_MAX_DISTANCE`. Unset/empty/whitespace → silent fallback.
 * Invalid (non-numeric, <= 0, non-finite) → fallback plus a one-time warning.
 * Values above the cosine ceiling (2) are clamped to it with a one-time warning.
 */
export const getVectorMaxDistance = (fallback: number = DEFAULT_VECTOR_MAX_DISTANCE): number => {
  const raw = process.env.GITNEXUS_VECTOR_MAX_DISTANCE;
  if (raw === undefined || raw.trim() === '') return fallback;

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    warnOnce(
      `invalid:${raw}`,
      `  GITNEXUS_VECTOR_MAX_DISTANCE must be a positive number in (0, ${VECTOR_MAX_DISTANCE_CEILING}], got "${raw}" — using default ${fallback}`,
    );
    return fallback;
  }
  if (parsed > VECTOR_MAX_DISTANCE_CEILING) {
    warnOnce(
      `clamp:${raw}`,
      `  GITNEXUS_VECTOR_MAX_DISTANCE=${parsed} exceeds the cosine-distance ceiling (${VECTOR_MAX_DISTANCE_CEILING}) — clamping`,
    );
    return VECTOR_MAX_DISTANCE_CEILING;
  }
  return parsed;
};

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
