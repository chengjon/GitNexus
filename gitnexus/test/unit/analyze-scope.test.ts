import { describe, expect, it } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import {
  resolveAnalyzeScopeOptions,
} from '../../src/cli/analyze.js';
import {
  listGitNexusMcpPidsHoldingPath,
  quiesceGitNexusMcpHolders,
} from '../../src/cli/platform-process-scan.js';

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

    expect(source).toContain('--with-context');
    expect(source).toContain('--no-context');
    expect(source).toContain('--no-gitignore');
    expect(source).toContain('--no-register');
  });
});

describe('resolveAnalyzeScopeOptions', () => {
  it('keeps repo-context refresh disabled by default', () => {
    expect(resolveAnalyzeScopeOptions({})).toEqual({
      registerRepo: true,
      updateGitignore: true,
      refreshContext: false,
    });
  });

  it('enables context refresh only when explicitly opted in', () => {
    expect(resolveAnalyzeScopeOptions({
      withContext: true,
    } as any)).toEqual({
      registerRepo: true,
      updateGitignore: true,
      refreshContext: true,
    });
  });

  it('still supports legacy no-context opt-out shape', () => {
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

  it('supports commander no-* option output for compatibility', () => {
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

  it('prefers explicit with-context over compatibility defaults', () => {
    expect(resolveAnalyzeScopeOptions({
      withContext: true,
      context: true,
    } as any)).toEqual({
      registerRepo: true,
      updateGitignore: true,
      refreshContext: true,
    });
  });
});

describe('analyze MCP lock-holder helpers', () => {
  it('finds only gitnexus mcp processes holding the target kuzu file', async () => {
    const procRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'gitnexus-proc-'));
    const targetPath = '/tmp/example/.gitnexus/kuzu';

    const makeProc = async (pid: string, cmdline: string[], fdTargets: Record<string, string>) => {
      const pidDir = path.join(procRoot, pid);
      const fdDir = path.join(pidDir, 'fd');
      await fs.mkdir(fdDir, { recursive: true });
      await fs.writeFile(path.join(pidDir, 'cmdline'), `${cmdline.join('\0')}\0`, 'utf8');
      for (const [fd, linkTarget] of Object.entries(fdTargets)) {
        await fs.symlink(linkTarget, path.join(fdDir, fd));
      }
    };

    try {
      await makeProc('101', ['node', '/usr/bin/gitnexus', 'mcp'], { '17': targetPath });
      await makeProc('202', ['node', '/usr/bin/gitnexus', 'status'], { '11': targetPath });
      await makeProc('303', ['node', '/app/server.js'], { '9': targetPath });
      await makeProc('404', ['node', '/usr/bin/gitnexus', 'mcp'], { '5': `${targetPath}.wal` });

      await expect(listGitNexusMcpPidsHoldingPath(targetPath, { procRoot })).resolves.toEqual(['101']);
    } finally {
      await fs.rm(procRoot, { recursive: true, force: true });
    }
  });

  it('terminates matching MCP holders and waits until they disappear', async () => {
    const scans = [[ '101', '202' ], []] as string[][];
    const killed: number[] = [];

    const result = await quiesceGitNexusMcpHolders('/tmp/example/.gitnexus/kuzu', {
      findHolders: async () => scans.shift() ?? [],
      terminatePid: async (pid) => { killed.push(pid); },
      sleep: async () => {},
      timeoutMs: 50,
      pollIntervalMs: 1,
    });

    expect(killed).toEqual([101, 202]);
    expect(result).toEqual({
      terminatedPids: [101, 202],
      waitTimedOut: false,
    });
  });

  it('falls back to lsof on non-linux platforms and keeps only gitnexus mcp holders', async () => {
    const lsofOutput = [
      'p101',
      'n/tmp/example/.gitnexus/kuzu',
      'p202',
      'n/tmp/example/.gitnexus/kuzu',
      'p303',
      'n/tmp/example/.gitnexus/kuzu',
    ].join('\n');

    const pidArgv = new Map<string, string[]>([
      ['101', ['node', '/usr/bin/gitnexus', 'mcp']],
      ['202', ['node', '/usr/bin/gitnexus', 'status']],
      ['303', ['node', '/app/server.js']],
    ]);

    await expect(listGitNexusMcpPidsHoldingPath('/tmp/example/.gitnexus/kuzu', {
      platform: 'darwin',
      runLsof: async () => lsofOutput,
      readPidArgv: async (pid) => pidArgv.get(pid) ?? [],
    })).resolves.toEqual(['101']);
  });

  it('is a no-op when no MCP holders exist', async () => {
    const result = await quiesceGitNexusMcpHolders('/tmp/example/.gitnexus/kuzu', {
      findHolders: async () => [],
      terminatePid: async () => {
        throw new Error('should not terminate any pid');
      },
      sleep: async () => {},
      timeoutMs: 10,
      pollIntervalMs: 1,
    });

    expect(result).toEqual({
      terminatedPids: [],
      waitTimedOut: false,
    });
  });
});
