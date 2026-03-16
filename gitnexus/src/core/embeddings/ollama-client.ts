export interface OllamaEmbeddingRequest {
  baseUrl: string;
  model: string;
  dimensions: number;
}

const validateEmbedding = (
  embedding: unknown,
  dimensions: number,
  index: number,
): Float32Array => {
  if (!Array.isArray(embedding) || !embedding.every(value => typeof value === 'number')) {
    throw new Error(`Ollama embedding response malformed for item ${index}`);
  }

  if (embedding.length !== dimensions) {
    throw new Error(`Ollama embedding dimension mismatch: expected ${dimensions}, got ${embedding.length} for item ${index}`);
  }

  return new Float32Array(embedding);
};

export const embedTextsWithOllama = async (
  texts: string[],
  request: OllamaEmbeddingRequest,
): Promise<Float32Array[]> => {
  const response = await fetch(`${request.baseUrl}/api/embed`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model,
      input: texts,
      dimensions: request.dimensions,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(`Ollama embed request failed (${response.status}): ${detail}`);
  }

  const payload = await response.json() as { embeddings?: unknown };
  if (!Array.isArray(payload.embeddings) || payload.embeddings.length !== texts.length) {
    throw new Error('Ollama embedding response malformed');
  }

  return payload.embeddings.map((embedding, index) =>
    validateEmbedding(embedding, request.dimensions, index),
  );
};

export const embedQueryWithOllama = async (
  query: string,
  request: OllamaEmbeddingRequest,
): Promise<number[]> => {
  const [embedding] = await embedTextsWithOllama([query], request);
  return Array.from(embedding);
};
