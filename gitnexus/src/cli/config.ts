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

type SettingSource = 'env' | 'config' | 'default';

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

export async function embeddingsConfigShowCommand(options: EmbeddingsConfigShowOptions = {}): Promise<void> {
  const storedConfig = await loadCLIConfig();
  const storedEmbeddings = storedConfig.embeddings || {};
  const effectiveRuntime = getEmbeddingRuntimeConfig(process.env, storedConfig);
  const effectiveNodeLimit = getEmbeddingNodeLimit(storedConfig);
  const effectiveBatchConfig = getCliEmbeddingConfig(storedConfig);

  const effective = {
    ...effectiveRuntime,
    nodeLimit: effectiveNodeLimit,
    batchSize: effectiveBatchConfig.batchSize ?? DEFAULT_EMBEDDING_CONFIG.batchSize,
  };

  const sources = {
    provider: determineSource(process.env.GITNEXUS_EMBEDDING_PROVIDER, storedEmbeddings.provider),
    ollamaBaseUrl: determineSource(process.env.GITNEXUS_OLLAMA_BASE_URL, storedEmbeddings.ollamaBaseUrl),
    ollamaModel: determineSource(process.env.GITNEXUS_OLLAMA_MODEL, storedEmbeddings.ollamaModel),
    remoteHost: determineSource(process.env.GITNEXUS_HF_REMOTE_HOST || process.env.HF_ENDPOINT, storedEmbeddings.remoteHost),
    cacheDir: determineSource(process.env.GITNEXUS_HF_CACHE_DIR, storedEmbeddings.cacheDir),
    localModelPath: determineSource(process.env.GITNEXUS_HF_LOCAL_MODEL_PATH, storedEmbeddings.localModelPath),
    localOnly: determineSource(process.env.GITNEXUS_HF_LOCAL_ONLY, storedEmbeddings.localOnly),
    nodeLimit: determineSource(process.env.GITNEXUS_EMBEDDING_NODE_LIMIT, storedEmbeddings.nodeLimit),
    batchSize: determineSource(process.env.GITNEXUS_EMBEDDING_BATCH_SIZE, storedEmbeddings.batchSize),
  };

  const payload = {
    stored: storedEmbeddings,
    effective,
    sources,
    precedence: 'environment variables > ~/.gitnexus/config.json > built-in defaults',
  };

  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log('Stored embeddings config:');
  console.log(JSON.stringify(storedEmbeddings, null, 2));
  console.log('');
  console.log('Effective embeddings config:');
  console.log(JSON.stringify(effective, null, 2));
  console.log('');
  console.log('Sources:');
  console.log(JSON.stringify(sources, null, 2));
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
