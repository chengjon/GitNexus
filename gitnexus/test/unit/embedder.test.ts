import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
    it('returns false before initialization', () => {
      expect(isEmbedderReady()).toBe(false);
    });
  });
});
