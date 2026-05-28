import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshContextCommand } from '../../src/cli/refresh-context.js';

describe('refreshContextCommand', () => {
  let tmpDir: string;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gn-refresh-context-'));
    execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
    await fs.mkdir(path.join(tmpDir, '.gitnexus'), { recursive: true });
    await fs.writeFile(
      path.join(tmpDir, '.gitnexus', 'meta.json'),
      JSON.stringify({
        repoPath: tmpDir,
        lastCommit: '',
        indexedAt: new Date(0).toISOString(),
        stats: {
          files: 7,
          nodes: 12,
          edges: 34,
          processes: 5,
        },
      }),
      'utf-8',
    );
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    process.exitCode = undefined;
  });

  afterEach(async () => {
    logSpy.mockRestore();
    process.exitCode = undefined;
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('refreshes AI context files from existing index metadata without reindexing', async () => {
    await refreshContextCommand(tmpDir, { skipSkills: true });

    for (const fileName of ['AGENTS.md', 'CLAUDE.md']) {
      const content = await fs.readFile(path.join(tmpDir, fileName), 'utf-8');
      expect(content).toContain('gitnexus:start');
      expect(content).toContain('gitnexus:end');
      expect(content).toContain(path.basename(tmpDir));
      expect(content).toMatch(/\(12\s+symbols,\s+34\s+relationships,\s+5\s+execution flows\)/);
    }

    await expect(fs.access(path.join(tmpDir, '.claude', 'skills', 'gitnexus'))).rejects.toThrow();
    expect(logSpy).toHaveBeenCalledWith(`  Refreshed project context for ${tmpDir}`);
  });
});
