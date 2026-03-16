import { describe, expect, it } from 'vitest';
import {
  applyEmbeddingRuntimeConfig,
  formatEmbeddingInitError,
  getEmbeddingRuntimeConfig,
} from '../../src/core/embeddings/runtime-config.js';

describe('embedding runtime config', () => {
  it('reads remote host overrides from gitnexus env vars', () => {
    expect(getEmbeddingRuntimeConfig({
      GITNEXUS_HF_REMOTE_HOST: 'https://hf-mirror.com',
    }, {})).toEqual({
      provider: 'huggingface',
      remoteHost: 'https://hf-mirror.com/',
      cacheDir: undefined,
      localModelPath: undefined,
      localOnly: false,
      ollamaBaseUrl: 'http://localhost:11434',
      ollamaModel: 'qwen3-embedding',
    });
  });

  it('falls back to HF_ENDPOINT when gitnexus-specific host is unset', () => {
    expect(getEmbeddingRuntimeConfig({
      HF_ENDPOINT: 'https://mirror.local',
    }, {}).remoteHost).toBe('https://mirror.local/');
  });

  it('reads ollama provider config from env vars', () => {
    expect(getEmbeddingRuntimeConfig({
      GITNEXUS_EMBEDDING_PROVIDER: 'ollama',
      GITNEXUS_OLLAMA_BASE_URL: 'http://docker.internal:11434/',
      GITNEXUS_OLLAMA_MODEL: 'qwen3-embedding',
    }, {})).toEqual({
      provider: 'ollama',
      remoteHost: undefined,
      cacheDir: undefined,
      localModelPath: undefined,
      localOnly: false,
      ollamaBaseUrl: 'http://docker.internal:11434',
      ollamaModel: 'qwen3-embedding',
    });
  });

  it('reads embeddings settings from CLI config when env vars are unset', () => {
    expect(getEmbeddingRuntimeConfig({}, {
      embeddings: {
        provider: 'ollama',
        ollamaBaseUrl: 'http://docker.internal:11434',
        ollamaModel: 'qwen3-embedding:0.6b',
      },
    })).toEqual({
      provider: 'ollama',
      remoteHost: undefined,
      cacheDir: undefined,
      localModelPath: undefined,
      localOnly: false,
      ollamaBaseUrl: 'http://docker.internal:11434',
      ollamaModel: 'qwen3-embedding:0.6b',
    });
  });

  it('lets env vars override CLI config embeddings settings', () => {
    expect(getEmbeddingRuntimeConfig({
      GITNEXUS_EMBEDDING_PROVIDER: 'huggingface',
      GITNEXUS_HF_REMOTE_HOST: 'https://hf-mirror.com',
    }, {
      embeddings: {
        provider: 'ollama',
        ollamaBaseUrl: 'http://docker.internal:11434',
        ollamaModel: 'qwen3-embedding:0.6b',
      },
    })).toEqual({
      provider: 'huggingface',
      remoteHost: 'https://hf-mirror.com/',
      cacheDir: undefined,
      localModelPath: undefined,
      localOnly: false,
      ollamaBaseUrl: 'http://docker.internal:11434',
      ollamaModel: 'qwen3-embedding:0.6b',
    });
  });

  it('applies local-only mode and local model path to transformers env', () => {
    const target = {
      allowRemoteModels: true,
      allowLocalModels: false,
      remoteHost: 'https://huggingface.co/',
    };

    applyEmbeddingRuntimeConfig(target, {
      provider: 'huggingface',
      remoteHost: undefined,
      cacheDir: '/tmp/hf-cache',
      localModelPath: '/models',
      localOnly: true,
      ollamaBaseUrl: 'http://localhost:11434',
      ollamaModel: 'qwen3-embedding',
    });

    expect(target).toEqual({
      allowRemoteModels: false,
      allowLocalModels: true,
      remoteHost: 'https://huggingface.co/',
      cacheDir: '/tmp/hf-cache',
      localModelPath: '/models',
    });
  });

  it('formats network timeout errors with actionable hints', () => {
    const error = new TypeError('fetch failed');
    Object.assign(error, { cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } });

    const formatted = formatEmbeddingInitError(error, {
      provider: 'huggingface',
      remoteHost: undefined,
      cacheDir: undefined,
      localModelPath: undefined,
      localOnly: false,
      ollamaBaseUrl: 'http://localhost:11434',
      ollamaModel: 'qwen3-embedding',
    });

    expect(formatted.message).toContain('Embedding model download failed');
    expect(formatted.message).toContain('HF_ENDPOINT');
    expect(formatted.message).toContain('GITNEXUS_HF_LOCAL_MODEL_PATH');
  });

  it('formats ollama connection errors with actionable hints', () => {
    const error = new TypeError('fetch failed');
    Object.assign(error, { cause: { code: 'ECONNREFUSED' } });

    const formatted = formatEmbeddingInitError(error, {
      provider: 'ollama',
      remoteHost: undefined,
      cacheDir: undefined,
      localModelPath: undefined,
      localOnly: false,
      ollamaBaseUrl: 'http://localhost:11434',
      ollamaModel: 'qwen3-embedding',
    });

    expect(formatted.message).toContain('Ollama embedding request failed');
    expect(formatted.message).toContain('http://localhost:11434');
    expect(formatted.message).toContain('qwen3-embedding');
  });
});
