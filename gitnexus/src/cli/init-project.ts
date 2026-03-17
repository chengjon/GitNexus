import path from 'path';
import { addToGitignore } from '../storage/repo-manager.js';
import { getGitRoot } from '../storage/git.js';
import { refreshAIContextFiles } from './ai-context.js';

function resolveRepoPath(inputPath?: string): string | null {
  const fromPath = inputPath ? path.resolve(inputPath) : process.cwd();
  return getGitRoot(fromPath);
}

export const initProjectCommand = async (inputPath?: string) => {
  console.log('\n  GitNexus Project Init\n');

  const repoPath = resolveRepoPath(inputPath);
  if (!repoPath) {
    console.log('  Not inside a git repository\n');
    process.exitCode = 1;
    return;
  }

  await addToGitignore(repoPath);
  const context = await refreshAIContextFiles(repoPath);

  console.log(`  Initialized project context for ${repoPath}`);
  console.log('  Updated: .gitignore');
  if (context.files.length > 0) {
    console.log(`  Context: ${context.files.join(', ')}`);
  }
  console.log('');
};
