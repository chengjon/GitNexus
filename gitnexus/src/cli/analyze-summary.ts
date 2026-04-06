export interface AnalyzeSummaryInput {
  totalTime: string;
  cachedEmbeddingsCount: number;
  nodes: number;
  edges: number;
  communityCount: number;
  processCount: number;
  kuzuTime: string;
  ftsTime: string;
  embeddingSkipped: boolean;
  embeddingSkipReason: string;
  embeddingTime: string;
  embeddingsEnabled: boolean | undefined;
  embeddingDetail: string;
  repoPath: string;
  contextFiles: string[];
  kuzuWarnings: string[];
  embeddingPersistenceWarning: string;
  showIncrementalEmbeddingRefreshTip: boolean;
  showSetupTip: boolean;
}

const parseFallbackEdgeCount = (warning: string): number => {
  const match = warning.match(/\((\d+) edges\)/);
  return match ? parseInt(match[1], 10) : 0;
};

export function buildAnalyzeSummaryLines(input: AnalyzeSummaryInput): string[] {
  const lines: string[] = [
    '',
    `  Repository indexed successfully (${input.totalTime}s)${input.cachedEmbeddingsCount > 0 ? ` [${input.cachedEmbeddingsCount} embeddings cached]` : ''}`,
    '',
    `  ${input.nodes.toLocaleString()} nodes | ${input.edges.toLocaleString()} edges | ${input.communityCount} clusters | ${input.processCount} flows`,
    `  KuzuDB ${input.kuzuTime}s | FTS ${input.ftsTime}s | Embeddings ${input.embeddingSkipped ? input.embeddingSkipReason : `${input.embeddingTime}s`}`,
  ];

  if (input.embeddingsEnabled && input.embeddingDetail) {
    lines.push(`  Embeddings detail: ${input.embeddingDetail}`);
  }

  lines.push(`  ${input.repoPath}`);

  if (input.contextFiles.length > 0) {
    lines.push(`  Context: ${input.contextFiles.join(', ')}`);
  }

  if (input.kuzuWarnings.length > 0) {
    const totalFallback = input.kuzuWarnings.reduce((sum, warning) => sum + parseFallbackEdgeCount(warning), 0);
    lines.push(`  Note: ${totalFallback} edges across ${input.kuzuWarnings.length} types inserted via fallback (schema will be updated in next release)`);
  }

  if (input.embeddingPersistenceWarning) {
    lines.push(`  Warning: ${input.embeddingPersistenceWarning}`);
  }

  if (input.showIncrementalEmbeddingRefreshTip) {
    lines.push('  Tip: Future refreshes usually omit `--force` so GitNexus can reuse existing embeddings.');
  }

  if (input.showSetupTip) {
    lines.push('', '  Tip: Run `gitnexus setup` to configure MCP for your editor.');
  }

  lines.push('');
  return lines;
}
