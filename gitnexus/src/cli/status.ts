/**
 * Status Command
 * 
 * Shows the indexing status of the current repository.
 */

import { findRepo } from '../storage/repo-manager.js';
import { getCurrentCommit, isGitRepo } from '../storage/git.js';
import { getIndexHealth } from '../mcp/staleness.js';

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
  const health = getIndexHealth(repo.repoPath, repo.meta.lastCommit);

  console.log(`Repository: ${repo.repoPath}`);
  console.log(`Indexed: ${new Date(repo.meta.indexedAt).toLocaleString()}`);
  console.log(`Indexed commit: ${repo.meta.lastCommit?.slice(0, 7)}`);
  console.log(`Current commit: ${currentCommit?.slice(0, 7)}`);
  console.log(`Health: ${health.level}`);
  if (health.reasons.length > 0) {
    console.log(`Reasons: ${health.reasons.join(', ')}`);
  }
  if (health.level !== 'fresh') {
    console.log('Run: gitnexus analyze');
  }
};
