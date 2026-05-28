# Upstream Shared Doc Replay Status Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record the latest `upstream/main` shared-doc replay baseline after the refreshed fetch, update historical pointers to the newest status-sync record, and confirm whether a new safe replay slice exists.

**Architecture:** Keep the slice docs-only. Reuse the existing 2026-04-06 upstream baseline and replay-review records as the historical source, refresh the live upstream commit and divergence numbers, reconfirm the current shared hotspot file set, and record that latest state in audit/OpenSpec/roadmap artifacts without replaying upstream wording.

**Tech Stack:** Markdown, OpenSpec, git metadata

---

### Task 1: Refresh The Upstream Baseline

**Files:**
- Verify: `docs/audits/2026-04-06-upstream-doc-governance-convergence-baseline.md`
- Verify: `docs/audits/2026-04-06-upstream-shared-doc-replay-review.md`
- Verify: `README.md`
- Verify: `AGENTS.md`
- Verify: `CLAUDE.md`
- Verify: `gitnexus/README.md`

- [x] **Step 1: Fetch upstream and confirm the latest `upstream/main` commit**
- [x] **Step 2: Recompute the current divergence count**
- [x] **Step 3: Reconfirm the current shared hotspot file set**

### Task 2: Record The Latest Status Sync

**Files:**
- Modify: `docs/audits/2026-04-06-upstream-doc-governance-convergence-baseline.md`
- Modify: `docs/audits/2026-04-06-upstream-shared-doc-replay-review.md`
- Create: `docs/audits/2026-04-08-upstream-shared-doc-replay-status-sync.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Add latest-status pointers to the historical 2026-04-06 reports**
- [x] **Step 2: Write the 2026-04-08 upstream replay status-sync audit**
- [x] **Step 3: Update the remediation roadmap with the refreshed baseline**

### Task 3: Register Governance Artifacts

**Files:**
- Create: `docs/superpowers/specs/2026-04-08-upstream-shared-doc-replay-status-sync-design.md`
- Create: `docs/superpowers/plans/2026-04-08-upstream-shared-doc-replay-status-sync-implementation-plan.md`
- Create: `openspec/changes/2026-04-08-upstream-shared-doc-replay-status-sync/proposal.md`
- Create: `openspec/changes/2026-04-08-upstream-shared-doc-replay-status-sync/design.md`
- Create: `openspec/changes/2026-04-08-upstream-shared-doc-replay-status-sync/specs/upstream-shared-doc-replay-status-sync/spec.md`
- Create: `openspec/changes/2026-04-08-upstream-shared-doc-replay-status-sync/tasks.md`

- [x] **Step 1: Write the design and implementation-plan artifacts**
- [x] **Step 2: Register the OpenSpec change**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-08-upstream-shared-doc-replay-status-sync`
  - result: `Change '2026-04-08-upstream-shared-doc-replay-status-sync' is valid`
- `git rev-list --left-right --count upstream/main...HEAD`
  - result: `285 209`
- `git diff --name-only upstream/main -- README.md AGENTS.md CLAUDE.md gitnexus/README.md`
  - result:
    - `AGENTS.md`
    - `CLAUDE.md`
    - `README.md`
    - `gitnexus/README.md`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: critical`
  - `changed_files: 112`
  - `changed_count: 272`
  - `affected_count: 56`
  - `git_repo_path: /opt/claude/GitNexus`
  - `git_diff_path: /opt/claude/GitNexus`
  - `process_cwd: /opt/claude/GitNexus`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
  - note: this worktree-wide result reflects unrelated pre-existing code and
    doc changes outside the current review-only upstream baseline status-sync slice
