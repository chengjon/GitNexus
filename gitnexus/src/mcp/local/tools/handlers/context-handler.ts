import { executeParameterized } from '../../../core/kuzu-adapter.js';
import type { ToolContext } from '../tool-context.js';

export interface ContextToolParams {
  name?: string;
  uid?: string;
  file_path?: string;
  include_content?: boolean;
}

/**
 * Context tool — 360-degree symbol view with categorized refs.
 * Disambiguation when multiple symbols share a name.
 * UID-based direct lookup. No cluster in output.
 */
export async function runContextTool(ctx: ToolContext, params: ContextToolParams): Promise<any> {
  await ctx.runtime.ensureInitialized(ctx.repo.id);

  const { name, uid, file_path, include_content } = params;

  if (!name && !uid) {
    return { error: 'Either "name" or "uid" parameter is required.' };
  }

  // Step 1: Find the symbol
  let symbols: any[];

  if (uid) {
    symbols = await executeParameterized(ctx.repo.id, `
        MATCH (n {id: $uid})
        RETURN n.id AS id, n.name AS name, labels(n)[0] AS type, n.filePath AS filePath, n.startLine AS startLine, n.endLine AS endLine${include_content ? ', n.content AS content' : ''}
        LIMIT 1
      `, { uid });
  } else {
    const isQualified = name!.includes('/') || name!.includes(':');

    let whereClause: string;
    let queryParams: Record<string, any>;
    if (file_path) {
      whereClause = `WHERE n.name = $symName AND n.filePath CONTAINS $filePath`;
      queryParams = { symName: name!, filePath: file_path };
    } else if (isQualified) {
      whereClause = `WHERE n.id = $symName OR n.name = $symName`;
      queryParams = { symName: name! };
    } else {
      whereClause = `WHERE n.name = $symName`;
      queryParams = { symName: name! };
    }

    symbols = await executeParameterized(ctx.repo.id, `
        MATCH (n) ${whereClause}
        RETURN n.id AS id, n.name AS name, labels(n)[0] AS type, n.filePath AS filePath, n.startLine AS startLine, n.endLine AS endLine${include_content ? ', n.content AS content' : ''}
        LIMIT 10
      `, queryParams);
  }

  if (symbols.length === 0) {
    return { error: `Symbol '${name || uid}' not found` };
  }

  // Step 2: Disambiguation
  if (symbols.length > 1 && !uid) {
    return {
      status: 'ambiguous',
      message: `Found ${symbols.length} symbols matching '${name}'. Use uid or file_path to disambiguate.`,
      candidates: symbols.map((s: any) => ({
        uid: s.id || s[0],
        name: s.name || s[1],
        kind: s.type || s[2],
        filePath: s.filePath || s[3],
        line: s.startLine || s[4],
      })),
    };
  }

  // Step 3: Build full context
  const sym = symbols[0];
  const symId = sym.id || sym[0];

  // Categorized incoming refs
  const incomingRows = await executeParameterized(ctx.repo.id, `
      MATCH (caller)-[r:CodeRelation]->(n {id: $symId})
      WHERE r.type IN ['CALLS', 'IMPORTS', 'EXTENDS', 'IMPLEMENTS']
      RETURN r.type AS relType, caller.id AS uid, caller.name AS name, caller.filePath AS filePath, labels(caller)[0] AS kind
      LIMIT 30
    `, { symId });

  // Categorized outgoing refs
  const outgoingRows = await executeParameterized(ctx.repo.id, `
      MATCH (n {id: $symId})-[r:CodeRelation]->(target)
      WHERE r.type IN ['CALLS', 'IMPORTS', 'EXTENDS', 'IMPLEMENTS']
      RETURN r.type AS relType, target.id AS uid, target.name AS name, target.filePath AS filePath, labels(target)[0] AS kind
      LIMIT 30
    `, { symId });

  // Process participation
  let processRows: any[] = [];
  try {
    processRows = await executeParameterized(ctx.repo.id, `
        MATCH (n {id: $symId})-[r:CodeRelation {type: 'STEP_IN_PROCESS'}]->(p:Process)
        RETURN p.id AS pid, p.heuristicLabel AS label, r.step AS step, p.stepCount AS stepCount
      `, { symId });
  } catch (e) { ctx.logQueryError('context:process-participation', e); }

  // Helper to categorize refs
  const categorize = (rows: any[]) => {
    const cats: Record<string, any[]> = {};
    for (const row of rows) {
      const relType = (row.relType || row[0] || '').toLowerCase();
      const entry = {
        uid: row.uid || row[1],
        name: row.name || row[2],
        filePath: row.filePath || row[3],
        kind: row.kind || row[4],
      };
      if (!cats[relType]) cats[relType] = [];
      cats[relType].push(entry);
    }
    return cats;
  };

  return {
    status: 'found',
    symbol: {
      uid: sym.id || sym[0],
      name: sym.name || sym[1],
      kind: sym.type || sym[2],
      filePath: sym.filePath || sym[3],
      startLine: sym.startLine || sym[4],
      endLine: sym.endLine || sym[5],
      ...(include_content && (sym.content || sym[6]) ? { content: sym.content || sym[6] } : {}),
    },
    incoming: categorize(incomingRows),
    outgoing: categorize(outgoingRows),
    processes: processRows.map((r: any) => ({
      id: r.pid || r[0],
      name: r.label || r[1],
      step_index: r.step || r[2],
      step_count: r.stepCount || r[3],
    })),
  };
}
