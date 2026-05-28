# Host Detect Changes Guidance Structured Output Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add structured `data` to `host-detect-changes-guidance` checks while preserving the current detail string.

**Architecture:** Reuse the existing host-specific guidance semantics and expose them as structured `data` on `host-detect-changes-guidance`.

**Tech Stack:** TypeScript, Vitest, Markdown audit/OpenSpec docs

---

### Task 1: Add Failing Coverage

**Files:**
- Modify: `gitnexus/test/unit/doctor.test.ts`

- [x] **Step 1: Require structured Codex guidance data**
- [x] **Step 2: Require structured Claude Code guidance data**
- [x] **Step 3: Run the focused test and confirm it fails before implementation**

### Task 2: Implement Structured Output

**Files:**
- Modify: `gitnexus/src/cli/doctor.ts`

- [x] **Step 1: Add structured `data` to `host-detect-changes-guidance` checks**
- [x] **Step 2: Reuse existing host-specific guidance semantics**
- [x] **Step 3: Re-run focused tests and confirm they pass**
- [x] **Step 4: Re-run `npm run build` and confirm the additive contract compiles cleanly**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-07-host-detect-changes-guidance-structured-output.md`
- Create: `docs/superpowers/specs/2026-04-07-host-detect-changes-guidance-structured-output-design.md`
- Create: `docs/superpowers/plans/2026-04-07-host-detect-changes-guidance-structured-output-implementation-plan.md`
- Create: `openspec/changes/2026-04-07-host-detect-changes-guidance-structured-output/.openspec.yaml`
- Create: `openspec/changes/2026-04-07-host-detect-changes-guidance-structured-output/proposal.md`
- Create: `openspec/changes/2026-04-07-host-detect-changes-guidance-structured-output/design.md`
- Create: `openspec/changes/2026-04-07-host-detect-changes-guidance-structured-output/specs/host-detect-changes-guidance-structured-output/spec.md`
- Create: `openspec/changes/2026-04-07-host-detect-changes-guidance-structured-output/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the new convergence status**

### Task 4: Final Verification

**Files:**
- Verify: `gitnexus/src/cli/doctor.ts`
- Verify: target tests and governance artifacts

- [x] **Step 1: Run focused tests**
- [x] **Step 2: Run `npm run build`**
- [x] **Step 3: Validate the OpenSpec change**
- [x] **Step 4: Re-run GitNexus change detection for final scope review**
