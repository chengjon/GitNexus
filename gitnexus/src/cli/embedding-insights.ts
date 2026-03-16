export interface EmbeddingRunDetail {
  provider: 'huggingface' | 'ollama';
  model: string;
  embeddableNodeCount: number;
  totalBatches: number;
  batchSize: number;
  seconds: number;
}

export const formatEmbeddingSkipReason = (
  embeddableNodeCount: number,
  limit: number,
): string => `skipped (${embeddableNodeCount.toLocaleString()} embeddable nodes > ${limit.toLocaleString()} limit)`;

export const shouldSuggestIncrementalEmbeddingRefresh = (
  force: boolean | undefined,
  embeddingsEnabled: boolean | undefined,
  embeddingCount: number,
): boolean => !!force && !!embeddingsEnabled && embeddingCount > 0;

export const formatEmbeddingRunDetails = (detail: EmbeddingRunDetail): string => {
  const nodesPerSecond = detail.seconds > 0
    ? (detail.embeddableNodeCount / detail.seconds).toFixed(1)
    : '0.0';
  const batchesPerSecond = detail.seconds > 0
    ? (detail.totalBatches / detail.seconds).toFixed(2)
    : '0.00';

  return `${detail.embeddableNodeCount.toLocaleString()} embeddable | ${detail.totalBatches.toLocaleString()} batches @ ${detail.batchSize} | ${nodesPerSecond} nodes/s | ${batchesPerSecond} batches/s | provider ${detail.provider}:${detail.model}`;
};
