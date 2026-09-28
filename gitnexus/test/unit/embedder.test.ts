import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isHttpMode } from '../../src/core/embeddings/http-client.js';
import { assessLocalEmbeddingRuntime } from '../../src/core/embeddings/runtime-support.js';
import { getEmbeddingDims, isEmbedderReady } from '../../src/mcp/core/embedder.js';

const EMBEDDING_ENV_KEYS = [
  'GITNEXUS_EMBEDDING_PROVIDER',
  'GITNEXUS_EMBEDDING_URL',
  'GITNEXUS_EMBEDDING_MODEL',
  'GITNEXUS_EMBEDDING_API_KEY',
  'GITNEXUS_EMBEDDING_DIMS',
  'GITNEXUS_OLLAMA_BASE_URL',
  'GITNEXUS_OLLAMA_MODEL',
] as const;

describe('embedder', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let tempHome = '';

  beforeEach(() => {
    originalEnv = { ...process.env };
    tempHome = mkdtempSync(path.join(os.tmpdir(), 'gitnexus-embedder-home-'));
    process.env = {
      ...originalEnv,
      HOME: tempHome,
      GITNEXUS_HOME: path.join(tempHome, '.gitnexus'),
    };
    for (const key of EMBEDDING_ENV_KEYS) delete process.env[key];
  });

  afterEach(() => {
    process.env = originalEnv;
    rmSync(tempHome, { recursive: true, force: true });
    tempHome = '';
  });

  describe('getEmbeddingDims', () => {
    it('returns 384 (MiniLM default)', () => {
      expect(getEmbeddingDims()).toBe(384);
    });
  });

  describe('isEmbedderReady', () => {
    it('follows HTTP mode or a ready local runtime, not resolution alone', () => {
      expect(isEmbedderReady()).toBe(
        isHttpMode() || assessLocalEmbeddingRuntime().status === 'ready',
      );
    });
  });

  it('does not import the Hugging Face transformers package', () => {
    const src = readFileSync(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/mcp/core/embedder.ts'),
      'utf8',
    );
    expect(src).not.toMatch(/from\s+['"]@huggingface\/transformers['"]/);
    expect(src).not.toMatch(/import\s*\(\s*['"]@huggingface\/transformers['"]/);
    expect(src).not.toMatch(/from\s+['"]onnxruntime-node['"]/);
    expect(src).not.toMatch(/import\s*\(\s*['"]onnxruntime-node['"]/);
    expect(src).not.toMatch(/from\s+['"].*embedding-local-init['"]/);
    expect(src).not.toMatch(/import\s*\(\s*['"].*embedding-local-init['"]/);
  });
});
