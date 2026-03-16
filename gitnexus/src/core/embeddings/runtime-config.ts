export type EmbeddingProvider = 'huggingface' | 'ollama';

export interface EmbeddingRuntimeConfig {
  provider: EmbeddingProvider;
  remoteHost?: string;
  cacheDir?: string;
  localModelPath?: string;
  localOnly: boolean;
  ollamaBaseUrl: string;
  ollamaModel: string;
}

type EnvSource = Record<string, string | undefined>;

const parseTruthy = (value?: string): boolean =>
  value === '1' || value === 'true' || value === 'TRUE' || value === 'yes' || value === 'on';

const normalizeRemoteHost = (value?: string): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
};

const normalizeBaseUrl = (value: string): string => {
  const trimmed = value.trim();
  const withoutSlash = trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
  return withoutSlash || 'http://localhost:11434';
};

export const getEmbeddingRuntimeConfig = (env: EnvSource = process.env): EmbeddingRuntimeConfig => ({
  provider: env.GITNEXUS_EMBEDDING_PROVIDER?.trim().toLowerCase() === 'ollama' ? 'ollama' : 'huggingface',
  remoteHost: normalizeRemoteHost(env.GITNEXUS_HF_REMOTE_HOST || env.HF_ENDPOINT),
  cacheDir: env.GITNEXUS_HF_CACHE_DIR?.trim() || undefined,
  localModelPath: env.GITNEXUS_HF_LOCAL_MODEL_PATH?.trim() || undefined,
  localOnly: parseTruthy(env.GITNEXUS_HF_LOCAL_ONLY),
  ollamaBaseUrl: normalizeBaseUrl(env.GITNEXUS_OLLAMA_BASE_URL || 'http://localhost:11434'),
  ollamaModel: env.GITNEXUS_OLLAMA_MODEL?.trim() || 'qwen3-embedding',
});

export const applyEmbeddingRuntimeConfig = (
  target: {
    allowRemoteModels: boolean;
    allowLocalModels: boolean;
    remoteHost?: string;
    cacheDir?: string;
    localModelPath?: string;
  },
  config: EmbeddingRuntimeConfig,
): void => {
  if (config.remoteHost) {
    target.remoteHost = config.remoteHost;
  }
  if (config.cacheDir) {
    target.cacheDir = config.cacheDir;
  }
  if (config.localModelPath) {
    target.localModelPath = config.localModelPath;
    target.allowLocalModels = true;
  }
  if (config.localOnly) {
    target.allowRemoteModels = false;
    target.allowLocalModels = true;
  }
};

export const formatEmbeddingInitError = (error: unknown, config: EmbeddingRuntimeConfig): Error => {
  const message = error instanceof Error ? error.message : String(error ?? 'unknown error');
  const causeCode = typeof error === 'object' && error !== null && 'cause' in error
    ? ((error as { cause?: { code?: string } }).cause?.code || '')
    : '';

  const isNetworkTimeout = message.includes('fetch failed')
    || message.includes('Connect Timeout')
    || causeCode === 'UND_ERR_CONNECT_TIMEOUT'
    || causeCode === 'ECONNREFUSED'
    || causeCode === 'ECONNRESET';

  if (!isNetworkTimeout) {
    return error instanceof Error ? error : new Error(message);
  }

  if (config.provider === 'ollama') {
    return new Error(
      `Ollama embedding request failed: ${message}\n` +
      `Check that Ollama is reachable at ${config.ollamaBaseUrl}.\n` +
      `Check that the embedding model "${config.ollamaModel}" is installed.\n` +
      'Example: `ollama list` and `curl http://localhost:11434/api/tags`.',
    );
  }

  const hints = [
    config.remoteHost
      ? `Current remote host: ${config.remoteHost}`
      : 'Set `HF_ENDPOINT` or `GITNEXUS_HF_REMOTE_HOST` to use a reachable Hugging Face mirror.',
    'Set `GITNEXUS_HF_CACHE_DIR` to persist downloaded model files.',
    'Predownload the model and set `GITNEXUS_HF_LOCAL_MODEL_PATH`, then use `GITNEXUS_HF_LOCAL_ONLY=1` to avoid network access.',
  ];

  return new Error(`Embedding model download failed: ${message}\n${hints.join('\n')}`);
};
