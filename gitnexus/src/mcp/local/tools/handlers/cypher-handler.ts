import { executeQuery, isKuzuReady } from '../../../core/kuzu-adapter.js';
import { isWriteQuery } from '../shared/query-safety.js';
import type { ToolContext } from '../tool-context.js';

export interface CypherToolParams {
  query: string;
}

export async function runCypherTool(ctx: ToolContext, params: CypherToolParams): Promise<any> {
  const query = typeof params?.query === 'string' ? params.query.trim() : '';
  if (!query) {
    return { error: 'query parameter is required and cannot be empty.' };
  }

  await ctx.runtime.ensureInitialized(ctx.repo.id);

  if (!isKuzuReady(ctx.repo.id)) {
    return { error: 'KuzuDB not ready. Index may be corrupted.' };
  }

  // Block write operations (defense-in-depth — DB is already read-only)
  if (isWriteQuery(query)) {
    return { error: 'Write operations (CREATE, DELETE, SET, MERGE, REMOVE, DROP, ALTER, COPY, DETACH) are not allowed. The knowledge graph is read-only.' };
  }

  try {
    const result = await executeQuery(ctx.repo.id, query);
    return result;
  } catch (err: any) {
    return { error: err.message || 'Query failed' };
  }
}
