import { beforeEach, describe, expect, it, vi } from 'vitest';

const initMock = vi.fn();
const callToolMock = vi.fn();
const writeSyncMock = vi.fn();

vi.mock('../../src/mcp/local/local-backend.js', () => ({
  LocalBackend: class {
    init = initMock;
    callTool = callToolMock;
  },
}));

vi.mock('node:fs', () => ({
  writeSync: writeSyncMock,
}));

describe('direct CLI tool commands', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('GITNEXUS_LANG', 'en');
    process.exitCode = undefined;
    vi.resetModules();
    initMock.mockReset();
    callToolMock.mockReset();
    writeSyncMock.mockReset();
    initMock.mockResolvedValue(true);
  });

  it('dispatches detect_changes with CLI-shaped arguments', async () => {
    callToolMock.mockResolvedValue({
      summary: {
        changed_files: 1,
        changed_count: 2,
        affected_count: 1,
        risk_level: 'low',
      },
    });
    const { detectChangesCommand } = await import('../../src/cli/tool.js');

    await detectChangesCommand({
      scope: 'compare',
      baseRef: 'main',
      repo: 'gitnexus',
    });

    expect(callToolMock).toHaveBeenCalledWith('detect_changes', {
      scope: 'compare',
      base_ref: 'main',
      repo: 'gitnexus',
    });
    expect(writeSyncMock).toHaveBeenCalledWith(1, expect.stringContaining('Risk level: low'));
  });

  it('dispatches detect_changes with cwd and worktree hints', async () => {
    callToolMock.mockResolvedValue({
      summary: { changed_files: 0, changed_count: 0, affected_count: 0, risk_level: 'none' },
    });
    const { detectChangesCommand } = await import('../../src/cli/tool.js');

    await detectChangesCommand({
      scope: 'staged',
      repo: 'gitnexus',
      cwd: '/tmp/worktrees/feature',
      worktree: '/tmp/worktrees/feature',
    });

    expect(callToolMock).toHaveBeenCalledWith('detect_changes', {
      scope: 'staged',
      base_ref: undefined,
      repo: 'gitnexus',
      cwd: '/tmp/worktrees/feature',
      worktree: '/tmp/worktrees/feature',
    });
  });

  it('prints "No changes detected." when changed_count is 0', async () => {
    callToolMock.mockResolvedValue({
      summary: { changed_files: 0, changed_count: 0, affected_count: 0, risk_level: 'low' },
    });
    const { detectChangesCommand } = await import('../../src/cli/tool.js');

    await detectChangesCommand({});

    expect(writeSyncMock).toHaveBeenCalledWith(1, expect.stringContaining('No changes detected.'));
  });

  it('prints changed files even when no indexed symbols match', async () => {
    callToolMock.mockResolvedValue({
      summary: { changed_files: 3, changed_count: 0, affected_count: 0, risk_level: 'low' },
      changed_symbols: [],
      affected_processes: [],
      metadata: {
        selected_repo: 'GitNexus',
        git_repo_path: '/repo/GitNexus',
        git_diff_path: '/repo/GitNexus/.worktrees/docs',
        process_cwd: '/repo/GitNexus/.worktrees/docs',
        indexed_commit: 'abc1234',
        current_commit: 'def5678',
        stale: true,
        stale_severity: 'warning',
      },
    });
    const { detectChangesCommand } = await import('../../src/cli/tool.js');

    await detectChangesCommand({});

    const output: string = writeSyncMock.mock.calls[0][1];
    expect(output).toContain('Repository: GitNexus');
    expect(output).toContain('Git diff path: /repo/GitNexus/.worktrees/docs');
    expect(output).toContain('Index status: stale');
    expect(output).toContain('Changes: 3 files, 0 symbols');
    expect(output).toContain('No indexed symbols matched changed hunks.');
    expect(output).not.toBe('No changes detected.');
  });

  it('prints error message when result contains an error', async () => {
    callToolMock.mockResolvedValue({ error: 'index is stale' });
    const { detectChangesCommand } = await import('../../src/cli/tool.js');

    await detectChangesCommand({});

    expect(writeSyncMock).toHaveBeenCalledWith(1, expect.stringContaining('Error: index is stale'));
  });

  it('prints a clean error message when detect_changes throws', async () => {
    callToolMock.mockRejectedValue(
      new Error(
        'Repository "missing-project" not found. Available (showing 8 of 58): GitNexus. Nearest by cwd: GitNexus (/repo). Run: gitnexus list --all',
      ),
    );
    const { detectChangesCommand } = await import('../../src/cli/tool.js');

    await detectChangesCommand({});

    const output: string = writeSyncMock.mock.calls[0][1];
    expect(output).toContain('Error: Repository "missing-project" not found.');
    expect(output).toContain('Nearest by cwd: GitNexus');
    expect(output).not.toContain('throw new Error');
    expect(process.exitCode).toBe(1);
  });

  it('verifyStagedCommand runs staged detect_changes with cwd and emits bounded JSON', async () => {
    const symbols = Array.from({ length: 17 }, (_, i) => ({
      type: 'Function',
      name: `fn${i}`,
      filePath: `src/file${i}.ts`,
    }));
    callToolMock.mockResolvedValue({
      summary: {
        changed_files: 4,
        changed_count: 17,
        affected_count: 0,
        risk_level: 'low',
      },
      changed_symbols: symbols,
      affected_processes: [],
      metadata: {
        selected_repo: 'GitNexus',
        git_repo_path: '/repo/GitNexus',
        git_diff_path: '/repo/GitNexus/.worktrees/feature',
        process_cwd: '/repo/GitNexus/.worktrees/feature',
        indexed_commit: 'abc1234',
        current_commit: 'abc1234',
        stale: false,
      },
    });
    const { verifyStagedCommand } = await import('../../src/cli/tool.js');

    await verifyStagedCommand({
      repo: 'GitNexus',
      cwd: '/repo/GitNexus/.worktrees/feature',
      json: true,
    });

    expect(callToolMock).toHaveBeenCalledWith('detect_changes', {
      scope: 'staged',
      base_ref: undefined,
      repo: 'GitNexus',
      cwd: '/repo/GitNexus/.worktrees/feature',
      worktree: undefined,
    });
    const payload = JSON.parse(writeSyncMock.mock.calls[0][1]);
    expect(payload.command).toBe('verify-staged');
    expect(payload.ok).toBe(true);
    expect(payload.status).toBe('review');
    expect(payload.summary.changed_files).toBe(4);
    expect(payload.changed_symbols).toHaveLength(15);
    expect(payload.truncated.changed_symbols).toBe(2);
    expect(payload.metadata.git_diff_path).toBe('/repo/GitNexus/.worktrees/feature');
    expect(payload.next_action).toContain('Review listed changes');
    expect(payload.suggested_command).toContain('gitnexus detect-changes --scope staged');
  });

  it('verifyStagedCommand returns structured JSON failure with retry command', async () => {
    callToolMock.mockRejectedValue(new Error('Repository "missing" not found'));
    const { verifyStagedCommand } = await import('../../src/cli/tool.js');

    await verifyStagedCommand({
      repo: 'missing',
      cwd: '/repo/worktree',
      json: true,
    });

    const payload = JSON.parse(writeSyncMock.mock.calls[0][1]);
    expect(payload.command).toBe('verify-staged');
    expect(payload.ok).toBe(false);
    expect(payload.status).toBe('blocked');
    expect(payload.error).toContain('Repository "missing" not found');
    expect(payload.suggested_command).toBe(
      'gitnexus detect-changes --scope staged --repo missing --cwd /repo/worktree',
    );
    expect(process.exitCode).toBe(1);
  });

  it('truncates changed_symbols list beyond 15 and shows overflow count', async () => {
    const symbols = Array.from({ length: 17 }, (_, i) => ({
      type: 'function',
      name: `fn${i}`,
      filePath: `src/file${i}.ts`,
    }));
    callToolMock.mockResolvedValue({
      summary: { changed_files: 17, changed_count: 17, affected_count: 0, risk_level: 'low' },
      changed_symbols: symbols,
    });
    const { detectChangesCommand } = await import('../../src/cli/tool.js');

    await detectChangesCommand({});

    const output: string = writeSyncMock.mock.calls[0][1];
    expect(output).toContain('function fn14 → src/file14.ts');
    expect(output).not.toContain('fn15');
    expect(output).toContain('... and 2 more');
  });

  it('truncates affected_processes list beyond 10', async () => {
    const processes = Array.from({ length: 12 }, (_, i) => ({
      name: `proc${i}`,
      step_count: 3,
      changed_steps: [{ symbol: `sym${i}` }],
    }));
    callToolMock.mockResolvedValue({
      summary: { changed_files: 1, changed_count: 1, affected_count: 12, risk_level: 'low' },
      affected_processes: processes,
    });
    const { detectChangesCommand } = await import('../../src/cli/tool.js');

    await detectChangesCommand({});

    const output: string = writeSyncMock.mock.calls[0][1];
    expect(output).toContain('proc9');
    expect(output).not.toContain('proc10');
  });

  it('localizes detect_changes formatter labels for Simplified Chinese', async () => {
    vi.stubEnv('GITNEXUS_LANG', 'zh-CN');
    callToolMock.mockResolvedValue({
      summary: { changed_files: 2, changed_count: 3, affected_count: 1, risk_level: 'MEDIUM' },
      changed_symbols: [{ type: 'Function', name: 'foo', filePath: 'src/a.ts' }],
      affected_processes: [
        { name: 'Auth Flow', step_count: 5, changed_steps: [{ symbol: 'foo' }] },
      ],
    });
    const { detectChangesCommand } = await import('../../src/cli/tool.js');

    await detectChangesCommand({});

    const output: string = writeSyncMock.mock.calls[0][1];
    expect(output).toContain('变更：2 个文件，3 个符号');
    expect(output).toContain('受影响流程：1');
    expect(output).toContain('风险等级：MEDIUM');
    expect(output).toContain('已变更符号：');
    expect(output).toContain('受影响执行流程：');
    expect(output).toContain('Auth Flow (5 步) — 已变更：foo');
  });
});
