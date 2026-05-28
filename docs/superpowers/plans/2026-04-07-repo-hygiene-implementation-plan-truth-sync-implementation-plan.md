# Repo Hygiene Implementation Plan Truth Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync the historical repo-hygiene implementation plan with the completion state already recorded in its OpenSpec task ledger.

**Architecture:** Keep the slice doc-only. Reconfirm that the original `repo-hygiene-doc-convergence` change is still valid and fully checked off, update the historical implementation plan to match that recorded state, then record the convergence in audit and roadmap artifacts.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm The Source Of Truth

**Files:**
- Verify: `openspec/changes/2026-04-06-repo-hygiene-doc-convergence/tasks.md`

- [x] **Step 1: Re-read the repo-hygiene OpenSpec task ledger**
- [x] **Step 2: Re-validate the corresponding OpenSpec change**

### Task 2: Sync The Historical Plan

**Files:**
- Modify: `docs/superpowers/plans/2026-04-06-repo-hygiene-doc-convergence-implementation-plan.md`

- [x] **Step 1: Add an execution-status sync note pointing at the OpenSpec task ledger**
- [x] **Step 2: Mark the three lingering historical commit steps as completed**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-07-repo-hygiene-implementation-plan-truth-sync.md`
- Create: `docs/superpowers/specs/2026-04-07-repo-hygiene-implementation-plan-truth-sync-design.md`
- Create: `docs/superpowers/plans/2026-04-07-repo-hygiene-implementation-plan-truth-sync-implementation-plan.md`
- Create: `openspec/changes/2026-04-07-repo-hygiene-implementation-plan-truth-sync/.openspec.yaml`
- Create: `openspec/changes/2026-04-07-repo-hygiene-implementation-plan-truth-sync/proposal.md`
- Create: `openspec/changes/2026-04-07-repo-hygiene-implementation-plan-truth-sync/design.md`
- Create: `openspec/changes/2026-04-07-repo-hygiene-implementation-plan-truth-sync/specs/repo-hygiene-implementation-plan-truth-sync/spec.md`
- Create: `openspec/changes/2026-04-07-repo-hygiene-implementation-plan-truth-sync/tasks.md`
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
- `openspec validate 2026-04-07-repo-hygiene-implementation-plan-truth-sync`
  - result: `Change '2026-04-07-repo-hygiene-implementation-plan-truth-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: low`
  - `changed_files: 67`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
