import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runDoctor, type DoctorDeps } from '../../src/cli/doctor.js';

const tempDirs: string[] = [];

async function tempDir(prefix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

const baseDeps = (): DoctorDeps => ({
  getRuntimeFingerprint: () => ({
    platform: 'linux',
    arch: 'x64',
    node: 'v24.0.0',
    gitnexus: '1.6.5',
    ladybugdb: '0.1.0',
    onnxruntime: '1.24.0',
  }),
  getRuntimeCapabilities: () => ({
    graph: 'available',
    fts: 'available',
    vector: 'available',
    semanticMode: 'vector-index',
    exactScanLimit: 10_000,
  }),
  resolveEmbeddingConfig: () => ({
    provider: 'huggingface',
    embeddingUrl: undefined,
    embeddingModel: 'Xenova/all-MiniLM-L6-v2',
    embeddingApiKey: undefined,
    embeddingDims: 384,
    nodeLimit: 10_000,
    batchSize: 16,
    subBatchSize: 8,
    threads: 4,
    device: 'auto',
  }),
  isHttpMode: () => false,
  checkNative: () => ({ ok: true, binaryPath: '/native/lbugjs.node' }),
  detectMissingOptionalGrammars: () => [],
  isGitRepo: () => true,
  getGitRoot: (repoPath: string) => repoPath,
  hasIndex: async () => true,
  homeDir: () => os.tmpdir(),
});

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('doctor command diagnostics', () => {
  it('returns structured repository failure for --json --repo', async () => {
    const result = await runDoctor(
      { json: true, repo: '/not-a-repo' },
      {
        ...baseDeps(),
        isGitRepo: () => false,
      },
    );

    expect(result.overall).toBe('fail');
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'git-repo',
          status: 'fail',
          detail: expect.stringContaining('not a Git repository'),
          data: expect.objectContaining({ requestedPath: '/not-a-repo' }),
        }),
      ]),
    );
  });

  it('includes host, native runtime, and language support checks in JSON output', async () => {
    const home = await tempDir('gitnexus-doctor-home-');
    const repo = await tempDir('gitnexus-doctor-repo-');
    const codexDir = path.join(home, '.codex');
    await fs.mkdir(codexDir, { recursive: true });
    await fs.writeFile(
      path.join(codexDir, 'config.toml'),
      '[mcp_servers.gitnexus]\ncommand = "gitnexus"\n',
    );

    const result = await runDoctor(
      { json: true, host: 'codex', repo },
      {
        ...baseDeps(),
        homeDir: () => home,
        getGitRoot: () => repo,
      },
    );

    expect(result.overall).toMatch(/pass|warn/);
    expect(result.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'host-config',
          status: 'pass',
          data: expect.objectContaining({ hostId: 'codex' }),
        }),
        expect.objectContaining({
          name: 'native-runtime',
          status: 'pass',
        }),
        expect.objectContaining({
          name: 'language-support',
          status: 'pass',
        }),
      ]),
    );
  });
});
