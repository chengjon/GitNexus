import { describe, expect, it } from 'vitest';
import { runDoctor } from '../../src/cli/doctor.js';

describe('runDoctor', () => {
  it('returns codex host checks as structured output', async () => {
    const result = await runDoctor(
      { host: 'codex', repo: '/repo', json: true },
      {
        isGitRepo: () => true,
        getGitRoot: () => '/repo',
        hasIndex: async () => true,
        readRegistry: async () => [
          {
            name: 'repo',
            path: '/repo',
            storagePath: '/repo/.gitnexus',
            indexedAt: new Date().toISOString(),
            lastCommit: 'abc123',
          },
        ],
        getHostPlans: () => [
          {
            adapter: {
              id: 'codex',
              displayName: 'Codex',
              detect: async () => ({ detected: true }),
              getMcpEntry: () => ({ command: 'npx', args: ['-y', 'gitnexus@latest', 'mcp'] }),
              configure: async () => ({ status: 'manual' }),
              manualInstructions: () => ['codex mcp add gitnexus -- npx -y gitnexus@latest mcp'],
            },
            checkConfigured: async () => false,
            needsManualConfig: true,
          },
        ],
      },
    );

    expect(result.overall).toBe('warn');
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'repo-indexed', status: 'pass' }),
        expect.objectContaining({ name: 'registry-entry', status: 'pass' }),
        expect.objectContaining({ name: 'host-config', status: 'warn' }),
      ]),
    );
  });

  it('prompts to run analyze when repo is not indexed', async () => {
    const result = await runDoctor(
      { repo: '/repo', json: false },
      {
        isGitRepo: () => true,
        getGitRoot: () => '/repo',
        hasIndex: async () => false,
        readRegistry: async () => [],
        getHostPlans: () => [],
      },
    );

    expect(result.overall).toBe('fail');
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'repo-indexed',
          status: 'fail',
          detail: expect.stringContaining('Run: gitnexus analyze'),
        }),
      ]),
    );
  });

  it('returns structured checks instead of plain text logs', async () => {
    const result = await runDoctor(
      { repo: '/repo', json: true },
      {
        isGitRepo: () => true,
        getGitRoot: () => '/repo',
        hasIndex: async () => true,
        readRegistry: async () => [
          {
            name: 'repo',
            path: '/repo',
            storagePath: '/repo/.gitnexus',
            indexedAt: new Date().toISOString(),
            lastCommit: 'abc123',
          },
        ],
        getHostPlans: () => [],
      },
    );

    expect(result).toMatchObject({
      overall: 'pass',
      checks: expect.any(Array),
    });
    expect(result.checks.length).toBeGreaterThanOrEqual(3);
  });
});
