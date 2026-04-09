# Detect Changes Worktree Review Truth Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync the `detect_changes` worktree review doc with the current test reality.

**Architecture:** Update only the stale review doc, then verify the unit and native integration tests that the review now cites.

**Tech Stack:** Markdown, Vitest, OpenSpec

---

### Task 1: Review Truth Sync

**Files:**
- Modify: `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`

- [x] **Step 1: Remove the stale claim that explicit `cwd` priority testing is still missing**
- [x] **Step 2: Remove the stale claim that `fallback_reason` direct assertions are still missing**
- [x] **Step 3: Keep only the truly remaining host-compatibility follow-up items**

### Task 2: Verify The Referenced Evidence

**Files:**
- Verify: `gitnexus/test/unit/calltool-dispatch.test.ts`
- Verify: `gitnexus/test/integration/local-backend.test.ts`

- [x] **Step 1: Run the referenced unit test file**
- [x] **Step 2: Run the referenced native integration test file**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-07-detect-changes-worktree-review-truth-sync.md`
- Create: `docs/superpowers/specs/2026-04-07-detect-changes-worktree-review-truth-sync-design.md`
- Create: `docs/superpowers/plans/2026-04-07-detect-changes-worktree-review-truth-sync-implementation-plan.md`
- Create: `openspec/changes/2026-04-07-detect-changes-worktree-review-truth-sync/.openspec.yaml`
- Create: `openspec/changes/2026-04-07-detect-changes-worktree-review-truth-sync/proposal.md`
- Create: `openspec/changes/2026-04-07-detect-changes-worktree-review-truth-sync/design.md`
- Create: `openspec/changes/2026-04-07-detect-changes-worktree-review-truth-sync/specs/detect-changes-worktree-review-truth-sync/spec.md`
- Create: `openspec/changes/2026-04-07-detect-changes-worktree-review-truth-sync/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the new convergence status**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-07-detect-changes-worktree-review-truth-sync`
  - result: `Change '2026-04-07-detect-changes-worktree-review-truth-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: low`
  - `changed_files: 67`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
