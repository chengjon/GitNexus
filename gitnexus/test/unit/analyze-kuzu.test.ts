import { describe, expect, it, vi } from 'vitest';

import {
  createDefaultAnalyzeFTSIndexes,
  reloadKuzuGraphForAnalyze,
} from '../../src/cli/analyze-kuzu.js';

describe('analyze kuzu helpers', () => {
  it('reloads the Kuzu index, clears stale files, and maps load progress into the analyze bar range', async () => {
    const updateBar = vi.fn();
    const closeKuzu = vi.fn(async () => undefined);
    const removePath = vi.fn(async () => undefined);
    const initKuzu = vi.fn(async () => undefined);
    const loadGraphToKuzu = vi.fn(async (_graph, _repoPath, _storagePath, onProgress) => {
      onProgress?.('streaming');
      onProgress?.('copying');
      return { warnings: ['Function->Class (12 edges): warning'] };
    });

    const result = await reloadKuzuGraphForAnalyze({
      kuzuPath: '/tmp/repo/.gitnexus/kuzu',
      storagePath: '/tmp/repo/.gitnexus',
      pipelineResult: {
        graph: {} as any,
        repoPath: '/tmp/repo',
      } as any,
      updateBar,
    }, {
      closeKuzu,
      removePath,
      initKuzu,
      loadGraphToKuzu,
      now: (() => {
        let tick = 0;
        return () => (tick += 100);
      })(),
    });

    expect(updateBar).toHaveBeenCalledWith(60, 'Loading into KuzuDB...');
    expect(closeKuzu).toHaveBeenCalledTimes(1);
    expect(removePath).toHaveBeenCalledTimes(3);
    expect(removePath).toHaveBeenNthCalledWith(1, '/tmp/repo/.gitnexus/kuzu');
    expect(removePath).toHaveBeenNthCalledWith(2, '/tmp/repo/.gitnexus/kuzu.wal');
    expect(removePath).toHaveBeenNthCalledWith(3, '/tmp/repo/.gitnexus/kuzu.lock');
    expect(initKuzu).toHaveBeenCalledWith('/tmp/repo/.gitnexus/kuzu');
    expect(loadGraphToKuzu).toHaveBeenCalledWith(
      {},
      '/tmp/repo',
      '/tmp/repo/.gitnexus',
      expect.any(Function),
    );
    expect(updateBar).toHaveBeenCalledWith(62, 'streaming');
    expect(updateBar).toHaveBeenCalledWith(64, 'copying');
    expect(result).toEqual({
      kuzuTime: '0.1',
      kuzuWarnings: ['Function->Class (12 edges): warning'],
    });
  });

  it('creates the default FTS indexes and swallows index creation errors', async () => {
    const updateBar = vi.fn();
    const createFTSIndex = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('fts unavailable'));

    const result = await createDefaultAnalyzeFTSIndexes({
      updateBar,
    }, {
      createFTSIndex,
      now: (() => {
        let tick = 0;
        return () => (tick += 100);
      })(),
    });

    expect(updateBar).toHaveBeenCalledWith(85, 'Creating search indexes...');
    expect(createFTSIndex).toHaveBeenNthCalledWith(1, 'File', 'file_fts', ['name', 'content']);
    expect(createFTSIndex).toHaveBeenNthCalledWith(2, 'Function', 'function_fts', ['name', 'content']);
    expect(createFTSIndex).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ ftsTime: '0.1' });
  });
});
