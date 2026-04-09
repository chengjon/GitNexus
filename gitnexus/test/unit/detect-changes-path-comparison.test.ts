import { describe, expect, it, vi, beforeEach } from 'vitest';

const { execFileSyncMock, getGitIdentityMock, samePlatformPathMock } = vi.hoisted(() => ({
  execFileSyncMock: vi.fn(() => ''),
  getGitIdentityMock: vi.fn(),
  samePlatformPathMock: vi.fn((left: string, right: string) => left.toLowerCase() === right.toLowerCase()),
}));

vi.mock('child_process', () => ({
  execFileSync: execFileSyncMock,
}));

vi.mock('../../src/storage/git.js', () => ({
  getGitIdentity: getGitIdentityMock,
}));

vi.mock('../../src/lib/path-comparison.js', () => ({
  samePlatformPath: samePlatformPathMock,
}));

import { runDetectChangesTool } from '../../src/mcp/local/tools/handlers/detect-changes-handler.js';

describe('runDetectChangesTool path comparison', () => {
  beforeEach(() => {
    execFileSyncMock.mockClear();
    getGitIdentityMock.mockReset();
    samePlatformPathMock.mockClear();
  });

  it('does not mark fallback_reason when cwd differs only by path casing', async () => {
    const repoPath = '/tmp/repo-under-test';
    const cwdPath = '/TMP/REPO-UNDER-TEST';
    getGitIdentityMock.mockImplementation((candidate: string) => {
      if (candidate === repoPath) {
        return {
          commonDir: `${repoPath}/.git`,
          topLevel: repoPath,
        };
      }
      return null;
    });

    const result = await runDetectChangesTool({
      repo: { id: 'repo-id', repoPath },
      runtime: { ensureInitialized: vi.fn().mockResolvedValue(undefined) },
      logQueryError: vi.fn(),
    } as any, {
      scope: 'unstaged',
      cwd: cwdPath,
    });

    expect(samePlatformPathMock).toHaveBeenCalledWith(repoPath, cwdPath);
    expect(result.metadata).toEqual(expect.objectContaining({
      git_repo_path: repoPath,
      git_diff_path: repoPath,
      process_cwd: cwdPath,
      path_resolution: 'registry_repo',
      fallback_reason: null,
      scope: 'unstaged',
    }));
    expect(execFileSyncMock).toHaveBeenCalledWith('git', ['diff', '--name-only'], expect.objectContaining({
      cwd: repoPath,
      encoding: 'utf-8',
    }));
  });
});
