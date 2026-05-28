# CI Report Language Support Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Execution status sync (2026-04-08):** This historical implementation plan is complete. Treat [openspec/changes/2026-04-07-ci-report-language-support-summary/tasks.md](/opt/claude/GitNexus/openspec/changes/2026-04-07-ci-report-language-support-summary/tasks.md) as the execution-truth source.

**Goal:** Surface the existing language-support markdown summary inside the PR sticky report so maintainers can see optional grammar status without leaving the report.

**Architecture:** Reuse the current `doctor --json` plus `language-support-report.mjs` producer path. Persist the generated markdown as a dedicated CI artifact, then make `ci-report.yml` download and render it in a collapsed section. Keep the change workflow-only and lock it with workflow-text regression tests.

**Tech Stack:** GitHub Actions workflow YAML, Vitest, Markdown audit/OpenSpec docs

---

### Task 1: Add A Failing Workflow Regression Test

**Files:**
- Modify: `gitnexus/test/unit/repository-governance-integration.test.ts`
- Verify against: `.github/workflows/ci.yml`
- Verify against: `.github/workflows/ci-report.yml`

- [x] **Step 1: Add assertions for the uploaded language-support artifact**

Add test coverage that requires:

```ts
expect(ciWorkflow).toContain('language-support-report');
expect(ciWorkflow).toContain('language-support-summary.md');
expect(ciWorkflow).toContain('tee language-support-summary.md');
```

- [x] **Step 2: Add assertions for PR report download and rendering**

Add test coverage that requires:

```ts
expect(reportWorkflow).toContain("downloadArtifact('language-support-report'");
expect(reportWorkflow).toContain('Language Support Summary');
expect(reportWorkflow).toContain('language-support-summary.md');
```

- [x] **Step 3: Run the targeted test and confirm it fails before implementation**

Run:

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/repository-governance-integration.test.ts --config vitest.config.ts
```

Expected: FAIL because the workflows do not yet persist or render the summary artifact.

### Task 2: Persist The Summary In CI

**Files:**
- Modify: `.github/workflows/ci.yml`
- Test: `gitnexus/test/unit/repository-governance-integration.test.ts`

- [x] **Step 1: Write the summary markdown to disk during the language-support job**

Change the existing summary step so it writes:

```bash
node scripts/ci/language-support-report.mjs doctor-output.json | tee language-support-summary.md
```

- [x] **Step 2: Upload a dedicated artifact for downstream PR reporting**

Add an artifact upload step for:

```yaml
name: language-support-report
path: |
  gitnexus/doctor-output.json
  gitnexus/language-support-summary.md
```

### Task 3: Render The Summary In The PR Report

**Files:**
- Modify: `.github/workflows/ci-report.yml`
- Test: `gitnexus/test/unit/repository-governance-integration.test.ts`

- [x] **Step 1: Download the new language-support artifact**

Extend the download step with:

```js
await downloadArtifact('language-support-report', path.join(temp, 'dl'));
```

- [x] **Step 2: Locate the summary file during report assembly**

Add shell logic to resolve:

```bash
LANG_SUPPORT_SUMMARY=$(find "$DIR/language-support-report" -name "language-support-summary.md" -type f 2>/dev/null | head -1)
```

- [x] **Step 3: Render the summary in a collapsed details block**

Append to the report body:

```bash
if [ -n "$LANG_SUPPORT_SUMMARY" ] && [ -f "$LANG_SUPPORT_SUMMARY" ]; then
  echo "### Language Support Details"
  echo ""
  echo "<details>"
  echo "<summary>Language Support Summary</summary>"
  echo ""
  cat "$LANG_SUPPORT_SUMMARY"
  echo ""
  echo "</details>"
  echo ""
fi
```

- [x] **Step 4: Re-run the targeted workflow regression test and confirm it passes**

Run:

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/repository-governance-integration.test.ts --config vitest.config.ts
```

Expected: PASS.

### Task 4: Record The Follow-Up Slice

**Files:**
- Create: `docs/audits/2026-04-07-ci-report-language-support-summary.md`
- Create: `openspec/changes/2026-04-07-ci-report-language-support-summary/.openspec.yaml`
- Create: `openspec/changes/2026-04-07-ci-report-language-support-summary/proposal.md`
- Create: `openspec/changes/2026-04-07-ci-report-language-support-summary/design.md`
- Create: `openspec/changes/2026-04-07-ci-report-language-support-summary/specs/ci-report-language-support-summary/spec.md`
- Create: `openspec/changes/2026-04-07-ci-report-language-support-summary/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**

Record:

- the previous state where PR report only showed gate status
- the new artifact handoff
- why this reuses the existing validated summary rather than recomputing it

- [x] **Step 2: Add the OpenSpec change**

Capture the new requirement that PR reports surface the existing language
support summary when present.

- [x] **Step 3: Update the roadmap**

Add one short status note that the PR report now carries both the
`language-support` gate and its summary artifact.

### Task 5: Final Verification

**Files:**
- Verify: `.github/workflows/ci.yml`
- Verify: `.github/workflows/ci-report.yml`
- Verify: `gitnexus/test/unit/repository-governance-integration.test.ts`
- Verify: `docs/audits/2026-04-07-ci-report-language-support-summary.md`
- Verify: `openspec/changes/2026-04-07-ci-report-language-support-summary/*`
- Verify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Run the focused regression tests**

Run:

```bash
cd /opt/claude/GitNexus/gitnexus
npx vitest run test/unit/repository-governance-integration.test.ts test/unit/language-support-report.test.ts --config vitest.config.ts
```

Expected: PASS.

- [x] **Step 2: Validate the new OpenSpec change**

Run:

```bash
cd /opt/claude/GitNexus
openspec validate 2026-04-07-ci-report-language-support-summary
```

Expected: `Change '2026-04-07-ci-report-language-support-summary' is valid`.

- [x] **Step 3: Re-run GitNexus change detection for final scope review**

Run:

```bash
cd /opt/claude/GitNexus
gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})
```

Expected: low-risk workflow/test/doc-only scope with no unexpected process impact.
