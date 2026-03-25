import { execSync } from 'child_process';
import path from 'path';

// Git utilities for repository detection, commit tracking, and diff analysis

export const isGitRepo = (repoPath: string): boolean => {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd: repoPath, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

export const getCurrentCommit = (repoPath: string): string => {
  try {
    return execSync('git rev-parse HEAD', { cwd: repoPath }).toString().trim();
  } catch {
    return '';
  }
};

/**
 * Find the git repository root from any path inside the repo
 */
export const getGitRoot = (fromPath: string): string | null => {
  try {
    const raw = execSync('git rev-parse --show-toplevel', { cwd: fromPath })
      .toString()
      .trim();
    // On Windows, git returns /d/Projects/Foo — path.resolve normalizes to D:\Projects\Foo
    return path.resolve(raw);
  } catch {
    return null;
  }
};

/**
 * Resolve the git common dir for a path inside a git repository.
 * This is the shared git storage root used by the main checkout and linked worktrees.
 */
export const getGitCommonDir = (fromPath: string): string | null => {
  try {
    const raw = execSync('git rev-parse --git-common-dir', { cwd: fromPath })
      .toString()
      .trim();
    return path.resolve(fromPath, raw);
  } catch {
    return null;
  }
};

/**
 * Resolve both the visible worktree root and the underlying shared git common dir.
 * Returns null if either value cannot be resolved.
 */
export const getGitIdentity = (fromPath: string): { topLevel: string; commonDir: string } | null => {
  const topLevel = getGitRoot(fromPath);
  const commonDir = getGitCommonDir(fromPath);
  if (!topLevel || !commonDir) return null;
  return { topLevel, commonDir };
};
