# CI Report Language Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the PR sticky report surface the existing `language-support` CI gate so PR summaries no longer omit a real merge gate.

**Architecture:** Keep the existing `pr-meta` artifact contract and repair the report consumer. Add one workflow-text regression test, then update `ci-report.yml` to read, render, and gate on `language_support_result`. If the same gate is threaded through shell env blocks as `LANG`, rename that carrier to `LANG_SUPPORT` without changing the artifact field, then record the residual fix in audit/OpenSpec/roadmap docs.

**Tech Stack:** GitHub Actions workflow YAML, Vitest, OpenSpec, Markdown governance docs

**Execution status sync (2026-04-08):** This historical implementation plan is complete. Treat [`openspec/changes/2026-04-07-ci-report-language-support-convergence/tasks.md`](/opt/claude/GitNexus/openspec/changes/2026-04-07-ci-report-language-support-convergence/tasks.md) as the execution-truth source.

---

### Task 1: Lock The Missing PR Report Signal With A Failing Test

**Files:**
- Modify: `gitnexus/test/unit/repository-governance-integration.test.ts`
- Verify against: `.github/workflows/ci-report.yml`

- [x] **Step 1: Add a regression test that requires the PR report workflow to read and display language support**

Add assertions that `.github/workflows/ci-report.yml` contains:

```ts
expect(workflow).toContain('language_support_result');
expect(workflow).toContain('language=$(validate_result "$DIR/language_support_result")');
expect(workflow).toContain('Language Support');
```

- [x] **Step 2: Run the targeted test and confirm it fails before implementation**

Run:

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/repository-governance-integration.test.ts --config vitest.config.ts
```

Expected: FAIL because `ci-report.yml` does not yet read or render `language_support_result`.

### Task 2: Repair The PR Report Workflow

**Files:**
- Modify: `.github/workflows/ci-report.yml`
- Test: `gitnexus/test/unit/repository-governance-integration.test.ts`

- [x] **Step 1: Read the language-support status from the PR metadata artifact**

Extend the `Read PR metadata` step so it writes:

```bash
echo "language=$(validate_result "$DIR/language_support_result")" >> "$GITHUB_OUTPUT"
```

- [x] **Step 2: Thread the language-support result into the report build step**

Extend the `Build report` step env with:

```bash
LANG: ${{ steps.meta.outputs.language }}
```

- [x] **Step 3: Include Language Support in the overall status and pipeline table**

Update the shell report builder so it:

```bash
if [[ "$QUALITY" == "success" && "$UNIT" == "success" && "$LANG" == "success" && "$INTEG" == "success" ]]; then
```

and adds:

```bash
echo "| $(status_icon "$LANG") Language Support | \`${LANG}\` | doctor --json + language-support-report |"
```

- [x] **Step 4: Re-run the targeted test and confirm it passes**

Run:

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/repository-governance-integration.test.ts --config vitest.config.ts
```

Expected: PASS.

### Task 3: Record The Residual Fix

**Files:**
- Create: `docs/audits/2026-04-07-ci-report-language-support-convergence.md`
- Create: `openspec/changes/2026-04-07-ci-report-language-support-convergence/proposal.md`
- Create: `openspec/changes/2026-04-07-ci-report-language-support-convergence/design.md`
- Create: `openspec/changes/2026-04-07-ci-report-language-support-convergence/specs/ci-report-language-support-convergence/spec.md`
- Create: `openspec/changes/2026-04-07-ci-report-language-support-convergence/tasks.md`
- Create: `openspec/changes/2026-04-07-ci-report-language-support-convergence/.openspec.yaml`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**

Capture:

- the existing `language-support` gate in `CI`
- the missing row in `ci-report.yml`
- why this is a PR-report residual rather than a `doctor` defect
- the verification commands used in this slice

- [x] **Step 2: Add the OpenSpec change**

Record the bounded capability:

- PR report must surface the `language-support` gate
- PR report overall status must include that gate

- [x] **Step 3: Update the roadmap**

Add one short status note under the current completed remediation items stating
that PR report convergence now includes the `language-support` gate.

### Task 4: Final Verification

**Files:**
- Verify: `.github/workflows/ci-report.yml`
- Verify: `gitnexus/test/unit/repository-governance-integration.test.ts`
- Verify: `docs/audits/2026-04-07-ci-report-language-support-convergence.md`
- Verify: `openspec/changes/2026-04-07-ci-report-language-support-convergence/*`
- Verify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Run the focused workflow regression test**

Run:

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/repository-governance-integration.test.ts --config vitest.config.ts
```

Expected: PASS.

- [x] **Step 2: Validate the new OpenSpec change**

Run:

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-07-ci-report-language-support-convergence
```

Expected: `Change '2026-04-07-ci-report-language-support-convergence' is valid`.

- [x] **Step 3: Run GitNexus change detection for final scope review**

**Verification results:**
- `npx vitest run test/unit/repository-governance-integration.test.ts --config vitest.config.ts`
  - PASS
- `openspec validate 2026-04-07-ci-report-language-support-convergence`
  - result: `Change '2026-04-07-ci-report-language-support-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: low`
  - `changed_files: 57`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`

Run:

```bash
cd /opt/claude/GitNexus
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

Expected: low-risk doc/workflow/test-only scope with no unexpected process impact.
