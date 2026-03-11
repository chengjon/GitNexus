/**
 * P2 Unit Tests: Staleness Compatibility Wrapper
 *
 * Tests: checkStaleness from staleness.ts
 * - HEAD matches → not stale
 * - HEAD differs → stale with commit count
 * - Git failure → fail open (not stale)
 */
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import { checkStaleness } from '../../src/mcp/staleness.js';

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

describe('checkStaleness', () => {
  it('returns not stale when HEAD matches lastCommit', async () => {
    const repoDir = await createTempGitRepo('gitnexus-stale-fresh-');
    const headCommit = git(repoDir, ['rev-parse', 'HEAD']);

    const result = checkStaleness(repoDir, headCommit);
    expect(result.isStale).toBe(false);
    expect(result.commitsBehind).toBe(0);
    expect(result.hint).toBeUndefined();
  });

  it('returns stale when lastCommit is behind HEAD', async () => {
    const repoDir = await createTempGitRepo('gitnexus-stale-behind-');
    await fs.writeFile(path.join(repoDir, 'file.txt'), 'v2\n', 'utf-8');
    git(repoDir, ['commit', '-am', 'second']);
    const previousCommit = git(repoDir, ['rev-parse', 'HEAD~1']);

    const result = checkStaleness(repoDir, previousCommit);
    expect(result.isStale).toBe(true);
    expect(result.commitsBehind).toBeGreaterThan(0);
    expect(result.hint).toContain('behind HEAD');
  });

  it('fails open when git command fails (e.g., invalid path)', () => {
    const result = checkStaleness('/nonexistent/path', 'abc123');
    expect(result.isStale).toBe(false);
    expect(result.commitsBehind).toBe(0);
  });

  it('fails open with invalid commit hash', async () => {
    const repoDir = await createTempGitRepo('gitnexus-stale-invalid-');
    const result = checkStaleness(repoDir, 'not-a-real-commit-hash');
    expect(result.isStale).toBe(false);
    expect(result.commitsBehind).toBe(0);
  });
});
