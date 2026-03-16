import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_EMBEDDING_NODE_LIMIT,
  getCliEmbeddingConfig,
  getEmbeddingNodeLimit,
} from '../../src/cli/embedding-overrides.js';

const originalNodeLimit = process.env.GITNEXUS_EMBEDDING_NODE_LIMIT;
const originalBatchSize = process.env.GITNEXUS_EMBEDDING_BATCH_SIZE;

afterEach(() => {
  if (originalNodeLimit === undefined) {
    delete process.env.GITNEXUS_EMBEDDING_NODE_LIMIT;
  } else {
    process.env.GITNEXUS_EMBEDDING_NODE_LIMIT = originalNodeLimit;
  }

  if (originalBatchSize === undefined) {
    delete process.env.GITNEXUS_EMBEDDING_BATCH_SIZE;
  } else {
    process.env.GITNEXUS_EMBEDDING_BATCH_SIZE = originalBatchSize;
  }
});

describe('embedding overrides', () => {
  it('uses the default node limit when env is unset', () => {
    delete process.env.GITNEXUS_EMBEDDING_NODE_LIMIT;
    expect(getEmbeddingNodeLimit({} as any)).toBe(DEFAULT_EMBEDDING_NODE_LIMIT);
  });

  it('uses the node limit override when env is a positive integer', () => {
    process.env.GITNEXUS_EMBEDDING_NODE_LIMIT = '90000';
    expect(getEmbeddingNodeLimit({} as any)).toBe(90000);
  });

  it('uses the node limit from CLI config when env is unset', () => {
    delete process.env.GITNEXUS_EMBEDDING_NODE_LIMIT;
    expect(getEmbeddingNodeLimit({
      embeddings: { nodeLimit: 85000 },
    } as any)).toBe(85000);
  });

  it('falls back to the default node limit when env is invalid', () => {
    process.env.GITNEXUS_EMBEDDING_NODE_LIMIT = 'not-a-number';
    expect(getEmbeddingNodeLimit({} as any)).toBe(DEFAULT_EMBEDDING_NODE_LIMIT);
  });

  it('uses the default embedding config when batch size env is unset', () => {
    delete process.env.GITNEXUS_EMBEDDING_BATCH_SIZE;
    expect(getCliEmbeddingConfig({} as any)).toEqual({});
  });

  it('overrides batch size when env is a positive integer', () => {
    process.env.GITNEXUS_EMBEDDING_BATCH_SIZE = '8';
    expect(getCliEmbeddingConfig({} as any)).toEqual({ batchSize: 8 });
  });

  it('uses batch size from CLI config when env is unset', () => {
    delete process.env.GITNEXUS_EMBEDDING_BATCH_SIZE;
    expect(getCliEmbeddingConfig({
      embeddings: { batchSize: 12 },
    } as any)).toEqual({ batchSize: 12 });
  });

  it('falls back to the default batch size when env is invalid', () => {
    process.env.GITNEXUS_EMBEDDING_BATCH_SIZE = '-4';
    expect(getCliEmbeddingConfig({} as any)).toEqual({});
  });
});
