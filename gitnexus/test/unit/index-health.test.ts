import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { afterEach, describe, expect, it } from 'vitest';
import { getIndexHealth } from '../../src/mcp/staleness.js';

const tempDirs: string[] = [];

function git(cwd: string, args: string[]): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim();
}

async function createTempGitRepo(prefix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);

  git(dir, ['init']);
  git(dir, ['config', 'user.email', 'test@example.com']);
  git(dir, ['config', 'user.name', 'GitNexus Test']);

  await fs.writeFile(path.join(dir, 'file.txt'), 'v1\n', 'utf-8');
  git(dir, ['add', 'file.txt']);
  git(dir, ['commit', '-m', 'init']);

  return dir;
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

describe('getIndexHealth', () => {
  it('returns fresh when HEAD matches and worktree is clean', async () => {
    const repoDir = await createTempGitRepo('gitnexus-health-fresh-');
    const headCommit = git(repoDir, ['rev-parse', 'HEAD']);

    const health = getIndexHealth(repoDir, headCommit);

    expect(health.level).toBe('fresh');
    expect(health.reasons).toEqual([]);
    expect(health.commitsBehind).toBe(0);
    expect(health.dirty).toBe(false);
  });

  it('returns warning when index commit is behind HEAD', async () => {
    const repoDir = await createTempGitRepo('gitnexus-health-behind-');
    await fs.writeFile(path.join(repoDir, 'file.txt'), 'v2\n', 'utf-8');
    git(repoDir, ['commit', '-am', 'second']);
    const previousCommit = git(repoDir, ['rev-parse', 'HEAD~1']);

    const health = getIndexHealth(repoDir, previousCommit);

    expect(health.level).toBe('warning');
    expect(health.reasons).toContain('commit-behind');
    expect(health.commitsBehind).toBeGreaterThan(0);
    expect(health.dirty).toBe(false);
  });

  it('returns degraded when worktree is dirty', async () => {
    const repoDir = await createTempGitRepo('gitnexus-health-dirty-');
    const headCommit = git(repoDir, ['rev-parse', 'HEAD']);
    await fs.writeFile(path.join(repoDir, 'file.txt'), 'dirty\n', 'utf-8');

    const health = getIndexHealth(repoDir, headCommit);

    expect(health.level).toBe('degraded');
    expect(health.reasons).toContain('dirty-worktree');
    expect(health.commitsBehind).toBe(0);
    expect(health.dirty).toBe(true);
  });

  it('returns degraded with both reasons when commit is behind and worktree is dirty', async () => {
    const repoDir = await createTempGitRepo('gitnexus-health-combined-');
    await fs.writeFile(path.join(repoDir, 'file.txt'), 'v2\n', 'utf-8');
    git(repoDir, ['commit', '-am', 'second']);
    const previousCommit = git(repoDir, ['rev-parse', 'HEAD~1']);
    await fs.writeFile(path.join(repoDir, 'file.txt'), 'dirty\n', 'utf-8');

    const health = getIndexHealth(repoDir, previousCommit);

    expect(health.level).toBe('degraded');
    expect(health.reasons).toEqual(expect.arrayContaining(['commit-behind', 'dirty-worktree']));
    expect(health.commitsBehind).toBeGreaterThan(0);
    expect(health.dirty).toBe(true);
  });

  it('returns invalid when git inspection fails', () => {
    const health = getIndexHealth('/nonexistent/path', 'abc123');

    expect(health.level).toBe('invalid');
    expect(health.reasons).toContain('git-error');
    expect(health.commitsBehind).toBe(0);
    expect(health.dirty).toBe(false);
  });
});
