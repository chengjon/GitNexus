import { describe, expect, it } from 'vitest';

import { buildAnalyzeSummaryLines } from '../../src/cli/analyze-summary.js';

describe('analyze summary helpers', () => {
  it('builds the full summary with cached embeddings, context, fallback note, and tips', () => {
    const lines = buildAnalyzeSummaryLines({
      totalTime: '12.3',
      cachedEmbeddingsCount: 4,
      nodes: 120,
      edges: 240,
      communityCount: 6,
      processCount: 9,
      kuzuTime: '1.1',
      ftsTime: '0.2',
      embeddingSkipped: false,
      embeddingSkipReason: 'off',
      embeddingTime: '2.4',
      embeddingsEnabled: true,
      embeddingDetail: 'detail text',
      repoPath: '/tmp/repo',
      contextFiles: ['AGENTS.md (updated)', 'CLAUDE.md (updated)'],
      kuzuWarnings: ['Function->Class (12 edges): warning', 'File->Method (3 edges): warning'],
      showIncrementalEmbeddingRefreshTip: true,
      showSetupTip: true,
    });

    expect(lines).toEqual([
      '',
      '  Repository indexed successfully (12.3s) [4 embeddings cached]',
      '',
      '  120 nodes | 240 edges | 6 clusters | 9 flows',
      '  KuzuDB 1.1s | FTS 0.2s | Embeddings 2.4s',
      '  Embeddings detail: detail text',
      '  /tmp/repo',
      '  Context: AGENTS.md (updated), CLAUDE.md (updated)',
      '  Note: 15 edges across 2 types inserted via fallback (schema will be updated in next release)',
      '  Tip: Future refreshes usually omit `--force` so GitNexus can reuse existing embeddings.',
      '',
      '  Tip: Run `gitnexus setup` to configure MCP for your editor.',
      '',
    ]);
  });

  it('omits optional lines when embeddings are skipped and no extra context exists', () => {
    const lines = buildAnalyzeSummaryLines({
      totalTime: '5.0',
      cachedEmbeddingsCount: 0,
      nodes: 10,
      edges: 20,
      communityCount: 2,
      processCount: 3,
      kuzuTime: '0.5',
      ftsTime: '0.1',
      embeddingSkipped: true,
      embeddingSkipReason: 'skipped (too many nodes)',
      embeddingTime: '0.0',
      embeddingsEnabled: false,
      embeddingDetail: '',
      repoPath: '/tmp/repo',
      contextFiles: [],
      kuzuWarnings: [],
      showIncrementalEmbeddingRefreshTip: false,
      showSetupTip: false,
    });

    expect(lines).toEqual([
      '',
      '  Repository indexed successfully (5.0s)',
      '',
      '  10 nodes | 20 edges | 2 clusters | 3 flows',
      '  KuzuDB 0.5s | FTS 0.1s | Embeddings skipped (too many nodes)',
      '  /tmp/repo',
      '',
    ]);
  });
});
