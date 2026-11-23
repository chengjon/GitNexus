/**
 * Runtime half of the detect-changes runaway alarm: the CLI actually arms the
 * ELAPSED×CPU watchdog and prints its warning on real stderr.
 *
 * The 2026-11-23 factor-pool incident produced nine silent hours of 100% CPU;
 * the startup anchor line (pid/heap/fileCap) only helps *after* someone finds
 * the process. The watchdog is what makes the runaway visible while it runs.
 * The backend child used by detect-changes-stderr.test.ts bypasses
 * detectChangesCommand, so this test drives the real CLI entry in a child
 * process with the same module hooks stubbing LBUG, and forces the thresholds
 * through env knobs (interval 20ms, no elapsed floor, threshold 0) so the
 * alarm deterministically fires on a healthy, fast run.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { tsxLoaderUrl } from '../helpers/cli-entry.js';
import { initGitRepo } from '../helpers/temp-git-repo.js';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const hooksPath = path.resolve(testDir, '../helpers/detect-changes-stderr-hooks.mjs');
const childPath = path.resolve(testDir, '../helpers/detect-changes-cli-child.ts');
const packageRoot = path.resolve(testDir, '../..');

const homeDir = mkdtempSync(path.join(tmpdir(), 'gitnexus-watchdog-home-'));
const repoDir = mkdtempSync(path.join(tmpdir(), 'gitnexus-watchdog-repo-'));

function git(args: readonly string[]): string {
  return execFileSync('git', args, {
    cwd: repoDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
}

afterAll(() => {
  rmSync(repoDir, { recursive: true, force: true });
  rmSync(homeDir, { recursive: true, force: true });
});

function seedRepo(): void {
  // Committed state only — no working-tree modification. A changed file would
  // be unmapped (no index behind the stubbed LBUG) and make the run
  // `partial: true`, which #2175 turns into exit code 1. The watchdog test
  // wants a clean, complete run: exit 0 proves the armed watchdog does not
  // disturb the normal exit path.
  initGitRepo(repoDir);
  writeFileSync(path.join(repoDir, 'a.js'), 'const a=1\nconst b=2\n');
  git(['add', '--', 'a.js']);
  git(['commit', '-q', '-m', 'seed']);
  mkdirSync(path.join(repoDir, '.gitnexus'), { recursive: true });
  writeFileSync(path.join(repoDir, '.gitnexus', 'meta.json'), '{}\n');
}

seedRepo();

function runCliChild(extraEnv: NodeJS.ProcessEnv): { status: number | null; stderr: string } {
  const raw = spawnSync(
    process.execPath,
    ['--import', tsxLoaderUrl(), '--import', pathToFileURL(hooksPath).href, childPath, 'unstaged'],
    {
      cwd: packageRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        DETECT_CHANGES_REPO: repoDir,
        GITNEXUS_HOME: homeDir,
        ...extraEnv,
      },
      timeout: 45_000,
      windowsHide: true,
    },
  );
  return { status: raw.status, stderr: raw.stderr ?? '' };
}

describe('detect-changes CLI watchdog', () => {
  it('prints exactly one watchdog warning when the forced thresholds fire', () => {
    const { status, stderr } = runCliChild({
      GITNEXUS_DETECT_CHANGES_WATCHDOG_INTERVAL_MS: '20',
      GITNEXUS_DETECT_CHANGES_WATCHDOG_MIN_ELAPSED_MS: '0',
      GITNEXUS_DETECT_CHANGES_WATCHDOG_CPU: '0',
    });

    expect(status, stderr).toBe(0);
    const warnings = stderr.split('\n').filter((line) => line.includes('detect-changes watchdog:'));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/pid=\d+/);
    expect(warnings[0]).toMatch(/\d+s elapsed/);
    expect(warnings[0]).toMatch(/\d+% of one core/);
    // The startup anchor still identifies the process.
    expect(stderr).toMatch(/gitnexus detect-changes pid=\d+/);
  }, 60_000);

  it('stays silent on a healthy run but keeps the startup anchor line', () => {
    const { status, stderr } = runCliChild({});

    expect(status, stderr).toBe(0);
    expect(stderr).toMatch(/gitnexus detect-changes pid=\d+/);
    expect(stderr).not.toContain('detect-changes watchdog:');
  }, 60_000);
});
