/**
 * Status Command
 *
 * Shows the indexing status of the current repository.
 */

import { findRepo, getStoragePaths, hasKuzuIndex } from '../storage/repo-manager.js';
import { getCurrentCommit, isGitRepo, getGitRoot, getStagedFiles } from '../storage/git.js';
import { t } from './i18n/index.js';

interface StatusJsonOutput {
  repoPath: string;
  indexedAt: string;
  indexedCommit: string | null;
  currentCommit: string;
  upToDate: boolean;
  dirty: boolean;
  stagedFiles: number;
  freshForStagedDiff: boolean;
  stats?: Record<string, number>;
}

export const statusCommand = async (options?: { json?: boolean }) => {
  const jsonMode = (options as any)?.json === true;
  const cwd = process.cwd();

  if (!isGitRepo(cwd)) {
    if (jsonMode) {
      console.log(JSON.stringify({ error: 'not_a_git_repo', path: cwd }));
      return;
    }
    console.log(t('status.notGitRepo'));
    return;
  }

  const repo = await findRepo(cwd);
  if (!repo) {
    // Check if there's a stale KuzuDB index that needs migration
    const repoRoot = getGitRoot(cwd) ?? cwd;
    const { storagePath } = getStoragePaths(repoRoot);
    if (await hasKuzuIndex(storagePath)) {
      if (jsonMode) {
        console.log(JSON.stringify({ error: 'stale_kuzu_index', path: cwd }));
        return;
      }
      console.log(t('status.staleKuzu'));
      console.log(t('status.rebuildLadybug'));
    } else {
      if (jsonMode) {
        console.log(JSON.stringify({ error: 'not_indexed', path: cwd }));
        return;
      }
      console.log(t('status.repoNotIndexed'));
      console.log(t('common.runAnalyzeShort'));
    }
    return;
  }

  const currentCommit = getCurrentCommit(repo.repoPath);
  const isUpToDate = currentCommit === repo.meta.lastCommit;
  const stagedFiles = getStagedFiles(repo.repoPath);

  if (jsonMode) {
    const output: StatusJsonOutput = {
      repoPath: repo.repoPath,
      indexedAt: repo.meta.indexedAt,
      indexedCommit: repo.meta.lastCommit ?? null,
      currentCommit,
      upToDate: isUpToDate,
      dirty: !isUpToDate,
      stagedFiles: stagedFiles.length,
      freshForStagedDiff: isUpToDate || stagedFiles.length === 0,
      ...(repo.meta.stats && { stats: repo.meta.stats }),
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  console.log(`${t('status.repository')}: ${repo.repoPath}`);
  console.log(`${t('status.indexed')}: ${new Date(repo.meta.indexedAt).toLocaleString()}`);
  console.log(`${t('status.indexedCommit')}: ${repo.meta.lastCommit?.slice(0, 7)}`);
  console.log(`${t('status.currentCommit')}: ${currentCommit?.slice(0, 7)}`);
  console.log(`${t('status.status')}: ${isUpToDate ? t('status.upToDate') : t('status.stale')}`);
};
