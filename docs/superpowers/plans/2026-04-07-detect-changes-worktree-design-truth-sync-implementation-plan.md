# Detect Changes Worktree Design Truth Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync the detect_changes worktree design and review docs with the current implementation and test reality.

**Architecture:** Keep the slice doc-only. Reconfirm the current implementation and review findings from source files and tests, update the historical design doc to document the implemented contract, then narrow the review doc so the only remaining open item is external host compatibility research.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm Current Reality

**Files:**
- Verify: `gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts`
- Verify: `gitnexus/src/storage/git.ts`
- Verify: `gitnexus/test/unit/calltool-dispatch.test.ts`
- Verify: `gitnexus/test/integration/local-backend.test.ts`
- Verify: `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`

- [x] **Step 1: Re-read the current implementation and helper contract**
- [x] **Step 2: Re-read the focused test and review evidence**

### Task 2: Sync Design And Review Docs

**Files:**
- Modify: `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-design.md`
- Modify: `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`

- [x] **Step 1: Update the design doc to reflect the implemented `params.cwd || process.cwd()` contract**
- [x] **Step 2: Clarify git command semantics and current `fallback_reason` / metadata boundaries**
- [x] **Step 3: Narrow the review doc so only external host compatibility research remains open**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-07-detect-changes-worktree-design-truth-sync.md`
- Create: `docs/superpowers/specs/2026-04-07-detect-changes-worktree-design-truth-sync-design.md`
- Create: `docs/superpowers/plans/2026-04-07-detect-changes-worktree-design-truth-sync-implementation-plan.md`
- Create: `openspec/changes/2026-04-07-detect-changes-worktree-design-truth-sync/.openspec.yaml`
- Create: `openspec/changes/2026-04-07-detect-changes-worktree-design-truth-sync/proposal.md`
- Create: `openspec/changes/2026-04-07-detect-changes-worktree-design-truth-sync/design.md`
- Create: `openspec/changes/2026-04-07-detect-changes-worktree-design-truth-sync/specs/detect-changes-worktree-design-truth-sync/spec.md`
- Create: `openspec/changes/2026-04-07-detect-changes-worktree-design-truth-sync/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec truth-sync change**
- [x] **Step 3: Update the roadmap with the closed residual**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-07-detect-changes-worktree-design-truth-sync`
  - result: `Change '2026-04-07-detect-changes-worktree-design-truth-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: low`
  - `changed_files: 68`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
