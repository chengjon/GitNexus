import { describe, expect, it, vi } from 'vitest';
import { countEmbeddableNodes } from '../../src/core/embeddings/embedding-pipeline.js';

describe('countEmbeddableNodes', () => {
  it('sums counts across all embeddable labels', async () => {
    const executeQuery = vi
      .fn()
      .mockResolvedValueOnce([{ cnt: 3 }])  // Function
      .mockResolvedValueOnce([{ cnt: 2 }])  // Class
      .mockResolvedValueOnce([{ cnt: 5 }])  // Method
      .mockResolvedValueOnce([{ cnt: 1 }])  // Interface
      .mockResolvedValueOnce([{ cnt: 4 }]); // File

    await expect(countEmbeddableNodes(executeQuery)).resolves.toBe(15);
  });

  it('ignores missing tables and continues counting', async () => {
    const executeQuery = vi
      .fn()
      .mockRejectedValueOnce(new Error('missing table'))
      .mockResolvedValueOnce([{ cnt: 2 }])
      .mockResolvedValueOnce([{ cnt: 0 }])
      .mockResolvedValueOnce([{ cnt: 1 }])
      .mockResolvedValueOnce([{ cnt: 4 }]);

    await expect(countEmbeddableNodes(executeQuery)).resolves.toBe(7);
  });
});
