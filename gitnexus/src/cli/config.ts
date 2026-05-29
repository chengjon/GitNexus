import { loadCLIConfig, saveCLIConfig, type CLIConfig } from '../storage/repo-manager.js';
import {
  loadStoredEmbeddingConfig,
  resolveEmbeddingConfig,
  resolveEmbeddingNodeLimit,
} from '../core/embeddings/config.js';
import { getHttpDimensions, isHttpMode } from '../core/embeddings/http-client.js';
import { DEFAULT_EMBEDDING_CONFIG, type EmbeddingConfig } from '../core/embeddings/types.js';

export interface EmbeddingsConfigSetOptions {
  provider?: string;
  embeddingUrl?: string;
  embeddingModel?: string;
  embeddingApiKey?: string;
  embeddingDims?: string;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  nodeLimit?: string;
  batchSize?: string;
  subBatchSize?: string;
  threads?: string;
  device?: string;
}

export type EmbeddingsConfigShowOptions = Record<string, never>;

function parseProvider(raw: string | undefined): NonNullable<CLIConfig['embeddings']>['provider'] {
  if (raw === undefined) return undefined;
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'huggingface' || normalized === 'ollama' || normalized === 'http') {
    return normalized;
  }
  throw new Error('Unsupported embedding provider');
}

function parseDevice(raw: string | undefined): EmbeddingConfig['device'] | undefined {
  if (raw === undefined) return undefined;
  if (raw === 'auto' || raw === 'dml' || raw === 'cuda' || raw === 'cpu' || raw === 'wasm') {
    return raw;
  }
  throw new Error('Unsupported embedding device');
}

function parseNonNegativeIntegerOption(name: string, raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return parsed;
}

function parsePositiveIntegerOption(name: string, raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

export async function embeddingsConfigShowCommand(
  _options: EmbeddingsConfigShowOptions = {},
): Promise<void> {
  const stored = loadStoredEmbeddingConfig();
  const effective = resolveEmbeddingConfig();

  console.log('Stored embeddings config:');
  printJson(stored);
  console.log('Effective embeddings config:');
  printJson({
    provider: stored.provider ?? 'huggingface',
    httpMode: isHttpMode(),
    embeddingDims: getHttpDimensions() ?? DEFAULT_EMBEDDING_CONFIG.dimensions,
    nodeLimit: resolveEmbeddingNodeLimit(undefined) ?? 'default',
    batchSize: effective.batchSize,
    subBatchSize: effective.subBatchSize,
    threads: effective.threads,
    device: effective.device,
    defaults: {
      batchSize: DEFAULT_EMBEDDING_CONFIG.batchSize,
      subBatchSize: DEFAULT_EMBEDDING_CONFIG.subBatchSize,
      device: DEFAULT_EMBEDDING_CONFIG.device,
    },
  });
}

export async function embeddingsConfigSetCommand(
  options: EmbeddingsConfigSetOptions,
): Promise<void> {
  const existing = await loadCLIConfig();
  const nextEmbeddings = { ...(existing.embeddings ?? {}) } as NonNullable<CLIConfig['embeddings']>;

  const provider = parseProvider(options.provider);
  if (provider !== undefined) nextEmbeddings.provider = provider;
  if (options.embeddingUrl !== undefined) nextEmbeddings.embeddingUrl = options.embeddingUrl.trim();
  if (options.embeddingModel !== undefined) {
    nextEmbeddings.embeddingModel = options.embeddingModel.trim();
  }
  if (options.embeddingApiKey !== undefined) {
    nextEmbeddings.embeddingApiKey = options.embeddingApiKey.trim();
  }
  if (options.ollamaBaseUrl !== undefined) {
    nextEmbeddings.ollamaBaseUrl = options.ollamaBaseUrl.trim();
  }
  if (options.ollamaModel !== undefined) nextEmbeddings.ollamaModel = options.ollamaModel.trim();

  const embeddingDims = parsePositiveIntegerOption('embeddingDims', options.embeddingDims);
  if (embeddingDims !== undefined) nextEmbeddings.embeddingDims = embeddingDims;

  const nodeLimit = parseNonNegativeIntegerOption('nodeLimit', options.nodeLimit);
  if (nodeLimit !== undefined) nextEmbeddings.nodeLimit = nodeLimit;

  const batchSize = parsePositiveIntegerOption('batchSize', options.batchSize);
  if (batchSize !== undefined) nextEmbeddings.batchSize = batchSize;

  const subBatchSize = parsePositiveIntegerOption('subBatchSize', options.subBatchSize);
  if (subBatchSize !== undefined) nextEmbeddings.subBatchSize = subBatchSize;

  const threads = parsePositiveIntegerOption('threads', options.threads);
  if (threads !== undefined) nextEmbeddings.threads = threads;

  const device = parseDevice(options.device);
  if (device !== undefined) nextEmbeddings.device = device;

  await saveCLIConfig({
    ...existing,
    embeddings: nextEmbeddings,
  });
  console.log('Embeddings config saved to ~/.gitnexus/config.json');
}

export async function embeddingsConfigClearCommand(): Promise<void> {
  const existing = await loadCLIConfig();
  const nextConfig = { ...existing };
  delete nextConfig.embeddings;
  await saveCLIConfig(nextConfig);
  console.log('Embeddings config cleared from ~/.gitnexus/config.json');
}
