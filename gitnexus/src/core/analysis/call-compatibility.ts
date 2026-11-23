import type {
  BrokenKeywordCall,
  CallCompatibilityCaller,
  CallCompatibilityFile,
  CallCompatibilityProvider,
  CallCompatibilityTarget,
} from '../ingestion/call-compatibility.js';
import { executeParameterized } from '../lbug/pool-adapter.js';
import { LBUG_ID_PROBE_BATCH_SIZE } from '../lbug/query-batch.js';
import { chunk, compareCodeUnits, mapConcurrent } from '../../lib/utils.js';

export interface CallCompatibilityReport {
  findings: BrokenKeywordCall[];
  complete: boolean;
  skipped: { filePath?: string; reason: string }[];
}

/**
 * Resolves caller rows for one compatibility check. Returns `null` when any
 * batch failed (the check then degrades to `caller-query-failed`), matching
 * the in-process `mapConcurrent` semantics — so a worker RPC can stand in for
 * the direct database call without changing observable behavior.
 */
export type CallCompatibilityCallerQuery = (
  ids: string[],
  relationTypes: readonly string[],
) => Promise<CallCompatibilityCaller[] | null>;

export async function queryCompatibilityCallers(
  graph: string,
  ids: string[],
  relationTypes: readonly string[],
  onError: (context: string, error: unknown) => void,
): Promise<CallCompatibilityCaller[] | null> {
  const batches = await mapConcurrent(
    chunk(ids, LBUG_ID_PROBE_BATCH_SIZE),
    (batchIds) =>
      executeParameterized(
        graph,
        `
              MATCH (caller)-[r:CodeRelation]->(target)
              WHERE target.id IN $ids AND r.type IN $relationTypes
              RETURN DISTINCT target.id AS target, caller.filePath AS filePath, r.type AS relationType
            `,
        { ids: batchIds, relationTypes },
      ),
    { onError: (error) => onError('detect-changes:callers', error) },
  );
  if (batches.includes(undefined)) return null;
  return batches.flatMap((rows) => rows ?? []);
}

export async function checkCallCompatibility(
  graph: string,
  image: {
    directory: string;
    scope: string;
    base?: string;
    files: readonly CallCompatibilityFile[];
  },
  groups: ReadonlyMap<CallCompatibilityProvider, CallCompatibilityTarget[]>,
  onError: (context: string, error: unknown) => void,
  callerSourceUnavailable?: string,
  queryCallers: CallCompatibilityCallerQuery = (ids, relationTypes) =>
    queryCompatibilityCallers(graph, ids, relationTypes, onError),
): Promise<CallCompatibilityReport> {
  const report: CallCompatibilityReport = { findings: [], complete: true, skipped: [] };
  const unavailable = new Error('Caller source unavailable');
  for (const [checker, targets] of groups) {
    try {
      const result = await checker.check(
        image.directory,
        image.scope,
        image.base,
        targets,
        async (targetIds) => {
          // A declaration-only comparison uses the selected diff images. Enforce
          // retention before a changed signature can trigger any caller reads.
          if (callerSourceUnavailable) throw unavailable;
          const rows = await queryCallers(targetIds, checker.relationTypes);
          if (rows === null) {
            report.complete = false;
            report.skipped.push({ reason: 'caller-query-failed' });
            return [];
          }
          return rows;
        },
        image.files,
        callerSourceUnavailable,
      );
      for (const call of result.findings) report.findings.push(call);
      for (const entry of result.skipped) report.skipped.push(entry);
      if (!result.complete) report.complete = false;
    } catch (error) {
      if (error === unavailable && callerSourceUnavailable) {
        report.complete = false;
        report.skipped.push({ reason: callerSourceUnavailable });
        continue;
      }
      onError('detect-changes:call-compatibility', error);
      report.complete = false;
      report.skipped.push({ reason: 'signature-check-failed' });
    }
  }
  if (groups.size > 1)
    report.findings.sort(
      (a, b) =>
        compareCodeUnits(a.filePath, b.filePath) ||
        a.line - b.line ||
        compareCodeUnits(a.target, b.target),
    );
  return report;
}
