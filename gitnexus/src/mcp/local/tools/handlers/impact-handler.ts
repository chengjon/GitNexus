import path from 'path';
import { executeParameterized, executeQuery } from '../../../core/kuzu-adapter.js';
import {
  isTestFilePath,
  VALID_RELATION_TYPES,
} from '../shared/query-safety.js';
import type { ToolContext } from '../tool-context.js';

export interface ImpactToolParams {
  target: string;
  direction: 'upstream' | 'downstream';
  maxDepth?: number;
  relationTypes?: string[];
  includeTests?: boolean;
  minConfidence?: number;
}

export async function runImpactTool(ctx: ToolContext, params: ImpactToolParams): Promise<any> {
  await ctx.runtime.ensureInitialized(ctx.repo.id);

  const { target, direction } = params;
  const maxDepth = params.maxDepth || 3;
  const rawRelTypes = params.relationTypes && params.relationTypes.length > 0
    ? params.relationTypes.filter((t) => VALID_RELATION_TYPES.has(t))
    : ['CALLS', 'IMPORTS', 'EXTENDS', 'IMPLEMENTS'];
  const relationTypes = rawRelTypes.length > 0 ? rawRelTypes : ['CALLS', 'IMPORTS', 'EXTENDS', 'IMPLEMENTS'];
  const includeTests = params.includeTests ?? false;
  const normalizedMinConfidence = (() => {
    if (typeof params.minConfidence === 'number') {
      return Number.isFinite(params.minConfidence) ? params.minConfidence : 0;
    }
    if (typeof params.minConfidence === 'string') {
      const parsed = Number(params.minConfidence);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  })();
  const minConfidence = normalizedMinConfidence > 0 ? normalizedMinConfidence : 0;

  const relTypeFilter = relationTypes.map((t) => `'${t}'`).join(', ');
  const confidenceFilter = minConfidence > 0 ? ` AND r.confidence >= ${minConfidence}` : '';

  let targets = await executeParameterized(ctx.repo.id, `
      MATCH (n)
      WHERE n.name = $targetName
      RETURN n.id AS id, n.name AS name, labels(n)[0] AS type, n.filePath AS filePath
      LIMIT 1
    `, { targetName: target });

  if (targets.length === 0 && /[\\/]/.test(target)) {
    let targetPath = target.replace(/\\/g, '/');
    if (path.isAbsolute(target)) {
      targetPath = path.relative(ctx.repo.repoPath, target).replace(/\\/g, '/');
    }

    targets = await executeParameterized(ctx.repo.id, `
        MATCH (n:File)
        WHERE n.filePath = $targetPath
        RETURN n.id AS id, n.name AS name, labels(n)[0] AS type, n.filePath AS filePath
        LIMIT 1
      `, { targetPath });
  }

  if (targets.length === 0) return { error: `Target '${target}' not found` };

  const sym = targets[0];
  const symId = sym.id || sym[0];

  const impacted: any[] = [];
  const visited = new Set<string>([symId]);
  let frontier = [symId];

  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth++) {
    const nextFrontier: string[] = [];

    // Batch frontier nodes into a single Cypher query per depth level
    const idList = frontier.map((id) => `'${id.replace(/'/g, "''")}'`).join(', ');
    const query = direction === 'upstream'
      ? `MATCH (caller)-[r:CodeRelation]->(n) WHERE n.id IN [${idList}] AND r.type IN [${relTypeFilter}]${confidenceFilter} RETURN n.id AS sourceId, caller.id AS id, caller.name AS name, labels(caller)[0] AS type, caller.filePath AS filePath, r.type AS relType, r.confidence AS confidence`
      : `MATCH (n)-[r:CodeRelation]->(callee) WHERE n.id IN [${idList}] AND r.type IN [${relTypeFilter}]${confidenceFilter} RETURN n.id AS sourceId, callee.id AS id, callee.name AS name, labels(callee)[0] AS type, callee.filePath AS filePath, r.type AS relType, r.confidence AS confidence`;

    try {
      const related = await executeQuery(ctx.repo.id, query);

      for (const rel of related) {
        const relId = rel.id || rel[1];
        const filePath = rel.filePath || rel[4] || '';

        if (!includeTests && isTestFilePath(filePath)) continue;

        if (!visited.has(relId)) {
          visited.add(relId);
          nextFrontier.push(relId);
          impacted.push({
            depth,
            id: relId,
            name: rel.name || rel[2],
            type: rel.type || rel[3],
            filePath,
            relationType: rel.relType || rel[5],
            confidence: rel.confidence ?? rel[6] ?? 1.0,
          });
        }
      }
    } catch (e) { ctx.logQueryError('impact:depth-traversal', e); }

    frontier = nextFrontier;
  }

  const grouped: Record<number, any[]> = {};
  for (const item of impacted) {
    if (!grouped[item.depth]) grouped[item.depth] = [];
    grouped[item.depth].push(item);
  }

  // ── Enrichment: affected processes, modules, risk ──────────────
  const directCount = (grouped[1] || []).length;
  let affectedProcesses: any[] = [];
  let affectedModules: any[] = [];

  if (impacted.length > 0) {
    const allIds = impacted.map((i) => `'${i.id.replace(/'/g, "''")}'`).join(', ');
    const d1Ids = (grouped[1] || []).map((i: any) => `'${i.id.replace(/'/g, "''")}'`).join(', ');

    // Affected processes: which execution flows are broken and at which step
    const [processRows, moduleRows, directModuleRows] = await Promise.all([
      executeQuery(ctx.repo.id, `
          MATCH (s)-[r:CodeRelation {type: 'STEP_IN_PROCESS'}]->(p:Process)
          WHERE s.id IN [${allIds}]
          RETURN p.heuristicLabel AS name, COUNT(DISTINCT s.id) AS hits, MIN(r.step) AS minStep, p.stepCount AS stepCount
          ORDER BY hits DESC
          LIMIT 20
        `).catch(() => []),
      executeQuery(ctx.repo.id, `
          MATCH (s)-[:CodeRelation {type: 'MEMBER_OF'}]->(c:Community)
          WHERE s.id IN [${allIds}]
          RETURN c.heuristicLabel AS name, COUNT(DISTINCT s.id) AS hits
          ORDER BY hits DESC
          LIMIT 20
        `).catch(() => []),
      d1Ids ? executeQuery(ctx.repo.id, `
          MATCH (s)-[:CodeRelation {type: 'MEMBER_OF'}]->(c:Community)
          WHERE s.id IN [${d1Ids}]
          RETURN DISTINCT c.heuristicLabel AS name
        `).catch(() => []) : Promise.resolve([]),
    ]);

    affectedProcesses = processRows.map((r: any) => ({
      name: r.name || r[0],
      hits: r.hits || r[1],
      broken_at_step: r.minStep ?? r[2],
      step_count: r.stepCount ?? r[3],
    }));

    const directModuleSet = new Set(directModuleRows.map((r: any) => r.name || r[0]));
    affectedModules = moduleRows.map((r: any) => {
      const name = r.name || r[0];
      return {
        name,
        hits: r.hits || r[1],
        impact: directModuleSet.has(name) ? 'direct' : 'indirect',
      };
    });
  }

  // Risk scoring
  const processCount = affectedProcesses.length;
  const moduleCount = affectedModules.length;
  let risk = 'LOW';
  if (directCount >= 30 || processCount >= 5 || moduleCount >= 5 || impacted.length >= 200) {
    risk = 'CRITICAL';
  } else if (directCount >= 15 || processCount >= 3 || moduleCount >= 3 || impacted.length >= 100) {
    risk = 'HIGH';
  } else if (directCount >= 5 || impacted.length >= 30) {
    risk = 'MEDIUM';
  }

  return {
    target: {
      id: symId,
      name: sym.name || sym[1],
      type: sym.type || sym[2],
      filePath: sym.filePath || sym[3],
    },
    direction,
    impactedCount: impacted.length,
    risk,
    summary: {
      direct: directCount,
      processes_affected: processCount,
      modules_affected: moduleCount,
    },
    affected_processes: affectedProcesses,
    affected_modules: affectedModules,
    byDepth: grouped,
  };
}
