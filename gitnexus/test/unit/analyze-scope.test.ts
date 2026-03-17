import { describe, expect, it } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveAnalyzeScopeOptions } from '../../src/cli/analyze.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

describe('analyze CLI scope', () => {
  it('registers init-project and refresh-context commands', async () => {
    const indexPath = path.join(repoRoot, 'src', 'cli', 'index.ts');
    const source = await fs.readFile(indexPath, 'utf-8');

    expect(source).toContain("command('init-project");
    expect(source).toContain("command('refresh-context");
  });

  it('declares analyze scope flags', async () => {
    const indexPath = path.join(repoRoot, 'src', 'cli', 'index.ts');
    const source = await fs.readFile(indexPath, 'utf-8');

    expect(source).toContain('--no-context');
    expect(source).toContain('--no-gitignore');
    expect(source).toContain('--no-register');
  });
});

describe('resolveAnalyzeScopeOptions', () => {
  it('keeps legacy side effects enabled by default', () => {
    expect(resolveAnalyzeScopeOptions({})).toEqual({
      registerRepo: true,
      updateGitignore: true,
      refreshContext: true,
    });
  });

  it('disables individual side effects when explicitly opted out', () => {
    expect(resolveAnalyzeScopeOptions({
      noContext: true,
      noGitignore: true,
      noRegister: true,
    })).toEqual({
      registerRepo: false,
      updateGitignore: false,
      refreshContext: false,
    });
  });

  it('supports commander no-* option output', () => {
    expect(resolveAnalyzeScopeOptions({
      context: false,
      gitignore: false,
      register: false,
    })).toEqual({
      registerRepo: false,
      updateGitignore: false,
      refreshContext: false,
    });
  });
});
