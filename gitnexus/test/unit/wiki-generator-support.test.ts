import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModuleTreeNode } from '../../src/core/wiki/module-tree/types.js';

const mocks = vi.hoisted(() => ({
  readFile: vi.fn(async () => ''),
}));

vi.mock('fs/promises', () => ({
  __esModule: true,
  readFile: mocks.readFile,
  default: {
    readFile: mocks.readFile,
  },
}));

async function loadSupportModule(): Promise<{
  readProjectInfo: (repoPath: string) => Promise<string>;
  extractModuleFiles: (tree: ModuleTreeNode[]) => Record<string, string[]>;
}> {
  const mod = await import('../../src/core/wiki/generator-support.js');
  return {
    readProjectInfo: mod.readProjectInfo,
    extractModuleFiles: mod.extractModuleFiles,
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe('wiki generator support contracts', () => {
  it('reads package.json fields and README excerpt for project info', async () => {
    const { readProjectInfo } = await loadSupportModule();

    mocks.readFile.mockImplementation(async (filePath: string) => {
      if (filePath.endsWith('/package.json')) {
        return JSON.stringify({
          name: 'gitnexus',
          description: 'Graph-powered code intelligence',
          scripts: { build: 'tsc', test: 'vitest run' },
        });
      }
      if (filePath.endsWith('/README.md')) {
        return '# GitNexus\n\nREADME body';
      }
      throw new Error(`unexpected read: ${filePath}`);
    });

    const result = await readProjectInfo('/tmp/repo');

    expect(result.startsWith('Project: repo')).toBe(true);
    expect(result).toContain('Name: gitnexus');
    expect(result).toContain('Description: Graph-powered code intelligence');
    expect(result).toContain('Scripts: build, test');
    expect(result).toContain('README excerpt:\n# GitNexus');
  });

  it('falls back to the first non-package config excerpt when package.json is missing', async () => {
    const { readProjectInfo } = await loadSupportModule();

    mocks.readFile.mockImplementation(async (filePath: string) => {
      if (filePath.endsWith('/package.json')) {
        throw new Error('missing');
      }
      if (filePath.endsWith('/Cargo.toml')) {
        return '[package]\nname = "gitnexus"\n' + 'x'.repeat(700);
      }
      if (filePath.endsWith('/README.md')) {
        throw new Error('missing');
      }
      throw new Error(`unexpected read: ${filePath}`);
    });

    const result = await readProjectInfo('/tmp/repo');

    expect(result.startsWith('Project: repo')).toBe(true);
    expect(result).toContain('\nCargo.toml:\n[package]');
    expect(result).not.toContain('x'.repeat(600));
  });

  it('extracts module files for parent and leaf nodes', async () => {
    const { extractModuleFiles } = await loadSupportModule();
    const tree: ModuleTreeNode[] = [
      {
        name: 'Backend',
        slug: 'backend',
        files: [],
        children: [
          { name: 'Auth', slug: 'auth', files: ['src/auth/login.ts'] },
          { name: 'Users', slug: 'users', files: ['src/users/profile.ts'] },
        ],
      },
      {
        name: 'Core',
        slug: 'core',
        files: ['src/core/util.ts'],
      },
    ];

    expect(extractModuleFiles(tree)).toEqual({
      Backend: ['src/auth/login.ts', 'src/users/profile.ts'],
      Auth: ['src/auth/login.ts'],
      Users: ['src/users/profile.ts'],
      Core: ['src/core/util.ts'],
    });
  });
});
