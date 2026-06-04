/**
 * P1/P0 CLI E2E Tests: Incremental Analyze Mode + Status JSON
 *
 * Tests --staged-only, --changed-only, --files flags and status --json
 * using the same spawnSync + mini-repo pattern from cli-e2e.test.ts.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';
import { cleanupTempDirSync } from '../helpers/test-db.js';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../..');
const cliEntry = path.join(repoRoot, 'src/cli/index.ts');
const FIXTURE_SRC = path.resolve(testDir, '..', 'fixtures', 'mini-repo');

const _require = createRequire(import.meta.url);
const tsxPkgDir = path.dirname(_require.resolve('tsx/package.json'));
const tsxImportUrl = pathToFileURL(path.join(tsxPkgDir, 'dist', 'loader.mjs')).href;
const TARGET_FILE = 'src/validator.ts';

let MINI_REPO: string;
let tmpParent: string;
let gnHome: string;

const gitEnv = {
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@test',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@test',
};

function cliEnv(extra: Record<string, string> = {}) {
  return {
    ...process.env,
    GITNEXUS_HOME: gnHome,
    NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --max-old-space-size=8192`.trim(),
    ...extra,
  };
}

function runCli(args: string[], cwd: string, timeoutMs = 60000) {
  return spawnSync(process.execPath, ['--import', tsxImportUrl, cliEntry, ...args], {
    cwd,
    encoding: 'utf8',
    timeout: timeoutMs,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: cliEnv(),
  });
}

function expectCliSuccess(result: ReturnType<typeof runCli>) {
  expect(result.status, `stderr: ${result.stderr}\nstdout: ${result.stdout}`).not.toBeNull();
  expect(result.status, `stderr: ${result.stderr}`).toBe(0);
}

function indexedFiles(repo: string): string[] {
  const metaPath = path.join(repo, '.gitnexus', 'meta.json');
  expect(fs.existsSync(metaPath), 'expected analyze to write .gitnexus/meta.json').toBe(true);
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  expect(meta.fileHashes).toBeDefined();
  return Object.keys(meta.fileHashes).sort();
}

function makeRepo(prefix: string): string {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const repo = path.join(parent, 'mini-repo');
  fs.cpSync(FIXTURE_SRC, repo, { recursive: true });
  spawnSync('git', ['init'], { cwd: repo, stdio: 'pipe' });
  spawnSync('git', ['add', '-A'], { cwd: repo, stdio: 'pipe' });
  spawnSync('git', ['commit', '-m', 'initial'], {
    cwd: repo,
    stdio: 'pipe',
    env: { ...process.env, ...gitEnv },
  });
  return repo;
}

beforeAll(() => {
  tmpParent = fs.mkdtempSync(path.join(os.tmpdir(), 'gn-incr-'));
  gnHome = fs.mkdtempSync(path.join(os.tmpdir(), 'gn-incr-home-'));
  MINI_REPO = makeRepo('gn-incr-main-');
});

afterAll(() => {
  if (tmpParent) cleanupTempDirSync(tmpParent);
  if (gnHome) cleanupTempDirSync(gnHome);
});

describe('incremental analyze mode', () => {
  it('--staged-only analyzes only staged files (P1 4.1)', () => {
    const repo = makeRepo('gn-staged-');
    // Edit and stage a single file
    fs.appendFileSync(path.join(repo, TARGET_FILE), '\nexport const stagedChange = true;\n');
    spawnSync('git', ['add', TARGET_FILE], { cwd: repo, stdio: 'pipe' });

    const result = runCli(['analyze', '--staged-only'], repo);
    expectCliSuccess(result);
    expect(indexedFiles(repo)).toEqual([TARGET_FILE]);
  }, 90_000);

  it('--changed-only analyzes changed files (P1 4.2)', () => {
    const repo = makeRepo('gn-changed-');
    // Edit without staging
    fs.appendFileSync(path.join(repo, TARGET_FILE), '\nexport const unstagedChange = true;\n');

    const result = runCli(['analyze', '--changed-only'], repo);
    expectCliSuccess(result);
    expect(indexedFiles(repo)).toEqual([TARGET_FILE]);
  }, 90_000);

  it('--files with explicit path (P1 4.3)', () => {
    const repo = makeRepo('gn-files-');

    const result = runCli(['analyze', '--files', TARGET_FILE], repo);
    expectCliSuccess(result);
    expect(indexedFiles(repo)).toEqual([TARGET_FILE]);
  }, 90_000);

  it('full analyze still works with no flags (P1 4.4)', () => {
    const result = runCli(['analyze'], MINI_REPO);
    expectCliSuccess(result);
    expect(fs.existsSync(path.join(MINI_REPO, '.gitnexus'))).toBe(true);
    expect(indexedFiles(MINI_REPO).length).toBeGreaterThan(1);
  }, 90_000);
});

describe('status --json (P0 4.3/5.1)', () => {
  it('outputs valid JSON with expected fields', () => {
    // First analyze to create an index
    const analyzeResult = runCli(['analyze'], MINI_REPO);
    expectCliSuccess(analyzeResult);

    const result = runCli(['status', '--json'], MINI_REPO);
    expectCliSuccess(result);

    const json = JSON.parse(result.stdout);
    expect(json).toHaveProperty('repoPath');
    expect(json).toHaveProperty('indexedCommit');
    expect(json).toHaveProperty('currentCommit');
    expect(json).toHaveProperty('dirty');
    expect(json).toHaveProperty('stagedFiles');
    expect(json).toHaveProperty('freshForStagedDiff');
  }, 90_000);
});
