import path from 'path';
import { executeParameterized } from '../../../core/kuzu-adapter.js';
import { getGitIdentity } from '../../../../storage/git.js';
import type { ToolContext } from '../tool-context.js';

export interface DetectChangesToolParams {
  scope?: string;
  base_ref?: string;
}

function resolveGitDiffPath(
  repoPath: string,
  processCwd: string,
): {
  gitDiffPath: string;
  pathResolution: 'cwd_worktree' | 'registry_repo';
  warnings: string[];
} {
  const warnings: string[] = [];
  const cwdIdentity = getGitIdentity(processCwd);
  const repoIdentity = getGitIdentity(repoPath);

  if (cwdIdentity && repoIdentity && cwdIdentity.commonDir === repoIdentity.commonDir) {
    return {
      gitDiffPath: cwdIdentity.topLevel,
      pathResolution: 'cwd_worktree',
      warnings,
    };
  }

  if (cwdIdentity && repoIdentity && cwdIdentity.commonDir !== repoIdentity.commonDir) {
    warnings.push(
      `Git operations fell back to '${repoPath}' because process cwd '${processCwd}' is inside a different git repository.`,
    );
  } else if (!cwdIdentity && isAbsolutePathDifferent(repoPath, processCwd)) {
    // Non-git cwd is a normal case; fall back silently.
  } else if (!repoIdentity) {
    warnings.push(
      `Git identity could not be resolved for indexed repo path '${repoPath}'. Falling back to registry repo path.`,
    );
  } else if (!cwdIdentity && repoIdentity && processCwd !== repoPath) {
    // No warning for non-git cwd fallback.
  }

  return {
    gitDiffPath: repoPath,
    pathResolution: 'registry_repo',
    warnings,
  };
}

function isAbsolutePathDifferent(left: string, right: string): boolean {
  return path.resolve(left) !== path.resolve(right);
}

/**
 * Detect changes — git-diff based impact analysis.
 * Maps changed lines to indexed symbols, then finds affected processes.
 */
