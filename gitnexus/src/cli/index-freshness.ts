import { createRequire } from 'node:module';
import type { RepoMeta } from '../storage/repo-manager.js';

const require = createRequire(import.meta.url);
export const GITNEXUS_VERSION: string = require('../../package.json').version;

export interface IndexFreshness {
  commitMatches: boolean;
  toolVersionMatches: boolean;
  isUpToDate: boolean;
}

export const getIndexFreshness = (
  meta: RepoMeta | null | undefined,
  currentCommit: string,
  currentToolVersion = GITNEXUS_VERSION,
): IndexFreshness => {
  const commitMatches = !!meta && meta.lastCommit === currentCommit;
  const toolVersionMatches = !!meta && meta.toolVersion === currentToolVersion;

  return {
    commitMatches,
    toolVersionMatches,
    isUpToDate: commitMatches && toolVersionMatches,
  };
};
