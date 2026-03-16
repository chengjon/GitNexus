import { describe, expect, it } from 'vitest';
import {
  formatEmbeddingRunDetails,
  formatEmbeddingSkipReason,
  shouldSuggestIncrementalEmbeddingRefresh,
} from '../../src/cli/embedding-insights.js';

describe('embedding insights', () => {
  it('formats skip reason using embeddable node count', () => {
    expect(formatEmbeddingSkipReason(78509, 50000)).toBe(
      'skipped (78,509 embeddable nodes > 50,000 limit)',
    );
  });

  it('formats throughput and batch details', () => {
    expect(formatEmbeddingRunDetails({
      provider: 'ollama',
      model: 'qwen3-embedding:0.6b',
      embeddableNodeCount: 78509,
      totalBatches: 9814,
      batchSize: 8,
      seconds: 3865,
    })).toBe(
      '78,509 embeddable | 9,814 batches @ 8 | 20.3 nodes/s | 2.54 batches/s | provider ollama:qwen3-embedding:0.6b',
    );
  });

  it('suggests incremental refresh after force embedding runs', () => {
    expect(shouldSuggestIncrementalEmbeddingRefresh(true, true, 123)).toBe(true);
  });

  it('does not suggest incremental refresh when embeddings were not generated', () => {
    expect(shouldSuggestIncrementalEmbeddingRefresh(true, true, 0)).toBe(false);
    expect(shouldSuggestIncrementalEmbeddingRefresh(false, true, 123)).toBe(false);
  });
});