export async function runDetectChangesTool(ctx: ToolContext, params: DetectChangesToolParams): Promise<any> {
  await ctx.runtime.ensureInitialized(ctx.repo.id);

  const scope = params.scope || 'unstaged';
  const gitRepoPath = ctx.repo.repoPath;
  const processCwd = process.cwd();
  const pathResolution = resolveGitDiffPath(gitRepoPath, processCwd);
  const metadata: Record<string, any> = {
    git_repo_path: gitRepoPath,
    git_diff_path: pathResolution.gitDiffPath,
    process_cwd: processCwd,
    path_resolution: pathResolution.pathResolution,
    scope,
  };
  if (params.base_ref) {
    metadata.base_ref = params.base_ref;
  }
  const warnings = [...pathResolution.warnings];
  const { execFileSync } = await import('child_process');

  // Build git diff args based on scope (using execFileSync to avoid shell injection)
  let diffArgs: string[];
  switch (scope) {
    case 'staged':
      diffArgs = ['diff', '--staged', '--name-only'];
      break;
    case 'all':
      diffArgs = ['diff', 'HEAD', '--name-only'];
      break;
    case 'compare':
      if (!params.base_ref) return { error: 'base_ref is required for "compare" scope' };
      diffArgs = ['diff', params.base_ref, '--name-only'];
      break;
    case 'unstaged':
    default:
      diffArgs = ['diff', '--name-only'];
      break;
  }

  let changedFiles: string[];
  try {
    const output = execFileSync('git', diffArgs, { cwd: pathResolution.gitDiffPath, encoding: 'utf-8' });
    changedFiles = output.trim().split('\n').filter((f) => f.length > 0);
  } catch (err: any) {
    return { error: `Git diff failed: ${err.message}`, metadata, ...(warnings.length > 0 ? { warnings } : {}) };
  }

  if (changedFiles.length === 0) {
    return {
      summary: { changed_count: 0, affected_count: 0, risk_level: 'none', message: 'No changes detected.' },
      metadata,
      ...(warnings.length > 0 ? { warnings } : {}),
      changed_symbols: [],
      affected_processes: [],
    };
  }

  // Map changed files to indexed symbols
  const changedSymbols: any[] = [];
  for (const file of changedFiles) {
    const normalizedFile = file.replace(/\\/g, '/').replace(/^\.\//, '');
    const absoluteFile = path.resolve(pathResolution.gitDiffPath, normalizedFile).replace(/\\/g, '/');
    const exactCandidates = Array.from(new Set([normalizedFile, absoluteFile]));
    try {
      let symbols = await executeParameterized(ctx.repo.id, `
          MATCH (n)
          WHERE n.filePath = $relativePath OR n.filePath = $absolutePath
          RETURN n.id AS id, n.name AS name, labels(n)[0] AS type, n.filePath AS filePath
          LIMIT 20
        `, { relativePath: normalizedFile, absolutePath: absoluteFile });

      // Fallback for indexes that persist absolute paths with varying repo roots.
      if (symbols.length === 0) {
        symbols = await executeParameterized(ctx.repo.id, `
            MATCH (n)
            WHERE n.filePath ENDS WITH $relativePath
            RETURN n.id AS id, n.name AS name, labels(n)[0] AS type, n.filePath AS filePath
            LIMIT 20
          `, { relativePath: normalizedFile });
      }

      for (const sym of symbols) {
        const symbolPath = String(sym.filePath || sym[3] || '').replace(/\\/g, '/').replace(/^\.\//, '');
        const absoluteSymbolPath = path.resolve(pathResolution.gitDiffPath, symbolPath).replace(/\\/g, '/');
        const suffixMatch = symbolPath === normalizedFile || symbolPath.endsWith(`/${normalizedFile}`);
        if (!exactCandidates.includes(symbolPath) && !exactCandidates.includes(absoluteSymbolPath) && !suffixMatch) continue;
        changedSymbols.push({
          id: sym.id || sym[0],
          name: sym.name || sym[1],
          type: sym.type || sym[2],
          filePath: sym.filePath || sym[3],
          change_type: 'Modified',
        });
      }
    } catch (e) { ctx.logQueryError('detect-changes:file-symbols', e); }
  }

  // Find affected processes
  const affectedProcesses = new Map<string, any>();
  for (const sym of changedSymbols) {
    try {
      const procs = await executeParameterized(ctx.repo.id, `
          MATCH (n {id: $nodeId})-[r:CodeRelation {type: 'STEP_IN_PROCESS'}]->(p:Process)
          RETURN p.id AS pid, p.heuristicLabel AS label, p.processType AS processType, p.stepCount AS stepCount, r.step AS step
        `, { nodeId: sym.id });
      for (const proc of procs) {
        const pid = proc.pid || proc[0];
        if (!affectedProcesses.has(pid)) {
          affectedProcesses.set(pid, {
            id: pid,
            name: proc.label || proc[1],
            process_type: proc.processType || proc[2],
            step_count: proc.stepCount || proc[3],
            changed_steps: [],
          });
        }
        affectedProcesses.get(pid)!.changed_steps.push({
          symbol: sym.name,
          step: proc.step || proc[4],
        });
      }
    } catch (e) { ctx.logQueryError('detect-changes:process-lookup', e); }
  }

  const processCount = affectedProcesses.size;
  const risk = processCount === 0 ? 'low' : processCount <= 5 ? 'medium' : processCount <= 15 ? 'high' : 'critical';

  return {
    summary: {
      changed_count: changedSymbols.length,
      affected_count: processCount,
      changed_files: changedFiles.length,
      risk_level: risk,
    },
    metadata,
    ...(warnings.length > 0 ? { warnings } : {}),
    changed_symbols: changedSymbols,
    affected_processes: Array.from(affectedProcesses.values()),
  };
}
