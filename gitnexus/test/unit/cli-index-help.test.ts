import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../..');
const cliEntry = path.join(repoRoot, 'src/cli/index.ts');
const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

function runHelp(command: string | string[]) {
  const commandArgs = Array.isArray(command) ? command : [command];
  return spawnSync(process.execPath, ['--import', 'tsx', cliEntry, ...commandArgs, '--help'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function runCli(commandArgs: string[]) {
  return spawnSync(process.execPath, ['--import', 'tsx', cliEntry, ...commandArgs], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

async function createIndexedRepo(): Promise<string> {
  const repoDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gitnexus-doctor-positional-'));
  tempDirs.push(repoDir);

  const gitInit = spawnSync('git', ['init', '-q'], {
    cwd: repoDir,
    encoding: 'utf8',
  });
  expect(gitInit.status).toBe(0);

  const storageDir = path.join(repoDir, '.gitnexus');
  await fs.mkdir(storageDir, { recursive: true });
  await fs.writeFile(path.join(storageDir, 'kuzu'), '', 'utf8');
  await fs.writeFile(
    path.join(storageDir, 'meta.json'),
    JSON.stringify({
      repoPath: repoDir,
      lastCommit: 'abc123',
      indexedAt: new Date().toISOString(),
    }, null, 2),
    'utf8',
  );

  return repoDir;
}

describe('CLI help surface', () => {
  it('query help keeps advanced search options without importing analyze deps', () => {
    const result = runHelp('query');

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('--context <text>');
    expect(result.stdout).toContain('--goal <text>');
    expect(result.stdout).toContain('--content');
    expect(result.stderr).not.toContain('tree-sitter-kotlin');
  });

  it('context help keeps optional name and disambiguation flags', () => {
    const result = runHelp('context');

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('context [options] [name]');
    expect(result.stdout).toContain('--uid <uid>');
    expect(result.stdout).toContain('--file <path>');
  });

  it('impact help keeps repo and include-tests flags', () => {
    const result = runHelp('impact');

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('--depth <n>');
    expect(result.stdout).toContain('--include-tests');
    expect(result.stdout).toContain('--repo <name>');
  });

  it('config embeddings help exposes show/set/clear commands', () => {
    const result = runHelp('config');

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('embeddings');

    const embeddingsResult = runHelp(['config', 'embeddings']);
    expect(embeddingsResult.status).toBe(0);
    expect(embeddingsResult.stdout).toContain('show');
    expect(embeddingsResult.stdout).toContain('set');
    expect(embeddingsResult.stdout).toContain('clear');
  });

  it('doctor help exposes gpu diagnostics flags', () => {
    const result = runHelp('doctor');

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('doctor [options] [path]');
    expect(result.stdout).toContain('--gpu');
    expect(result.stdout).toContain('--fix');
  });

  it('doctor accepts repo path as a positional argument', async () => {
    const repoDir = await createIndexedRepo();
    const result = runCli(['doctor', repoDir, '--json']);

    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as {
      checks: Array<{ name: string; status: string; detail: string }>;
    };
    expect(payload.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'git-repo',
          status: 'pass',
          detail: expect.stringContaining(repoDir),
        }),
        expect.objectContaining({
          name: 'repo-indexed',
          status: 'pass',
          detail: expect.stringContaining(path.join(repoDir, '.gitnexus')),
        }),
      ]),
    );
  });
});
