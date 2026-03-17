import path from 'path';
import { getGitRoot } from '../storage/git.js';
import { refreshAIContextFiles } from './ai-context.js';

function resolveRepoPath(inputPath?: string): string | null {
  const fromPath = inputPath ? path.resolve(inputPath) : process.cwd();
  return getGitRoot(fromPath);
}

export const refreshContextCommand = async (inputPath?: string) => {
  console.log('\n  GitNexus Context Refresh\n');

  const repoPath = resolveRepoPath(inputPath);
  if (!repoPath) {
    console.log('  Not inside a git repository\n');
    process.exitCode = 1;
    return;
  }

  const context = await refreshAIContextFiles(repoPath);
  console.log(`  Refreshed project context for ${repoPath}`);
  if (context.files.length > 0) {
    console.log(`  Context: ${context.files.join(', ')}`);
  }
  console.log('');
};
