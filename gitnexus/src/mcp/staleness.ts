/**
 * Staleness Check
 * 
 * Checks if the GitNexus index is behind the current git HEAD.
 * Returns a hint for the LLM to call analyze if stale.
 */

import { execFileSync } from 'child_process';

export type IndexHealthLevel = 'fresh' | 'warning' | 'degraded' | 'invalid';
export type IndexHealthReason = 'commit-behind' | 'dirty-worktree' | 'git-error';

export interface IndexHealth {
  level: IndexHealthLevel;
  reasons: IndexHealthReason[];
  commitsBehind: number;
  dirty: boolean;
}

export interface StalenessInfo {
  isStale: boolean;
  commitsBehind: number;
  hint?: string;
}

function normalizePorcelainPath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const arrowIndex = trimmed.indexOf(' -> ');
  return arrowIndex >= 0 ? trimmed.slice(arrowIndex + 4).trim() : trimmed;
}

function isGitNexusInternalPath(value: string): boolean {
  const normalized = normalizePorcelainPath(value);
  return normalized === '.gitnexus' || normalized.startsWith('.gitnexus/');
}

function hasMeaningfulDirtyEntries(porcelain: string): boolean {
  return porcelain
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .some((line) => {
      const pathPart = line.length > 3 ? line.slice(3) : '';
      return !isGitNexusInternalPath(pathPart);
    });
}

export function getIndexHealth(repoPath: string, lastCommit: string): IndexHealth {
  try {
    const commitsBehindRaw = execFileSync(
      'git', ['rev-list', '--count', `${lastCommit}..HEAD`],
      { cwd: repoPath, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
    ).trim();
    const dirtyRaw = execFileSync(
      'git', ['status', '--porcelain'],
      { cwd: repoPath, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
    ).trim();

    const commitsBehind = parseInt(commitsBehindRaw, 10) || 0;
    const dirty = hasMeaningfulDirtyEntries(dirtyRaw);
    const reasons: IndexHealthReason[] = [];

    if (commitsBehind > 0) reasons.push('commit-behind');
    if (dirty) reasons.push('dirty-worktree');

    let level: IndexHealthLevel = 'fresh';
    if (dirty) {
      level = 'degraded';
    } else if (commitsBehind > 0) {
      level = 'warning';
    }

    return {
      level,
      reasons,
      commitsBehind,
      dirty,
    };
  } catch {
    return {
      level: 'invalid',
      reasons: ['git-error'],
      commitsBehind: 0,
      dirty: false,
    };
  }
}

/**
 * Check how many commits the index is behind HEAD
 */
export function checkStaleness(repoPath: string, lastCommit: string): StalenessInfo {
  const health = getIndexHealth(repoPath, lastCommit);

  if (health.level === 'invalid' || health.commitsBehind === 0) {
    return { isStale: false, commitsBehind: 0 };
  }

  return {
    isStale: true,
    commitsBehind: health.commitsBehind,
    hint: `⚠️ Index is ${health.commitsBehind} commit${health.commitsBehind > 1 ? 's' : ''} behind HEAD. Run analyze tool to update.`,
  };
}
