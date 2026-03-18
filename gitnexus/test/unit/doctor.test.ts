import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { runDoctor } from '../../src/cli/doctor.js';
import { getHostPlans } from '../../src/cli/setup.js';

const tempDirs: string[] = [];

async function createTempDir(prefix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

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
        loadCLIConfig: async () => ({}),
        fetchJson: async () => ({ models: [] }),
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
        loadCLIConfig: async () => ({}),
        fetchJson: async () => ({ models: [] }),
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
        loadCLIConfig: async () => ({}),
        fetchJson: async () => ({ models: [] }),
        getHostPlans: () => [],
      },
    );

    expect(result).toMatchObject({
      overall: 'pass',
      checks: expect.any(Array),
    });
    expect(result.checks.length).toBeGreaterThanOrEqual(3);
  });

  it('returns pass when Codex config exists in ~/.codex/config.toml', async () => {
    const homeDir = await createTempDir('gitnexus-doctor-codex-home-');
    const repoDir = await createTempDir('gitnexus-doctor-codex-repo-');
    const codexDir = path.join(homeDir, '.codex');
    await fs.mkdir(codexDir, { recursive: true });
    await fs.writeFile(
      path.join(codexDir, 'config.toml'),
      ['[mcp_servers.gitnexus]', 'command = "npx"', 'args = ["-y", "gitnexus@latest", "mcp"]'].join('\n'),
      'utf-8',
    );

    const result = await runDoctor(
      { host: 'codex', repo: repoDir, json: true },
      {
        isGitRepo: () => true,
        getGitRoot: () => repoDir,
        hasIndex: async () => true,
        readRegistry: async () => [
          {
            name: 'repo',
            path: repoDir,
            storagePath: path.join(repoDir, '.gitnexus'),
            indexedAt: new Date().toISOString(),
            lastCommit: 'abc123',
          },
        ],
        loadCLIConfig: async () => ({}),
        fetchJson: async () => ({ models: [] }),
        getHostPlans: () => getHostPlans({ homeDir, repoPath: repoDir }),
      },
    );

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'host-config', status: 'pass' }),
      ]),
    );
  });

  it('returns pass when Claude Code config exists in repo .mcp.json', async () => {
    const homeDir = await createTempDir('gitnexus-doctor-claude-home-');
    const repoDir = await createTempDir('gitnexus-doctor-claude-repo-');
    await fs.mkdir(path.join(homeDir, '.claude'), { recursive: true });
    await fs.writeFile(
      path.join(repoDir, '.mcp.json'),
      JSON.stringify({
        mcpServers: {
          gitnexus: {
            command: 'npx',
            args: ['-y', 'gitnexus@latest', 'mcp'],
          },
        },
      }),
      'utf-8',
    );

    const result = await runDoctor(
      { host: 'claude-code', repo: repoDir, json: true },
      {
        isGitRepo: () => true,
        getGitRoot: () => repoDir,
        hasIndex: async () => true,
        readRegistry: async () => [
          {
            name: 'repo',
            path: repoDir,
            storagePath: path.join(repoDir, '.gitnexus'),
            indexedAt: new Date().toISOString(),
            lastCommit: 'abc123',
          },
        ],
        loadCLIConfig: async () => ({}),
        fetchJson: async () => ({ models: [] }),
        getHostPlans: () => getHostPlans({ homeDir, repoPath: repoDir }),
      },
    );

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'host-config', status: 'pass' }),
      ]),
    );
  });

  it('returns pass when Claude Code config exists in ~/.claude.json', async () => {
    const homeDir = await createTempDir('gitnexus-doctor-claude-global-home-');
    const repoDir = await createTempDir('gitnexus-doctor-claude-global-repo-');
    await fs.mkdir(path.join(homeDir, '.claude'), { recursive: true });
    await fs.writeFile(
      path.join(homeDir, '.claude.json'),
      JSON.stringify({
        mcpServers: {
          gitnexus: {
            command: 'npx',
            args: ['-y', 'gitnexus@latest', 'mcp'],
          },
        },
      }),
      'utf-8',
    );

    const result = await runDoctor(
      { host: 'claude-code', repo: repoDir, json: true },
      {
        isGitRepo: () => true,
        getGitRoot: () => repoDir,
        hasIndex: async () => true,
        readRegistry: async () => [
          {
            name: 'repo',
            path: repoDir,
            storagePath: path.join(repoDir, '.gitnexus'),
            indexedAt: new Date().toISOString(),
            lastCommit: 'abc123',
          },
        ],
        loadCLIConfig: async () => ({}),
        fetchJson: async () => ({ models: [] }),
        getHostPlans: () => getHostPlans({ homeDir, repoPath: repoDir }),
      },
    );

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'host-config', status: 'pass' }),
      ]),
    );
  });

  it('reports ollama embeddings config and model availability', async () => {
    const result = await runDoctor(
      { repo: '/repo', json: true },
      {
        isGitRepo: () => true,
        getGitRoot: () => '/repo',
        hasIndex: async () => true,
        readRegistry: async () => [],
        loadCLIConfig: async () => ({
          embeddings: {
            provider: 'ollama',
            ollamaBaseUrl: 'http://localhost:11434',
            ollamaModel: 'qwen3-embedding:0.6b',
            nodeLimit: 90000,
            batchSize: 8,
          },
        }),
        fetchJson: async () => ({
          models: [
            { name: 'qwen3-embedding:0.6b' },
          ],
        }),
        getHostPlans: () => [],
      },
    );

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'embeddings-config',
          status: 'pass',
          detail: expect.stringContaining('provider=ollama (config)'),
        }),
      ]),
    );
  });

  it('warns when ollama model is missing from the configured server', async () => {
    const result = await runDoctor(
      { repo: '/repo', json: true },
      {
        isGitRepo: () => true,
        getGitRoot: () => '/repo',
        hasIndex: async () => true,
        readRegistry: async () => [],
        loadCLIConfig: async () => ({
          embeddings: {
            provider: 'ollama',
            ollamaBaseUrl: 'http://localhost:11434',
            ollamaModel: 'qwen3-embedding:0.6b',
          },
        }),
        fetchJson: async () => ({
          models: [
            { name: 'embeddinggemma:latest' },
          ],
        }),
        getHostPlans: () => [],
      },
    );

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'embeddings-config',
          status: 'warn',
          detail: expect.stringContaining('model=qwen3-embedding:0.6b (config)'),
        }),
      ]),
    );
  });

  it('includes connection details when ollama is unreachable', async () => {
    const result = await runDoctor(
      { repo: '/repo', json: true },
      {
        isGitRepo: () => true,
        getGitRoot: () => '/repo',
        hasIndex: async () => true,
        readRegistry: async () => [],
        loadCLIConfig: async () => ({
          embeddings: {
            provider: 'ollama',
            ollamaBaseUrl: 'http://127.0.0.1:11434',
            ollamaModel: 'qwen3-embedding:0.6b',
          },
        }),
        fetchJson: async () => {
          throw new Error('ECONNREFUSED connect ECONNREFUSED 127.0.0.1:11434');
        },
        getHostPlans: () => [],
      },
    );

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'embeddings-config',
          status: 'warn',
          detail: expect.stringContaining('http://127.0.0.1:11434'),
        }),
      ]),
    );
  });
});
