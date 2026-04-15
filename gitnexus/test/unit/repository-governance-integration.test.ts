import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { describe, expect, it } from 'vitest';
import { findPullRequestBodyViolations } from '../../scripts/ci/repository-governance-check.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const packageRoot = path.resolve(__dirname, '..', '..');

describe('repository governance integration', () => {
  it('exposes a local governance check command in package.json', async () => {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(packageRoot, 'package.json'), 'utf8'),
    );

    expect(packageJson.scripts['check:repo-governance']).toContain(
      'repository-governance-check.mjs --mode paths',
    );
  });

  it('keeps root and first-level developer-facing markdown entrypoints anchored to the development rules unless explicitly exempted', async () => {
    const candidateFiles = [
      ...await fs.readdir(repoRoot),
      ...((await fs.readdir(path.join(repoRoot, 'docs'))).map((name) => path.join('docs', name))),
      ...((await fs.readdir(path.join(repoRoot, 'eval'))).map((name) => path.join('eval', name))),
      ...((await fs.readdir(path.join(repoRoot, 'gitnexus'))).map((name) => path.join('gitnexus', name))),
    ]
      .filter((relativePath) => relativePath.endsWith('.md'))
      .filter((relativePath) => !relativePath.startsWith('.github/'));

    const exempt = new Set([
      'CHANGELOG.md',
      'DEVELOPMENT_RULES.md',
    ]);

    for (const relativePath of candidateFiles.sort()) {
      if (exempt.has(relativePath)) {
        continue;
      }

      const content = await fs.readFile(path.join(repoRoot, relativePath), 'utf8');
      expect(content, relativePath).toContain('DEVELOPMENT_RULES.md');
    }
  });

  it('links the root README to the top-level development rules document', async () => {
    const readme = await fs.readFile(
      path.join(repoRoot, 'README.md'),
      'utf8',
    );

    expect(readme).toContain('DEVELOPMENT_RULES.md');
    expect(readme).toContain('Repository-wide development rules live in');
  });

  it('anchors the top-level host instruction files to the root development rules', async () => {
    const [agents, claude] = await Promise.all([
      fs.readFile(path.join(repoRoot, 'AGENTS.md'), 'utf8'),
      fs.readFile(path.join(repoRoot, 'CLAUDE.md'), 'utf8'),
    ]);

    expect(agents).toContain('DEVELOPMENT_RULES.md');
    expect(agents).toContain('mandatory and takes precedence');
    expect(claude).toContain('DEVELOPMENT_RULES.md');
    expect(claude).toContain('mandatory and takes precedence');
  });

  it('anchors the inner gitnexus host instruction files to the root development rules', async () => {
    const [agents, claude] = await Promise.all([
      fs.readFile(path.join(repoRoot, 'gitnexus', 'AGENTS.md'), 'utf8'),
      fs.readFile(path.join(repoRoot, 'gitnexus', 'CLAUDE.md'), 'utf8'),
    ]);

    expect(agents).toContain('../DEVELOPMENT_RULES.md');
    expect(agents).toContain('MUST follow');
    expect(claude).toContain('../DEVELOPMENT_RULES.md');
    expect(claude).toContain('MUST follow');
  });

  it('links the inner gitnexus README to the root development rules document', async () => {
    const readme = await fs.readFile(
      path.join(repoRoot, 'gitnexus', 'README.md'),
      'utf8',
    );

    expect(readme).toContain('../DEVELOPMENT_RULES.md');
    expect(readme).toContain('../.github/PULL_REQUEST_TEMPLATE.md');
    expect(readme).toContain('Development Governance');
    expect(readme).toContain('migrations');
    expect(readme).toContain('compatibility layers');
    expect(readme).toContain('Line Scope');
    expect(readme).toContain('Workline Lane');
    expect(readme).toContain('Current Source of Truth');
    expect(readme).toContain('Validation');
  });

  it('links the eval README to the root development rules document', async () => {
    const readme = await fs.readFile(
      path.join(repoRoot, 'eval', 'README.md'),
      'utf8',
    );

    expect(readme).toContain('../DEVELOPMENT_RULES.md');
    expect(readme).toContain('Development Governance');
    expect(readme).toContain('migrations');
    expect(readme).toContain('temporary entry points');
  });

  it('links the AI CLI local quick start guide to the root development rules document', async () => {
    const quickStart = await fs.readFile(
      path.join(repoRoot, 'docs', 'ai-cli-local-quick-start.md'),
      'utf8',
    );

    expect(quickStart).toContain('../DEVELOPMENT_RULES.md');
    expect(quickStart).toContain('Development Governance');
    expect(quickStart).toContain('migrations');
    expect(quickStart).toContain('compatibility layers');
  });

  it('links the GitNexus quick start guide to the root development rules document', async () => {
    const quickStart = await fs.readFile(
      path.join(repoRoot, 'docs', 'gitnexus-quick-start-guide.md'),
      'utf8',
    );

    expect(quickStart).toContain('../DEVELOPMENT_RULES.md');
    expect(quickStart).toContain('Development Governance');
    expect(quickStart).toContain('migrations');
    expect(quickStart).toContain('temporary entry points');
  });

  it('links the skill-maintenance docs to the root development rules document', async () => {
    const [reviewDoc, suggestionsDoc] = await Promise.all([
      fs.readFile(path.join(repoRoot, 'docs', 'gitnexus-skills-review.md'), 'utf8'),
      fs.readFile(path.join(repoRoot, 'docs', 'gitnexus-skills-modification-suggestions.md'), 'utf8'),
    ]);

    expect(reviewDoc).toContain('../DEVELOPMENT_RULES.md');
    expect(reviewDoc).toContain('Development Governance');
    expect(reviewDoc).toContain('compatibility layers');
    expect(suggestionsDoc).toContain('../DEVELOPMENT_RULES.md');
    expect(suggestionsDoc).toContain('Development Governance');
    expect(suggestionsDoc).toContain('temporary entry points');
  });

  it('links design and performance guidance docs to the root development rules document', async () => {
    const [workerIsolationDesign, sigusr1Design, embeddingNotes] = await Promise.all([
      fs.readFile(path.join(repoRoot, 'docs', 'mcp-per-repo-worker-isolation-design.md'), 'utf8'),
      fs.readFile(path.join(repoRoot, 'docs', 'sigusr1-cooperative-release-design.md'), 'utf8'),
      fs.readFile(path.join(repoRoot, 'docs', '2026-03-21-gitnexus-embedding-performance-and-ollama-gpu.md'), 'utf8'),
    ]);

    expect(workerIsolationDesign).toContain('../DEVELOPMENT_RULES.md');
    expect(workerIsolationDesign).toContain('Development Governance');
    expect(workerIsolationDesign).toContain('migrations');
    expect(sigusr1Design).toContain('../DEVELOPMENT_RULES.md');
    expect(sigusr1Design).toContain('Development Governance');
    expect(sigusr1Design).toContain('compatibility layers');
    expect(embeddingNotes).toContain('../DEVELOPMENT_RULES.md');
    expect(embeddingNotes).toContain('Development Governance');
    expect(embeddingNotes).toContain('metric claims');
  });

  it('documents that developer-facing markdown entrypoints must point to DEVELOPMENT_RULES.md in the top-level rules', async () => {
    const developmentRules = await fs.readFile(
      path.join(repoRoot, 'DEVELOPMENT_RULES.md'),
      'utf8',
    );

    expect(developmentRules).toContain('developer-facing markdown entrypoints');
    expect(developmentRules).toContain('DEVELOPMENT_RULES.md');
    expect(developmentRules).toContain('root or first-level');
  });

  it('keeps the six top-level governance themes explicit in DEVELOPMENT_RULES.md', async () => {
    const developmentRules = await fs.readFile(
      path.join(repoRoot, 'DEVELOPMENT_RULES.md'),
      'utf8',
    );

    expect(developmentRules).toContain('## 1. Single Source of Truth and No Duplicate Layers');
    expect(developmentRules).toContain('## 2. Compatibility Layers, Shims, and `*_new` Files');
    expect(developmentRules).toContain('## 3. Migration Completion Definition and Exit Criteria');
    expect(developmentRules).toContain('## 4. Deletion Gate: Code Path and Feature Tree Validation');
    expect(developmentRules).toContain('## 5. Metrics Semantics: Measured, Inferred, and Historical Baseline');
    expect(developmentRules).toContain('## 6. Mechanical Splits, Temporary Entrypoints, and Backup File Hygiene');
  });

  it('includes developer-facing markdown entrypoints in the top-level review checklist', async () => {
    const developmentRules = await fs.readFile(
      path.join(repoRoot, 'DEVELOPMENT_RULES.md'),
      'utf8',
    );

    expect(developmentRules).toContain('developer-facing markdown entrypoints');
    expect(developmentRules).toContain('reference `DEVELOPMENT_RULES.md`');
  });

  it('documents markdown-entrypoint governance in the PR template checklist', async () => {
    const prTemplate = await fs.readFile(
      path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'),
      'utf8',
    );

    expect(prTemplate).toContain('developer-facing markdown entrypoint');
    expect(prTemplate).toContain('DEVELOPMENT_RULES.md');
    expect(prTemplate).toContain('docs/');
  });

  it('keeps the PR template checklist aligned with the top-level governance themes', async () => {
    const prTemplate = await fs.readFile(
      path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'),
      'utf8',
    );

    expect(prTemplate).toContain('stable canonical path or source of truth');
    expect(prTemplate).toContain('undeclared duplicate implementation');
    expect(prTemplate).toContain('temporary shim, compatibility layer, migration bridge, or temporary entry point');
    expect(prTemplate).toContain('transitional or partial instead of complete');
    expect(prTemplate).toContain('feature-tree reachability');
    expect(prTemplate).toContain('measured, inferred, or historical baseline');
    expect(prTemplate).toContain('mechanical split');
    expect(prTemplate).toContain('backup files');
  });

  it('keeps the real PR template compatible with markdown-entrypoint governance checks', async () => {
    const prTemplate = await fs.readFile(
      path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'),
      'utf8',
    );

    const violations = findPullRequestBodyViolations(prTemplate, [
      { status: 'M', path: 'docs/gitnexus-quick-start-guide.md' },
    ]);

    expect(violations).toEqual([]);
  });

  it('runs the governance path check from the quality workflow', async () => {
    const workflow = await fs.readFile(
      path.join(repoRoot, '.github', 'workflows', 'ci-quality.yml'),
      'utf8',
    );

    expect(workflow).toContain('npm run check:repo-governance');
  });

  it('uses a non-locale env name for language-support status in the main CI workflow', async () => {
    const workflow = await fs.readFile(
      path.join(repoRoot, '.github', 'workflows', 'ci.yml'),
      'utf8',
    );

    expect(workflow).toContain('LANG_SUPPORT: ${{ needs.language-support.result }}');
    expect(workflow).toContain('echo "Lang Support:$LANG_SUPPORT"');
    expect(workflow).toContain('"$LANG_SUPPORT" != "success"');
  });

  it('persists a language-support report artifact from the main CI workflow', async () => {
    const workflow = await fs.readFile(
      path.join(repoRoot, '.github', 'workflows', 'ci.yml'),
      'utf8',
    );

    expect(workflow).toContain('node dist/ci/language-support-report.js doctor-output.json | tee language-support-summary.md');
    expect(workflow).toContain('name: language-support-report');
    expect(workflow).toContain('gitnexus/doctor-output.json');
    expect(workflow).toContain('gitnexus/language-support-summary.md');
  });

  it('keeps explicit metric classification fields in the PR template', async () => {
    const prTemplate = await fs.readFile(
      path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'),
      'utf8',
    );

    expect(prTemplate).toContain('Line Scope:');
    expect(prTemplate).toContain('Workline Lane:');
    expect(prTemplate).toContain('Scope Deviations:');
    expect(prTemplate).toContain('Current Source of Truth:');
    expect(prTemplate).toContain('Canonical Path:');
    expect(prTemplate).toContain('Compatibility Layer / Shim:');
    expect(prTemplate).toContain('Exit Condition:');
    expect(prTemplate).toContain('Migration Status:');
    expect(prTemplate).toContain('Deletion Reachability:');
    expect(prTemplate).toContain('GitNexus Evidence:');
    expect(prTemplate).toContain('Measured:');
    expect(prTemplate).toContain('Inferred:');
    expect(prTemplate).toContain('Historical Baseline:');
    expect(prTemplate).toContain('Execution Path Verification:');
    expect(prTemplate).toContain('Regression Coverage:');
    expect(prTemplate).toContain('Current Docs / Facts Updated:');
  });

  it('documents repo-relative path expectations for GitNexus evidence in the PR template and top-level rules', async () => {
    const [prTemplate, developmentRules] = await Promise.all([
      fs.readFile(path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'), 'utf8'),
      fs.readFile(path.join(repoRoot, 'DEVELOPMENT_RULES.md'), 'utf8'),
    ]);

    expect(prTemplate).toContain('repo-relative');
    expect(prTemplate).toContain('gitnexus/src/');
    expect(developmentRules).toContain('repo-relative');
  });

  it('documents that metrics N/A is only for cases with no measured, inferred, or baseline claim', async () => {
    const prTemplate = await fs.readFile(
      path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'),
      'utf8',
    );

    expect(prTemplate).toContain('Only fill this when all three metric categories are empty');
  });

  it('documents explicit metric scope and time guidance in the PR template', async () => {
    const prTemplate = await fs.readFile(
      path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'),
      'utf8',
    );

    expect(prTemplate).toContain('scope:');
    expect(prTemplate).toContain('time:');
  });

  it('documents structured deletion reachability dimensions in the PR template', async () => {
    const prTemplate = await fs.readFile(
      path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'),
      'utf8',
    );

    expect(prTemplate).toContain('feature-tree');
    expect(prTemplate).toContain('runtime');
    expect(prTemplate).toContain('scripts');
    expect(prTemplate).toContain('config');
    expect(prTemplate).toContain('tests');
  });

  it('documents that canonical path must stay on the stable path in the PR template', async () => {
    const prTemplate = await fs.readFile(
      path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'),
      'utf8',
    );

    expect(prTemplate).toContain('stable canonical path');
    expect(prTemplate).toContain('exactly one stable canonical path');
    expect(prTemplate).toContain('Do not put shim, compat, *_new.*, or *_v2.* paths here');
  });

  it('documents that canonical path should be a repo-relative path in the PR template and top-level rules', async () => {
    const [prTemplate, developmentRules] = await Promise.all([
      fs.readFile(path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'), 'utf8'),
      fs.readFile(path.join(repoRoot, 'DEVELOPMENT_RULES.md'), 'utf8'),
    ]);

    expect(prTemplate).toContain('repo-relative path');
    expect(prTemplate).toContain('gitnexus/src/');
    expect(developmentRules).toContain('repo-relative path');
    expect(developmentRules).toContain('gitnexus/src/');
  });

  it('documents that canonical path must not point at temporary scripts in the PR template', async () => {
    const prTemplate = await fs.readFile(
      path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'),
      'utf8',
    );

    expect(prTemplate).toContain('temporary script');
    expect(prTemplate).toContain('debug entry point');
  });

  it('documents that compatibility notes must name the temporary path in the PR template', async () => {
    const [prTemplate, developmentRules] = await Promise.all([
      fs.readFile(path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'), 'utf8'),
      fs.readFile(path.join(repoRoot, 'DEVELOPMENT_RULES.md'), 'utf8'),
    ]);

    expect(prTemplate).toContain('Name the actual repo-relative shim');
    expect(prTemplate).toContain('gitnexus/src/');
    expect(developmentRules).toContain('repo-relative');
  });

  it('documents direct cutover risk guidance for compatibility layers in the PR template', async () => {
    const prTemplate = await fs.readFile(
      path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'),
      'utf8',
    );

    expect(prTemplate).toContain('Direct Cutover Risk:');
    expect(prTemplate).toContain('why direct cutover is unsafe right now');
  });

  it('documents migration status guidance in the PR template', async () => {
    const prTemplate = await fs.readFile(
      path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'),
      'utf8',
    );

    expect(prTemplate).toContain('Migration Status:');
    expect(prTemplate).toContain('If any old path, shim, or temporary migration/backfill/cutover script remains active');
    expect(prTemplate).toContain('temporary migration');
  });

  it('documents cleanup tracking guidance for active compatibility layers in the PR template', async () => {
    const prTemplate = await fs.readFile(
      path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'),
      'utf8',
    );

    expect(prTemplate).toContain('Cleanup Tracking:');
    expect(prTemplate).toContain('milestone, issue, or follow-up task');
    expect(prTemplate).toContain('GNX-');
  });

  it('documents cleanup tracking guidance for temporary scripts in the PR template', async () => {
    const prTemplate = await fs.readFile(
      path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'),
      'utf8',
    );

    expect(prTemplate).toContain('temporary layer or script still remains');
  });

  it('documents exit-condition guidance for temporary scripts in the PR template', async () => {
    const prTemplate = await fs.readFile(
      path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'),
      'utf8',
    );

    expect(prTemplate).toContain('Exit Condition:');
    expect(prTemplate).toContain('remaining temporary layer or script');
  });

  it('documents temporary script exit-condition guidance in the top-level rules', async () => {
    const developmentRules = await fs.readFile(
      path.join(repoRoot, 'DEVELOPMENT_RULES.md'),
      'utf8',
    );

    expect(developmentRules).toContain('migration-only scripts MUST carry an explicit removal condition or tracked follow-up');
    expect(developmentRules).toContain('named for their exact purpose');
  });

  it('documents temporary script cleanup-tracking and purpose-quality guidance in the top-level rules', async () => {
    const developmentRules = await fs.readFile(
      path.join(repoRoot, 'DEVELOPMENT_RULES.md'),
      'utf8',
    );

    expect(developmentRules).toContain('CLEANUP TRACKING:');
    expect(developmentRules).toContain('PURPOSE:');
    expect(developmentRules).toContain('specific purpose');
  });

  it('documents temporary script canonical-path guidance in the top-level rules', async () => {
    const developmentRules = await fs.readFile(
      path.join(repoRoot, 'DEVELOPMENT_RULES.md'),
      'utf8',
    );

    expect(developmentRules).toContain('CANONICAL PATH:');
    expect(developmentRules).toContain('stable product path');
    expect(developmentRules).toContain('repo-relative path');
  });

  it('documents repo-specific metric scope and time guidance in the top-level rules', async () => {
    const developmentRules = await fs.readFile(
      path.join(repoRoot, 'DEVELOPMENT_RULES.md'),
      'utf8',
    );

    expect(developmentRules).toContain('scope:');
    expect(developmentRules).toContain('time:');
  });

  it('documents concrete cleanup-tracking anchors in the top-level rules', async () => {
    const developmentRules = await fs.readFile(
      path.join(repoRoot, 'DEVELOPMENT_RULES.md'),
      'utf8',
    );

    expect(developmentRules).toContain('GNX-');
    expect(developmentRules).toContain('milestone 4');
  });

  it('documents exact-purpose naming guidance for temporary entry points in the PR template', async () => {
    const prTemplate = await fs.readFile(
      path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'),
      'utf8',
    );

    expect(prTemplate).toContain('temporary entry point');
    expect(prTemplate).toContain('exact-purpose name');
  });

  it('documents that temporary scripts must live in managed scripts paths in the PR template', async () => {
    const prTemplate = await fs.readFile(
      path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'),
      'utf8',
    );

    expect(prTemplate).toContain('managed `scripts/` path');
    expect(prTemplate).toContain('not under a product source path');
  });

  it('documents that mechanical splits need a concrete boundary benefit in the PR template', async () => {
    const prTemplate = await fs.readFile(
      path.join(repoRoot, '.github', 'PULL_REQUEST_TEMPLATE.md'),
      'utf8',
    );

    expect(prTemplate).toContain('mechanical split');
    expect(prTemplate).toContain('ownership boundaries, call-path clarity, testability, or change safety');
  });

  it('has a PR governance workflow that validates the PR body structure', async () => {
    const workflow = await fs.readFile(
      path.join(repoRoot, '.github', 'workflows', 'pr-governance.yml'),
      'utf8',
    );

    expect(workflow).toContain('fetch-depth: 0');
    expect(workflow).toContain('git fetch --no-tags origin "${{ github.base_ref }}:refs/remotes/origin/${{ github.base_ref }}"');
    expect(workflow).toContain('--base-ref "origin/${{ github.base_ref }}"');
    expect(workflow).toContain('repository-governance-check.mjs --mode pr-body');
    expect(workflow).toContain('pull_request');
  });

  it('surfaces the language-support CI gate in the PR report workflow', async () => {
    const workflow = await fs.readFile(
      path.join(repoRoot, '.github', 'workflows', 'ci-report.yml'),
      'utf8',
    );

    expect(workflow).toContain('language_support_result');
    expect(workflow).toContain('language=$(validate_result "$DIR/language_support_result")');
    expect(workflow).toContain('LANG_SUPPORT: ${{ steps.meta.outputs.language }}');
    expect(workflow).toContain('"$LANG_SUPPORT" == "success"');
    expect(workflow).toContain('Language Support');
  });

  it('downloads and renders the language-support summary artifact in the PR report workflow', async () => {
    const workflow = await fs.readFile(
      path.join(repoRoot, '.github', 'workflows', 'ci-report.yml'),
      'utf8',
    );

    expect(workflow).toContain("downloadArtifact('language-support-report'");
    expect(workflow).toContain('language-support-summary.md');
    expect(workflow).toContain('Language Support Summary');
  });
});
