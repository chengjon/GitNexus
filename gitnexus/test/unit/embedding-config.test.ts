import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveEmbeddingConfig } from '../../src/core/embeddings/config.js';

const OLD_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...OLD_ENV };
});

describe('resolveEmbeddingConfig', () => {
  it('applies env overrides for local resource controls', () => {
    process.env.GITNEXUS_EMBEDDING_THREADS = '3';
    process.env.GITNEXUS_EMBEDDING_BATCH_SIZE = '7';
    process.env.GITNEXUS_EMBEDDING_SUB_BATCH_SIZE = '5';
    process.env.GITNEXUS_EMBEDDING_DEVICE = 'cpu';

    const config = resolveEmbeddingConfig();

    expect(config.threads).toBe(3);
    expect(config.batchSize).toBe(7);
    expect(config.subBatchSize).toBe(5);
    expect(config.device).toBe('cpu');
  });

  it('rejects invalid numeric env values', () => {
    process.env.GITNEXUS_EMBEDDING_THREADS = '0';

    expect(() => resolveEmbeddingConfig()).toThrow('GITNEXUS_EMBEDDING_THREADS');
  });

  it('uses ~/.gitnexus/config.json defaults below environment overrides', async () => {
    const tmpHome = await fs.mkdtemp(path.join(os.tmpdir(), 'gitnexus-embedding-config-'));
    try {
      process.env = { ...OLD_ENV, HOME: tmpHome, GITNEXUS_HOME: path.join(tmpHome, '.gitnexus') };
      await fs.mkdir(path.join(tmpHome, '.gitnexus'), { recursive: true });
      await fs.writeFile(
        path.join(tmpHome, '.gitnexus', 'config.json'),
        JSON.stringify({
          embeddings: {
            batchSize: 17,
            subBatchSize: 6,
            threads: 2,
            device: 'cpu',
          },
        }),
        'utf-8',
      );

      expect(resolveEmbeddingConfig()).toMatchObject({
        batchSize: 17,
        subBatchSize: 6,
        threads: 2,
        device: 'cpu',
      });

      process.env.GITNEXUS_EMBEDDING_BATCH_SIZE = '19';
      expect(resolveEmbeddingConfig().batchSize).toBe(19);
    } finally {
      await fs.rm(tmpHome, { recursive: true, force: true });
    }
  });
});
