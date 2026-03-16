import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RepoMeta } from '../storage/repo-manager.js';

let cachedVersion: string | null = null;
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(currentDir, '..', '..', 'package.json');

export const getGitNexusVersion = (): string => {
  if (cachedVersion) return cachedVersion;

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as { version?: string };
  cachedVersion = pkg.version || 'unknown';
  return cachedVersion;
};

export interface IndexFreshness {
  commitMatches: boolean;
  toolVersionMatches: boolean;
  isUpToDate: boolean;
}

export const getIndexFreshness = (
  meta: RepoMeta | null | undefined,
  currentCommit: string,
  currentToolVersion = getGitNexusVersion(),
): IndexFreshness => {
  const commitMatches = !!meta && meta.lastCommit === currentCommit;
  const toolVersionMatches = !!meta && meta.toolVersion === currentToolVersion;

  return {
    commitMatches,
    toolVersionMatches,
    isUpToDate: commitMatches && toolVersionMatches,
  };
};
