import path from 'path';
import { generateAIContextFiles, type AIContextOptions } from './ai-context.js';
import { getGitRoot } from '../storage/git.js';
import { getStoragePaths, loadMeta, type RepoMeta } from '../storage/repo-manager.js';

type ContextStats = {
  files?: number;
  nodes?: number;
  edges?: number;
  communities?: number;
  processes?: number;
};

function resolveRepoPath(inputPath?: string): string | null {
  const fromPath = inputPath ? path.resolve(inputPath) : process.cwd();
  return getGitRoot(fromPath);
}

function toContextStats(metaStats?: RepoMeta['stats']): ContextStats {
  return {
    files: metaStats?.files,
    nodes: metaStats?.nodes,
    edges: metaStats?.edges,
    communities: metaStats?.communities,
    processes: metaStats?.processes,
  };
}

export const refreshContextCommand = async (inputPath?: string, options: AIContextOptions = {}) => {
  console.log('\n  GitNexus Context Refresh\n');

  const repoPath = resolveRepoPath(inputPath);
  if (!repoPath) {
    console.log('  Not inside a git repository\n');
    process.exitCode = 1;
    return;
  }

  const { storagePath } = getStoragePaths(repoPath);
  const meta = await loadMeta(storagePath);
  const projectName = path.basename(repoPath);
  const context = await generateAIContextFiles(
    repoPath,
    storagePath,
    projectName,
    toContextStats(meta?.stats),
    undefined,
    options,
  );

  console.log(`  Refreshed project context for ${repoPath}`);
  if (context.files.length > 0) {
    console.log(`  Context: ${context.files.join(', ')}`);
  }
  console.log('');
};
