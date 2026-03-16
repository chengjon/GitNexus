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
    })).toEqual({
      remoteHost: 'https://hf-mirror.com/',
      cacheDir: undefined,
      localModelPath: undefined,
      localOnly: false,
    });
  });

  it('falls back to HF_ENDPOINT when gitnexus-specific host is unset', () => {
    expect(getEmbeddingRuntimeConfig({
      HF_ENDPOINT: 'https://mirror.local',
    }).remoteHost).toBe('https://mirror.local/');
  });

  it('applies local-only mode and local model path to transformers env', () => {
    const target = {
      allowRemoteModels: true,
      allowLocalModels: false,
      remoteHost: 'https://huggingface.co/',
    };

    applyEmbeddingRuntimeConfig(target, {
      remoteHost: undefined,
      cacheDir: '/tmp/hf-cache',
      localModelPath: '/models',
      localOnly: true,
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
      remoteHost: undefined,
      cacheDir: undefined,
      localModelPath: undefined,
      localOnly: false,
    });

    expect(formatted.message).toContain('Embedding model download failed');
    expect(formatted.message).toContain('HF_ENDPOINT');
    expect(formatted.message).toContain('GITNEXUS_HF_LOCAL_MODEL_PATH');
  });
});
