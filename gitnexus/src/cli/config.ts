import { DEFAULT_EMBEDDING_CONFIG } from '../core/embeddings/types.js';
import { getEmbeddingRuntimeConfig } from '../core/embeddings/runtime-config.js';
import { getCliEmbeddingConfig, getEmbeddingNodeLimit } from './embedding-overrides.js';
import { loadCLIConfig, saveCLIConfig, type CLIConfig } from '../storage/repo-manager.js';

interface EmbeddingsConfigShowOptions {
  json?: boolean;
}

interface EmbeddingsConfigSetOptions {
  provider?: string;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  nodeLimit?: string;
  batchSize?: string;
  hfRemoteHost?: string;
  hfCacheDir?: string;
  hfLocalModelPath?: string;
  localOnly?: string;
}

export type SettingSource = 'env' | 'config' | 'default';

export interface EmbeddingsConfigSnapshot {
  stored: NonNullable<CLIConfig['embeddings']>;
  effective: {
    provider: string;
    remoteHost?: string;
    cacheDir?: string;
    localModelPath?: string;
    localOnly: boolean;
    ollamaBaseUrl: string;
    ollamaModel: string;
    nodeLimit: number;
    batchSize: number;
  };
  sources: {
    provider: SettingSource;
    ollamaBaseUrl: SettingSource;
    ollamaModel: SettingSource;
    remoteHost: SettingSource;
    cacheDir: SettingSource;
    localModelPath: SettingSource;
    localOnly: SettingSource;
    nodeLimit: SettingSource;
    batchSize: SettingSource;
  };
  precedence: string;
}

function parsePositiveIntegerOption(label: string, raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return value;
}

function parseBooleanOption(raw: string | undefined): boolean | undefined {
  if (raw === undefined) return undefined;
  const normalized = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  throw new Error('localOnly must be one of: true, false, 1, 0, yes, no, on, off');
}

function parseProvider(raw: string | undefined): 'huggingface' | 'ollama' | undefined {
  if (raw === undefined) return undefined;
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'huggingface' || normalized === 'ollama') {
    return normalized;
  }
  throw new Error('Unsupported embedding provider');
}

function determineSource(
  envValue: string | undefined,
  configValue: unknown,
): SettingSource {
  if (envValue !== undefined) return 'env';
  if (configValue !== undefined) return 'config';
  return 'default';
}

export function getEmbeddingsConfigSnapshot(
  storedConfig: CLIConfig,
  env: NodeJS.ProcessEnv = process.env,
): EmbeddingsConfigSnapshot {
  const storedEmbeddings = storedConfig.embeddings || {};
  const effectiveRuntime = getEmbeddingRuntimeConfig(env, storedConfig);
  const effectiveNodeLimit = getEmbeddingNodeLimit(storedConfig);
  const effectiveBatchConfig = getCliEmbeddingConfig(storedConfig);

  const effective = {
    ...effectiveRuntime,
    nodeLimit: effectiveNodeLimit,
    batchSize: effectiveBatchConfig.batchSize ?? DEFAULT_EMBEDDING_CONFIG.batchSize,
  };

  const sources = {
    provider: determineSource(env.GITNEXUS_EMBEDDING_PROVIDER, storedEmbeddings.provider),
    ollamaBaseUrl: determineSource(env.GITNEXUS_OLLAMA_BASE_URL, storedEmbeddings.ollamaBaseUrl),
    ollamaModel: determineSource(env.GITNEXUS_OLLAMA_MODEL, storedEmbeddings.ollamaModel),
    remoteHost: determineSource(env.GITNEXUS_HF_REMOTE_HOST || env.HF_ENDPOINT, storedEmbeddings.remoteHost),
    cacheDir: determineSource(env.GITNEXUS_HF_CACHE_DIR, storedEmbeddings.cacheDir),
    localModelPath: determineSource(env.GITNEXUS_HF_LOCAL_MODEL_PATH, storedEmbeddings.localModelPath),
    localOnly: determineSource(env.GITNEXUS_HF_LOCAL_ONLY, storedEmbeddings.localOnly),
    nodeLimit: determineSource(env.GITNEXUS_EMBEDDING_NODE_LIMIT, storedEmbeddings.nodeLimit),
    batchSize: determineSource(env.GITNEXUS_EMBEDDING_BATCH_SIZE, storedEmbeddings.batchSize),
  };

  return {
    stored: storedEmbeddings,
    effective,
    sources,
    precedence: 'environment variables > ~/.gitnexus/config.json > built-in defaults',
  };
}

export async function embeddingsConfigShowCommand(options: EmbeddingsConfigShowOptions = {}): Promise<void> {
  const storedConfig = await loadCLIConfig();
  const payload = getEmbeddingsConfigSnapshot(storedConfig);

  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log('Stored embeddings config:');
  console.log(JSON.stringify(payload.stored, null, 2));
  console.log('');
  console.log('Effective embeddings config:');
  console.log(JSON.stringify(payload.effective, null, 2));
  console.log('');
  console.log('Sources:');
  console.log(JSON.stringify(payload.sources, null, 2));
  console.log('');
  console.log(`Precedence: ${payload.precedence}`);
}

export async function embeddingsConfigSetCommand(options: EmbeddingsConfigSetOptions): Promise<void> {
  const existing = await loadCLIConfig();
  const nextEmbeddings = { ...(existing.embeddings || {}) } as NonNullable<CLIConfig['embeddings']>;

  const provider = parseProvider(options.provider);
  if (provider !== undefined) nextEmbeddings.provider = provider;

  if (options.ollamaBaseUrl !== undefined) nextEmbeddings.ollamaBaseUrl = options.ollamaBaseUrl.trim();
  if (options.ollamaModel !== undefined) nextEmbeddings.ollamaModel = options.ollamaModel.trim();
  if (options.hfRemoteHost !== undefined) nextEmbeddings.remoteHost = options.hfRemoteHost.trim();
  if (options.hfCacheDir !== undefined) nextEmbeddings.cacheDir = options.hfCacheDir.trim();
  if (options.hfLocalModelPath !== undefined) nextEmbeddings.localModelPath = options.hfLocalModelPath.trim();

  const nodeLimit = parsePositiveIntegerOption('nodeLimit', options.nodeLimit);
  if (nodeLimit !== undefined) nextEmbeddings.nodeLimit = nodeLimit;

  const batchSize = parsePositiveIntegerOption('batchSize', options.batchSize);
  if (batchSize !== undefined) nextEmbeddings.batchSize = batchSize;

  const localOnly = parseBooleanOption(options.localOnly);
  if (localOnly !== undefined) nextEmbeddings.localOnly = localOnly;

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
