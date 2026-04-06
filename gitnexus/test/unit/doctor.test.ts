import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { runDoctor } from '../../src/cli/doctor.js';
import { getHostPlans } from '../../src/cli/setup.js';
import { SupportedLanguages } from '../../src/config/supported-languages.js';

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
        fetchJson: async () => ({ embeddings: [] }),
        probeOllama: async () => ({ status: 'warn', detail: 'no ollama probe requested' }),
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
        fetchJson: async () => ({ embeddings: [] }),
        probeOllama: async () => ({ status: 'warn', detail: 'no ollama probe requested' }),
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
        fetchJson: async () => ({ embeddings: [] }),
        probeOllama: async () => ({ status: 'warn', detail: 'no ollama probe requested' }),
        getHostPlans: () => [],
      },
    );

    expect(result).toMatchObject({
      overall: expect.stringMatching(/pass|warn|fail/),
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
        fetchJson: async () => ({ embeddings: [] }),
        probeOllama: async () => ({ status: 'warn', detail: 'no ollama probe requested' }),
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
        fetchJson: async () => ({ embeddings: [] }),
        probeOllama: async () => ({ status: 'warn', detail: 'no ollama probe requested' }),
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
        fetchJson: async () => ({ embeddings: [] }),
        probeOllama: async () => ({ status: 'warn', detail: 'no ollama probe requested' }),
        getHostPlans: () => getHostPlans({ homeDir, repoPath: repoDir }),
      },
    );

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'host-config', status: 'pass' }),
      ]),
    );
  });

  it('reports ollama embeddings config when embed probe succeeds', async () => {
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
        fetchJson: async () => ({ embeddings: [] }),
        probeOllama: async () => ({ status: 'pass', detail: 'source=ollama, embedProbe=http://localhost:11434/api/embed' }),
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

  it('warns when ollama embed probe returns an invalid payload', async () => {
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
        fetchJson: async () => ({ embeddings: [] }),
        probeOllama: async () => ({ status: 'warn', detail: 'Ollama responded but embedding payload was invalid' }),
        getHostPlans: () => [],
      },
    );

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'embeddings-config',
          status: 'warn',
          detail: expect.stringContaining('embedding payload was invalid'),
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
        fetchJson: async () => ({ embeddings: [] }),
        probeOllama: async () => ({
          status: 'warn',
          detail: 'Ollama check failed at http://127.0.0.1:11434: fetch=ECONNREFUSED connect ECONNREFUSED 127.0.0.1:11434; curl=curl: (7) Failed to connect',
        }),
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

  it('warns when optional language grammars are unavailable', async () => {
    const result = await runDoctor(
      { repo: '/repo', json: true },
      {
        isGitRepo: () => true,
        getGitRoot: () => '/repo',
        hasIndex: async () => true,
        readRegistry: async () => [],
        loadCLIConfig: async () => ({}),
        fetchJson: async () => ({ embeddings: [] }),
        probeOllama: async () => ({ status: 'warn', detail: 'no ollama probe requested' }),
        getHostPlans: () => [],
        getLanguageSupportSummary: () => [
          {
            language: SupportedLanguages.Kotlin,
            tier: 'optional',
            status: 'unavailable',
            source: 'tree-sitter-kotlin',
            detail: 'No native build was found for tree-sitter-kotlin',
          },
          {
            language: SupportedLanguages.Swift,
            tier: 'optional',
            status: 'available',
            source: 'tree-sitter-swift',
            detail: 'loaded',
          },
          {
            language: SupportedLanguages.TypeScript,
            tier: 'builtin',
            status: 'available',
            source: 'bundled',
            detail: 'bundled',
          },
        ],
      },
    );

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'language-support',
          status: 'warn',
          detail: expect.stringContaining('kotlin:optional=unavailable'),
        }),
      ]),
    );
  });

  it('includes native runtime snapshot details', async () => {
    const result = await runDoctor(
      { repo: '/repo', json: true },
      {
        isGitRepo: () => true,
        getGitRoot: () => '/repo',
        hasIndex: async () => true,
        readRegistry: async () => [],
        loadCLIConfig: async () => ({}),
        fetchJson: async () => ({ embeddings: [] }),
        probeOllama: async () => ({ status: 'warn', detail: 'no ollama probe requested' }),
        getHostPlans: () => [],
        getLanguageSupportSummary: () => [],
        getNativeRuntimeCheck: () => ({
          name: 'native-runtime',
          status: 'pass',
          detail: 'kuzuActiveRepos=0, coreEmbedderActive=false, mcpEmbedderActive=false',
        }),
      },
    );

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'native-runtime',
          status: 'pass',
          detail: expect.stringContaining('coreEmbedderActive=false'),
        }),
      ]),
    );
  });

  it('reports healthy GPU checks when host, container, and Ollama offload are working', async () => {
    const dockerInspectPayload = JSON.stringify([
      {
        State: { Running: true },
        HostConfig: {
          DeviceRequests: [
            {
              Capabilities: [['gpu']],
            },
          ],
        },
        Config: {
          Env: [
            'OLLAMA_LLM_LIBRARY=cuda_v12',
            'NVIDIA_VISIBLE_DEVICES=all',
            'NVIDIA_DRIVER_CAPABILITIES=compute,utility',
          ],
        },
      },
    ]);

    const result = await runDoctor(
      { repo: '/repo', json: true, gpu: true },
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
        fetchJson: async (url: string) => {
          if (url.endsWith('/api/ps')) {
            return {
              models: [
                {
                  name: 'qwen3-embedding:0.6b',
                  model: 'qwen3-embedding:0.6b',
                  size_vram: 1496576832,
                },
              ],
            };
          }
          return { embeddings: [] };
        },
        probeOllama: async () => ({ status: 'pass', detail: 'source=ollama, embedProbe=http://127.0.0.1:11434/api/embed' }),
        getHostPlans: () => [],
        getLanguageSupportSummary: () => [],
        getNativeRuntimeCheck: () => ({
          name: 'native-runtime',
          status: 'pass',
          detail: 'kuzuActiveRepos=0, coreEmbedderActive=false, mcpEmbedderActive=false',
        }),
        pathExists: async (targetPath: string) => targetPath === '/dev/dxg',
        runCommand: async (command: string, args: string[]) => {
          const key = [command, ...args].join(' ');
          if (key === 'nvidia-smi') {
            return { ok: true, stdout: 'NVIDIA-SMI 595.79 Driver Version: 595.79 CUDA Version: 13.2', stderr: '', exitCode: 0 };
          }
          if (key === 'docker inspect ollama') {
            return { ok: true, stdout: dockerInspectPayload, stderr: '', exitCode: 0 };
          }
          if (key === 'docker exec ollama sh -lc nvidia-smi') {
            return { ok: true, stdout: 'NVIDIA-SMI 595.54 Driver Version: 595.79 CUDA Version: 13.2', stderr: '', exitCode: 0 };
          }
          throw new Error(`Unexpected command: ${key}`);
        },
      },
    );

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'gpu-device-node', status: 'pass' }),
        expect.objectContaining({ name: 'gpu-host-runtime', status: 'pass' }),
        expect.objectContaining({ name: 'gpu-docker-config', status: 'pass' }),
        expect.objectContaining({ name: 'gpu-container-runtime', status: 'pass' }),
        expect.objectContaining({ name: 'gpu-ollama-runtime', status: 'pass' }),
      ]),
    );
  });

  it('applies a safe fix by starting the ollama container when requested', async () => {
    const inspectPayloadStopped = JSON.stringify([
      {
        State: { Running: false },
        HostConfig: {
          DeviceRequests: [
            {
              Capabilities: [['gpu']],
            },
          ],
        },
        Config: {
          Env: [
            'OLLAMA_LLM_LIBRARY=cuda_v12',
            'NVIDIA_VISIBLE_DEVICES=all',
            'NVIDIA_DRIVER_CAPABILITIES=compute,utility',
          ],
        },
      },
    ]);

    const inspectPayloadRunning = JSON.stringify([
      {
        State: { Running: true },
        HostConfig: {
          DeviceRequests: [
            {
              Capabilities: [['gpu']],
            },
          ],
        },
        Config: {
          Env: [
            'OLLAMA_LLM_LIBRARY=cuda_v12',
            'NVIDIA_VISIBLE_DEVICES=all',
            'NVIDIA_DRIVER_CAPABILITIES=compute,utility',
          ],
        },
      },
    ]);

    let inspectCount = 0;

    const result = await runDoctor(
      { repo: '/repo', json: true, gpu: true, fix: true },
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
        fetchJson: async (url: string) => {
          if (url.endsWith('/api/ps')) {
            return {
              models: [
                {
                  name: 'qwen3-embedding:0.6b',
                  model: 'qwen3-embedding:0.6b',
                  size_vram: 1496576832,
                },
              ],
            };
          }
          return { embeddings: [] };
        },
        probeOllama: async () => ({ status: 'pass', detail: 'source=ollama, embedProbe=http://127.0.0.1:11434/api/embed' }),
        getHostPlans: () => [],
        getLanguageSupportSummary: () => [],
        getNativeRuntimeCheck: () => ({
          name: 'native-runtime',
          status: 'pass',
          detail: 'kuzuActiveRepos=0, coreEmbedderActive=false, mcpEmbedderActive=false',
        }),
        pathExists: async (targetPath: string) => targetPath === '/dev/dxg',
        runCommand: async (command: string, args: string[]) => {
          const key = [command, ...args].join(' ');
          if (key === 'nvidia-smi') {
            return { ok: true, stdout: 'NVIDIA-SMI 595.79 Driver Version: 595.79 CUDA Version: 13.2', stderr: '', exitCode: 0 };
          }
          if (key === 'docker inspect ollama') {
            inspectCount += 1;
            return {
              ok: true,
              stdout: inspectCount === 1 ? inspectPayloadStopped : inspectPayloadRunning,
              stderr: '',
              exitCode: 0,
            };
          }
          if (key === 'docker start ollama') {
            return { ok: true, stdout: 'ollama', stderr: '', exitCode: 0 };
          }
          if (key === 'docker exec ollama sh -lc nvidia-smi') {
            return { ok: true, stdout: 'NVIDIA-SMI 595.54 Driver Version: 595.79 CUDA Version: 13.2', stderr: '', exitCode: 0 };
          }
          throw new Error(`Unexpected command: ${key}`);
        },
      },
    );

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'gpu-docker-config', status: 'pass' }),
        expect.objectContaining({
          name: 'gpu-fix',
          status: 'pass',
          detail: expect.stringContaining('started Docker container "ollama"'),
        }),
      ]),
    );
  });

  it('fails the GPU runtime check when Ollama falls back to CPU', async () => {
    const dockerInspectPayload = JSON.stringify([
      {
        State: { Running: true },
        HostConfig: {
          DeviceRequests: [
            {
              Capabilities: [['gpu']],
            },
          ],
        },
        Config: {
          Env: [
            'OLLAMA_LLM_LIBRARY=cuda_v12',
            'NVIDIA_VISIBLE_DEVICES=all',
            'NVIDIA_DRIVER_CAPABILITIES=compute,utility',
          ],
        },
      },
    ]);

    const result = await runDoctor(
      { repo: '/repo', json: true, gpu: true },
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
        fetchJson: async (url: string) => {
          if (url.endsWith('/api/ps')) {
            return {
              models: [
                {
                  name: 'qwen3-embedding:0.6b',
                  model: 'qwen3-embedding:0.6b',
                  size_vram: 0,
                },
              ],
            };
          }
          return { embeddings: [] };
        },
        probeOllama: async () => ({ status: 'pass', detail: 'source=ollama, embedProbe=http://127.0.0.1:11434/api/embed' }),
        getHostPlans: () => [],
        getLanguageSupportSummary: () => [],
        getNativeRuntimeCheck: () => ({
          name: 'native-runtime',
          status: 'pass',
          detail: 'kuzuActiveRepos=0, coreEmbedderActive=false, mcpEmbedderActive=false',
        }),
        pathExists: async (targetPath: string) => targetPath === '/dev/dxg',
        runCommand: async (command: string, args: string[]) => {
          const key = [command, ...args].join(' ');
          if (key === 'nvidia-smi') {
            return { ok: true, stdout: 'NVIDIA-SMI 595.79 Driver Version: 595.79 CUDA Version: 13.2', stderr: '', exitCode: 0 };
          }
          if (key === 'docker inspect ollama') {
            return { ok: true, stdout: dockerInspectPayload, stderr: '', exitCode: 0 };
          }
          if (key === 'docker exec ollama sh -lc nvidia-smi') {
            return { ok: true, stdout: 'NVIDIA-SMI 595.54 Driver Version: 595.79 CUDA Version: 13.2', stderr: '', exitCode: 0 };
          }
          throw new Error(`Unexpected command: ${key}`);
        },
      },
    );

    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'gpu-ollama-runtime',
          status: 'fail',
          detail: expect.stringContaining('size_vram=0'),
        }),
      ]),
    );
  });
});
