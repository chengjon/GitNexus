import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getGitNexusVersion } from '../../src/cli/index-freshness.js';

// Mock all the heavy imports before importing index
vi.mock('../../src/cli/analyze.js', () => ({
  analyzeCommand: vi.fn(),
}));
vi.mock('../../src/cli/mcp.js', () => ({
  mcpCommand: vi.fn(),
}));
vi.mock('../../src/cli/setup.js', () => ({
  setupCommand: vi.fn(),
}));

const testDir = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(testDir, '..', '..', 'package.json');

async function readPackageJson() {
  const raw = await fs.readFile(packageJsonPath, 'utf-8');
  return JSON.parse(raw) as {
    version: string;
    scripts: Record<string, string>;
    bin: Record<string, string> | string;
  };
}

describe('CLI commands', () => {
  describe('version', () => {
    it('gitnexus exposes a valid version string', () => {
      expect(getGitNexusVersion()).toMatch(/^\d+\.\d+\.\d+/);
    });
  });

  describe('package.json scripts', () => {
    it('has test scripts configured', async () => {
      const pkg = await readPackageJson();
      expect(pkg.scripts.test).toBeDefined();
      expect(pkg.scripts['test:integration']).toBeDefined();
      expect(pkg.scripts['test:all']).toBeDefined();
    });

    it('has build script', async () => {
      const pkg = await readPackageJson();
      expect(pkg.scripts.build).toBeDefined();
    });
  });

  describe('package.json bin entry', () => {
    it('exposes gitnexus binary', async () => {
      const pkg = await readPackageJson();
      expect(pkg.bin).toBeDefined();
      expect((pkg.bin as Record<string, string>).gitnexus || pkg.bin).toBeDefined();
    });
  });

  describe('analyzeCommand', () => {
    it('is a function', async () => {
      const { analyzeCommand } = await import('../../src/cli/analyze.js');
      expect(typeof analyzeCommand).toBe('function');
    });
  });

  describe('mcpCommand', () => {
    it('is a function', async () => {
      const { mcpCommand } = await import('../../src/cli/mcp.js');
      expect(typeof mcpCommand).toBe('function');
    });
  });

  describe('setupCommand', () => {
    it('is a function', async () => {
      const { setupCommand } = await import('../../src/cli/setup.js');
      expect(typeof setupCommand).toBe('function');
    });
  });
});
