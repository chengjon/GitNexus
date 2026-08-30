import { createHash } from 'node:crypto';
import { getEmbeddingDimensions } from './embedder.js';
import { resolveEmbeddingConfig } from './config.js';
import { isHttpMode, resolveHttpEndpoint, safeUrl } from './http-client.js';

export interface EmbeddingIdentity {
  model: string;
  dimensions: number;
  provider: string;
}

/**
 * Identify the vector space strongly enough to resume without mixing providers.
 * The HTTP fingerprint excludes URL credentials and query parameters before
 * hashing, so metadata contains neither an endpoint nor a secret-derived hash.
 */
export function resolveEmbeddingIdentity(): EmbeddingIdentity {
  if (!isHttpMode()) {
    return {
      model: resolveEmbeddingConfig().modelId,
      dimensions: getEmbeddingDimensions(),
      provider: 'local',
    };
  }

  // Env vars win (CLI flags); otherwise use the stored provider endpoint that
  // activated HTTP mode. The fallbacks keep this total: resolveHttpEndpoint
  // returns null when the stored config fails validation, and a null url only
  // downgrades the fingerprint (never throws).
  const endpoint = resolveHttpEndpoint();
  const url = process.env.GITNEXUS_EMBEDDING_URL ?? endpoint?.baseUrl ?? '';
  const model =
    process.env.GITNEXUS_EMBEDDING_MODEL ?? endpoint?.model ?? resolveEmbeddingConfig().modelId;
  return {
    model,
    dimensions: getEmbeddingDimensions(),
    provider: `http:${createHash('sha256').update(safeUrl(url)).digest('hex')}`,
  };
}
