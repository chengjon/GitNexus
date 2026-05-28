# Dual CLI Implementation Plan Truth Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync the execution state of completed dual-CLI implementation plans back to their corresponding OpenSpec task ledgers.

**Architecture:** Keep the slice doc-only. Use each corresponding OpenSpec `tasks.md` file as the execution-truth source, update the four implementation plan docs to reflect completion, then record the convergence in audit and roadmap artifacts.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm The Source Of Truth

**Files:**
- Verify: `openspec/changes/2026-04-06-dual-cli-doctor-doc-convergence/tasks.md`
- Verify: `openspec/changes/2026-04-06-dual-cli-doctor-worktree-guidance/tasks.md`
- Verify: `openspec/changes/2026-04-06-dual-cli-manual-mcp-command-convergence/tasks.md`
- Verify: `openspec/changes/2026-04-06-dual-cli-setup-context-convergence/tasks.md`

- [x] **Step 1: Re-read the four OpenSpec task ledgers**
- [x] **Step 2: Re-validate the four corresponding dual-CLI OpenSpec changes**

### Task 2: Sync The Historical Plans

**Files:**
- Modify: `docs/superpowers/plans/2026-04-06-dual-cli-doctor-doc-convergence-implementation-plan.md`
- Modify: `docs/superpowers/plans/2026-04-06-dual-cli-doctor-worktree-guidance-implementation-plan.md`
- Modify: `docs/superpowers/plans/2026-04-06-dual-cli-manual-mcp-command-convergence-implementation-plan.md`
- Modify: `docs/superpowers/plans/2026-04-06-dual-cli-setup-context-convergence-implementation-plan.md`

- [x] **Step 1: Mark completed steps as completed in the four implementation plans**
- [x] **Step 2: Add an execution-status sync note pointing to the corresponding OpenSpec task ledger**
- [x] **Step 3: Sync the doctor worktree guidance plan with the recorded option-only parsing follow-up**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-07-dual-cli-implementation-plan-truth-sync.md`
- Create: `docs/superpowers/specs/2026-04-07-dual-cli-implementation-plan-truth-sync-design.md`
- Create: `docs/superpowers/plans/2026-04-07-dual-cli-implementation-plan-truth-sync-implementation-plan.md`
- Create: `openspec/changes/2026-04-07-dual-cli-implementation-plan-truth-sync/.openspec.yaml`
- Create: `openspec/changes/2026-04-07-dual-cli-implementation-plan-truth-sync/proposal.md`
- Create: `openspec/changes/2026-04-07-dual-cli-implementation-plan-truth-sync/design.md`
- Create: `openspec/changes/2026-04-07-dual-cli-implementation-plan-truth-sync/specs/dual-cli-implementation-plan-truth-sync/spec.md`
- Create: `openspec/changes/2026-04-07-dual-cli-implementation-plan-truth-sync/tasks.md`
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
- `openspec validate 2026-04-07-dual-cli-implementation-plan-truth-sync`
  - result: `Change '2026-04-07-dual-cli-implementation-plan-truth-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: low`
  - `changed_files: 67`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
