import { describe, expect, it } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import {
  resolveAnalyzeScopeOptions,
} from '../../src/cli/analyze.js';
import {
  describeGitNexusMcpHolderPids,
  drainGitNexusMcpRepoWorkers,
  formatGitNexusMcpHolderDetails,
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
      updateGitignore: false,
      refreshContext: false,
    });
  });

  it('enables context refresh only when explicitly opted in', () => {
    expect(resolveAnalyzeScopeOptions({
      withContext: true,
    } as any)).toEqual({
      registerRepo: true,
      updateGitignore: false,
      refreshContext: true,
    });
  });

  it('enables gitignore updates only when explicitly opted in', () => {
    expect(resolveAnalyzeScopeOptions({
      withGitignore: true,
    } as any)).toEqual({
      registerRepo: true,
      updateGitignore: true,
      refreshContext: false,
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
      updateGitignore: false,
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

  it('describes holder pids with registry metadata when records exist', async () => {
    const details = await describeGitNexusMcpHolderPids(['101', '202'], {
      isPidAlive: (pid) => pid === 101,
      listRecords: async () => [
        {
          pid: 101,
          ppid: 1,
          role: 'repo-worker',
          sessionId: 'session-101',
          startedAt: '2026-04-05T00:00:00.000Z',
          lastHeartbeatAt: '2026-04-05T00:00:10.000Z',
          cwd: '/tmp/repo-a',
          command: 'gitnexus mcp --repo-worker',
          state: 'ready',
          repoId: 'repo-a',
          repoName: 'repo-a',
          repoPath: '/tmp/repo-a',
          storagePath: '/tmp/.gitnexus/repo-a',
          routerPid: 999,
        },
      ],
      now: new Date('2026-04-05T00:00:20.000Z'),
    });

    expect(details).toEqual([
      expect.objectContaining({
        pid: 101,
        role: 'repo-worker',
        repoName: 'repo-a',
        health: 'orphaned',
      }),
      expect.objectContaining({
        pid: 202,
        health: 'unregistered',
      }),
    ]);
  });

  it('formats holder details for analyze output', () => {
    expect(formatGitNexusMcpHolderDetails([
      {
        pid: 101,
        role: 'repo-worker',
        repoName: 'repo-a',
        sessionId: 'session-101',
        state: 'ready',
        health: 'healthy',
      },
      {
        pid: 202,
        health: 'unregistered',
      },
    ])).toBe('101:repo-worker:repo-a:healthy:ready:session-101, 202:unregistered');
  });

  it('drains matching repo workers by repo name', async () => {
    let listCount = 0;
    const requested: number[] = [];
    const readyRecord = {
      pid: 101,
      ppid: 1,
      role: 'repo-worker' as const,
      sessionId: 'session-101',
      startedAt: '2026-04-05T00:00:00.000Z',
      lastHeartbeatAt: '2026-04-05T00:00:10.000Z',
      cwd: '/tmp/repo-a',
      command: 'gitnexus mcp --repo-worker',
      state: 'ready' as const,
      repoId: 'repo-a',
      repoName: 'repo-a',
      repoPath: '/tmp/repo-a',
      storagePath: '/tmp/.gitnexus/repo-a',
      routerPid: 999,
    };
    const drainingRecord = {
      ...readyRecord,
      state: 'draining' as const,
    };

    const result = await drainGitNexusMcpRepoWorkers({
      repo: 'repo-a',
      listRecords: async () => {
        listCount += 1;
        if (listCount === 1) return [readyRecord];
        if (listCount === 2) return [drainingRecord];
        return [];
      },
      isPidAlive: () => listCount < 3,
      requestDrainPid: async (pid) => { requested.push(pid); },
      sleep: async () => {},
      ackTimeoutMs: 20,
      completionTimeoutMs: 20,
    });

    expect(requested).toEqual([101]);
    expect(result).toEqual({
      requestedPids: [101],
      acknowledgedPids: [101],
      completedPids: [101],
      waitTimedOut: false,
    });
  });

  it('tries cooperative drain before SIGTERM fallback when quiescing holders', async () => {
    const scans = [['101'], []] as string[][];
    const drained: number[] = [];
    const terminated: number[] = [];

    const result = await quiesceGitNexusMcpHolders('/tmp/example/.gitnexus/kuzu', {
      findHolders: async () => scans.shift() ?? [],
      drainGitNexusMcpPids: async (holderPids) => {
        drained.push(...holderPids.map(Number));
        return {
          requestedPids: holderPids.map(Number),
          acknowledgedPids: holderPids.map(Number),
          completedPids: holderPids.map(Number),
          waitTimedOut: false,
        };
      },
      terminatePid: async (pid) => { terminated.push(pid); },
      sleep: async () => {},
      timeoutMs: 50,
      pollIntervalMs: 1,
    });

    expect(drained).toEqual([101]);
    expect(terminated).toEqual([]);
    expect(result).toEqual({
      drainedPids: [101],
      terminatedPids: [],
      waitTimedOut: false,
    });
  });
});
