import { executeQuery } from '../../../core/kuzu-adapter.js';
import { aggregateClusters } from '../shared/cluster-aggregation.js';
import type { ToolContext } from '../tool-context.js';

export interface OverviewToolParams {
  showClusters?: boolean;
  showProcesses?: boolean;
  limit?: number;
}

export async function runOverviewTool(ctx: ToolContext, params: OverviewToolParams): Promise<any> {
  await ctx.runtime.ensureInitialized(ctx.repo.id);

  const limit = params.limit || 20;
  const result: any = {
    repo: ctx.repo.name,
    repoPath: ctx.repo.repoPath,
    stats: ctx.repo.stats,
    indexedAt: ctx.repo.indexedAt,
    lastCommit: ctx.repo.lastCommit,
  };

  if (params.showClusters !== false) {
    try {
      // Fetch more raw communities than the display limit so aggregation has enough data
      const rawLimit = Math.max(limit * 5, 200);
      const clusters = await executeQuery(ctx.repo.id, `
          MATCH (c:Community)
          RETURN c.id AS id, c.label AS label, c.heuristicLabel AS heuristicLabel, c.cohesion AS cohesion, c.symbolCount AS symbolCount
          ORDER BY c.symbolCount DESC
          LIMIT ${rawLimit}
        `);
      const rawClusters = clusters.map((c: any) => ({
        id: c.id || c[0],
        label: c.label || c[1],
        heuristicLabel: c.heuristicLabel || c[2],
        cohesion: c.cohesion || c[3],
        symbolCount: c.symbolCount || c[4],
      }));
      result.clusters = aggregateClusters(rawClusters).slice(0, limit);
    } catch {
      result.clusters = [];
    }
  }

  if (params.showProcesses !== false) {
    try {
      const processes = await executeQuery(ctx.repo.id, `
          MATCH (p:Process)
          RETURN p.id AS id, p.label AS label, p.heuristicLabel AS heuristicLabel, p.processType AS processType, p.stepCount AS stepCount
          ORDER BY p.stepCount DESC
          LIMIT ${limit}
        `);
      result.processes = processes.map((p: any) => ({
        id: p.id || p[0],
        label: p.label || p[1],
        heuristicLabel: p.heuristicLabel || p[2],
        processType: p.processType || p[3],
        stepCount: p.stepCount || p[4],
      }));
    } catch {
      result.processes = [];
    }
  }

  return result;
}
