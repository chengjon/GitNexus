export interface EmbeddingRuntimeConfig {
  remoteHost?: string;
  cacheDir?: string;
  localModelPath?: string;
  localOnly: boolean;
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

export const getEmbeddingRuntimeConfig = (env: EnvSource = process.env): EmbeddingRuntimeConfig => ({
  remoteHost: normalizeRemoteHost(env.GITNEXUS_HF_REMOTE_HOST || env.HF_ENDPOINT),
  cacheDir: env.GITNEXUS_HF_CACHE_DIR?.trim() || undefined,
  localModelPath: env.GITNEXUS_HF_LOCAL_MODEL_PATH?.trim() || undefined,
  localOnly: parseTruthy(env.GITNEXUS_HF_LOCAL_ONLY),
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
    || causeCode === 'UND_ERR_CONNECT_TIMEOUT';

  if (!isNetworkTimeout) {
    return error instanceof Error ? error : new Error(message);
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
