# Language Support Structured Doctor Output Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Execution status sync (2026-04-08):** This historical implementation plan is complete. Treat [openspec/changes/2026-04-07-language-support-structured-doctor-output/tasks.md](/opt/claude/GitNexus/openspec/changes/2026-04-07-language-support-structured-doctor-output/tasks.md) as the execution-truth source.

**Goal:** Add structured `language-support` data to `doctor --json` and make the CI reporter consume it preferentially while remaining backward compatible.

**Architecture:** Extend `DoctorCheck` with optional `data`, emit runtime language-support rows on the `language-support` check, and update the compiled reporter to prefer that structured payload over parsing `detail`.

**Tech Stack:** TypeScript, Vitest, Markdown audit/OpenSpec docs

---

### Task 1: Add Failing Coverage

**Files:**
- Modify: `gitnexus/test/unit/doctor.test.ts`
- Modify: `gitnexus/test/unit/language-support-report.test.ts`

- [x] **Step 1: Require `runDoctor()` to emit structured `language-support` data**
- [x] **Step 2: Require the reporter to prefer structured `data` when present**
- [x] **Step 3: Run the focused tests and confirm they fail before implementation**

### Task 2: Implement Structured Output

**Files:**
- Modify: `gitnexus/src/cli/doctor.ts`
- Modify: `gitnexus/src/ci/language-support-report.ts`

- [x] **Step 1: Extend `DoctorCheck` with optional `data`**
- [x] **Step 2: Emit `LanguageSupportSummaryEntry[]` on the `language-support` check**
- [x] **Step 3: Make the reporter prefer `data` and keep legacy detail fallback**
- [x] **Step 4: Re-run the focused tests and confirm they pass**
- [x] **Step 5: Re-run `npm run build` and confirm the additive contract compiles cleanly**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-07-language-support-structured-doctor-output.md`
- Create: `docs/superpowers/specs/2026-04-07-language-support-structured-doctor-output-design.md`
- Create: `docs/superpowers/plans/2026-04-07-language-support-structured-doctor-output-implementation-plan.md`
- Create: `openspec/changes/2026-04-07-language-support-structured-doctor-output/.openspec.yaml`
- Create: `openspec/changes/2026-04-07-language-support-structured-doctor-output/proposal.md`
- Create: `openspec/changes/2026-04-07-language-support-structured-doctor-output/design.md`
- Create: `openspec/changes/2026-04-07-language-support-structured-doctor-output/specs/language-support-structured-doctor-output/spec.md`
- Create: `openspec/changes/2026-04-07-language-support-structured-doctor-output/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the new P2 convergence status**

### Task 4: Final Verification

**Files:**
- Verify: `gitnexus/src/cli/doctor.ts`
- Verify: `gitnexus/src/ci/language-support-report.ts`
- Verify: target tests and governance artifacts

- [x] **Step 1: Run focused tests**
- [x] **Step 2: Run `npm run build`**
- [x] **Step 3: Validate the OpenSpec change**
- [x] **Step 4: Re-run GitNexus change detection for final scope review**
