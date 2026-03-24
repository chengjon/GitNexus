import { describe, it, expect, vi } from 'vitest';
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
vi.mock('../../src/cli/doctor.js', () => ({
  doctorCommand: vi.fn(),
}));
vi.mock('../../src/cli/init-project.js', () => ({
  initProjectCommand: vi.fn(),
}));
vi.mock('../../src/cli/refresh-context.js', () => ({
  refreshContextCommand: vi.fn(),
}));
vi.mock('../../src/cli/config.js', () => ({
  embeddingsConfigShowCommand: vi.fn(),
  embeddingsConfigSetCommand: vi.fn(),
  embeddingsConfigClearCommand: vi.fn(),
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
      expect(pkg.scripts['test:integration:native']).toBeDefined();
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

  describe('doctorCommand', () => {
    it('is a function', async () => {
      const { doctorCommand } = await import('../../src/cli/doctor.js');
      expect(typeof doctorCommand).toBe('function');
    });
  });

  describe('initProjectCommand', () => {
    it('is a function', async () => {
      const { initProjectCommand } = await import('../../src/cli/init-project.js');
      expect(typeof initProjectCommand).toBe('function');
    });
  });

  describe('refreshContextCommand', () => {
    it('is a function', async () => {
      const { refreshContextCommand } = await import('../../src/cli/refresh-context.js');
      expect(typeof refreshContextCommand).toBe('function');
    });
  });

  describe('host adapter factories', () => {
    it('exports codex adapter factory', async () => {
      const { createCodexAdapter } = await import('../../src/cli/host-adapters/codex.js');
      expect(typeof createCodexAdapter).toBe('function');
    });
  });

  describe('embeddings config commands', () => {
    it('exports embeddingsConfigShowCommand', async () => {
      const { embeddingsConfigShowCommand } = await import('../../src/cli/config.js');
      expect(typeof embeddingsConfigShowCommand).toBe('function');
    });

    it('exports embeddingsConfigSetCommand', async () => {
      const { embeddingsConfigSetCommand } = await import('../../src/cli/config.js');
      expect(typeof embeddingsConfigSetCommand).toBe('function');
    });

    it('exports embeddingsConfigClearCommand', async () => {
      const { embeddingsConfigClearCommand } = await import('../../src/cli/config.js');
      expect(typeof embeddingsConfigClearCommand).toBe('function');
    });
  });
});
