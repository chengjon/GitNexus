import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(testDir, '../..');
const outerRepoRoot = path.resolve(packageRoot, '..');
const governanceScript = path.join(packageRoot, 'scripts', 'ci', 'repository-governance-check.mjs');
const prTemplatePath = path.join(outerRepoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md');
const tempRepos: string[] = [];

function runGit(args: string[], cwd: string) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: 'pipe',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'test',
      GIT_AUTHOR_EMAIL: 'test@test',
      GIT_COMMITTER_NAME: 'test',
      GIT_COMMITTER_EMAIL: 'test@test',
    },
  });

  expect(result.status, [
    `git ${args.join(' ')} exited with code ${result.status}`,
    `stdout: ${result.stdout}`,
    `stderr: ${result.stderr}`,
  ].join('\n')).toBe(0);
}

function createPullRequestFixtureRepo() {
  const repoPath = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-governance-pr-body-'));
  tempRepos.push(repoPath);

  fs.mkdirSync(path.join(repoPath, 'docs'), { recursive: true });
  fs.writeFileSync(
    path.join(repoPath, 'docs', 'gitnexus-quick-start-guide.md'),
    '# Quick Start\n',
    'utf8',
  );

  runGit(['init'], repoPath);
  runGit(['config', 'user.email', 'test@test'], repoPath);
  runGit(['config', 'user.name', 'test'], repoPath);
  runGit(['add', '-A'], repoPath);
  runGit(['commit', '-m', 'initial commit'], repoPath);
  runGit(['branch', '-M', 'main'], repoPath);
  runGit(['checkout', '-b', 'feature/docs-governance'], repoPath);

  fs.writeFileSync(
    path.join(repoPath, 'docs', 'gitnexus-quick-start-guide.md'),
    '# Quick Start\n\nUpdated developer guidance.\n',
    'utf8',
  );
  runGit(['commit', '-am', 'update docs guide'], repoPath);

  return repoPath;
}

function writeEventPayload(repoPath: string, body: string) {
  const eventPath = path.join(repoPath, 'pull-request-event.json');
  fs.writeFileSync(
    eventPath,
    JSON.stringify({
      pull_request: {
        body,
      },
    }, null, 2),
    'utf8',
  );
  return eventPath;
}

function runGovernanceCli(repoPath: string, eventPath: string, baseRef = 'main') {
  return spawnSync(
    process.execPath,
    [
      governanceScript,
      '--mode', 'pr-body',
      '--repo-root', repoPath,
      '--base-ref', baseRef,
      '--event-path', eventPath,
    ],
    {
      cwd: packageRoot,
      encoding: 'utf8',
      stdio: 'pipe',
    },
  );
}

afterEach(() => {
  while (tempRepos.length > 0) {
    const repoPath = tempRepos.pop();
    if (repoPath && fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
    }
  }
});

describe('repository governance CLI', () => {
  it('fails pr-body mode when a developer-facing markdown entrypoint changes but the checklist item is missing', () => {
    const repoPath = createPullRequestFixtureRepo();
    const prTemplate = fs.readFileSync(prTemplatePath, 'utf8');
    const bodyWithoutChecklist = prTemplate.replace(
      /^.*Any developer-facing markdown entrypoint I changed.*\n?/m,
      '',
    );

    expect(bodyWithoutChecklist).not.toBe(prTemplate);

    const eventPath = writeEventPayload(repoPath, bodyWithoutChecklist);
    const result = runGovernanceCli(repoPath, eventPath);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[pr-markdown-entrypoint-checklist]');
    expect(result.stdout).not.toContain('Pull request governance body check passed.');
  });

  it('passes pr-body mode when the real PR template is used for a developer-facing markdown entrypoint change', () => {
    const repoPath = createPullRequestFixtureRepo();
    const prTemplate = fs.readFileSync(prTemplatePath, 'utf8');
    const eventPath = writeEventPayload(repoPath, prTemplate);
    const result = runGovernanceCli(repoPath, eventPath);

    expect(result.status, [
      `repository-governance-check.mjs exited with code ${result.status}`,
      `stdout: ${result.stdout}`,
      `stderr: ${result.stderr}`,
    ].join('\n')).toBe(0);
    expect(result.stdout).toContain('Pull request governance body check passed.');
    expect(result.stderr).toBe('');
  });

  it('fails pr-body mode when the requested base ref cannot be diffed', () => {
    const repoPath = createPullRequestFixtureRepo();
    const prTemplate = fs.readFileSync(prTemplatePath, 'utf8');
    const eventPath = writeEventPayload(repoPath, prTemplate);
    const result = runGovernanceCli(repoPath, eventPath, 'origin/does-not-exist');

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[pr-changed-files]');
    expect(result.stderr).toContain('origin/does-not-exist');
    expect(result.stdout).not.toContain('Pull request governance body check passed.');
  });
});
