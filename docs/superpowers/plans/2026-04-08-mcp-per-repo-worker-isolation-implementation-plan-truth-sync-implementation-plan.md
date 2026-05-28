# MCP Per-Repo Worker Isolation Implementation Plan Truth Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync the historical `mcp-per-repo-worker-isolation` implementation and status docs to the repository's current merged reality.

**Architecture:** Keep the slice docs-only. Reuse the current router/worker source/test anchors, the later archived `mcp-process-management` OpenSpec docs, and the technical-debt roadmap as the completion truth source, then update the historical implementation/status docs and register the truth-sync in audit/OpenSpec/roadmap artifacts.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm The Truth Source

**Files:**
- Verify: `docs/superpowers/plans/2026-04-04-mcp-per-repo-worker-isolation-implementation-plan.md`
- Verify: `docs/mcp-per-repo-worker-isolation-design.md`
- Verify: `docs/sigusr1-cooperative-release-design.md`
- Verify: `openspec/changes/archive/2026-04-06-mcp-process-management/proposal.md`
- Verify: `openspec/changes/archive/2026-04-06-mcp-process-management/design.md`
- Verify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Re-read the historical implementation plan**
- [x] **Step 2: Re-read the current router/worker design docs**
- [x] **Step 3: Re-read the later archived docs that depend on router/worker isolation**
- [x] **Step 4: Reconfirm the planned router/worker source and test anchors now exist in the repo**

### Task 2: Sync The Historical Docs

**Files:**
- Modify: `docs/superpowers/plans/2026-04-04-mcp-per-repo-worker-isolation-implementation-plan.md`
- Modify: `docs/mcp-per-repo-worker-isolation-design.md`
- Modify: `docs/sigusr1-cooperative-release-design.md`

- [x] **Step 1: Mark completed steps as completed in the historical implementation plan**
- [x] **Step 2: Add an execution-status sync note and historical verification summary**
- [x] **Step 3: Update the current-architecture status language in the related design docs**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync.md`
- Create: `docs/superpowers/specs/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync-design.md`
- Create: `docs/superpowers/plans/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync-implementation-plan.md`
- Create: `openspec/changes/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync/.openspec.yaml`
- Create: `openspec/changes/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync/proposal.md`
- Create: `openspec/changes/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync/design.md`
- Create: `openspec/changes/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync/specs/mcp-per-repo-worker-isolation-implementation-plan-truth-sync/spec.md`
- Create: `openspec/changes/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec truth-sync change**
- [x] **Step 3: Update the roadmap with the closed false-open residual**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync`
  - result: `Change '2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - MCP note: transport unavailable in the current session
  - fallback: current-repo `LocalBackend` `detect_changes` handler direct call
  - `risk_level: critical`
  - `changed_files: 83`
  - `changed_count: 246`
  - `affected_count: 54`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
  - note: this worktree-wide result reflects unrelated pre-existing code changes
    outside the current documentation-only truth-sync slice
