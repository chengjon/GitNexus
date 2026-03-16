/**
 * Status Command
 * 
 * Shows the indexing status of the current repository.
 */

import { findRepo } from '../storage/repo-manager.js';
import { getCurrentCommit, isGitRepo } from '../storage/git.js';
import { getIndexFreshness, GITNEXUS_VERSION } from './index-freshness.js';

export const statusCommand = async () => {
  const cwd = process.cwd();
  
  if (!isGitRepo(cwd)) {
    console.log('Not a git repository.');
    return;
  }

  const repo = await findRepo(cwd);
  if (!repo) {
    console.log('Repository not indexed.');
    console.log('Run: gitnexus analyze');
    return;
  }

  const currentCommit = getCurrentCommit(repo.repoPath);
  const freshness = getIndexFreshness(repo.meta, currentCommit, GITNEXUS_VERSION);

  console.log(`Repository: ${repo.repoPath}`);
  console.log(`Indexed: ${new Date(repo.meta.indexedAt).toLocaleString()}`);
  console.log(`Indexed commit: ${repo.meta.lastCommit?.slice(0, 7)}`);
  console.log(`Current commit: ${currentCommit?.slice(0, 7)}`);
  console.log(`Indexed with GitNexus: ${repo.meta.toolVersion || 'unknown'}`);
  console.log(`Current GitNexus: ${GITNEXUS_VERSION}`);
  console.log(`Status: ${freshness.isUpToDate ? '✅ up-to-date' : '⚠️ stale (re-run gitnexus analyze)'}`);
};
