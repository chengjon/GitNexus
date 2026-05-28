# GitNexus Skills Modification Suggestions Status Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync the historical `docs/gitnexus-skills-modification-suggestions.md` to the repository's current merged reality without destroying its 2026-03-26 baseline value.

**Architecture:** Keep the slice docs-only. Reuse the historical suggestions record, the historical skills-review sync, the remediation roadmap, and the later 2026-04-08 skill-doc convergence records as the current-state truth source, then add bounded reader guidance and register the convergence in audit/OpenSpec/roadmap artifacts.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm The Truth Source

**Files:**
- Verify: `docs/gitnexus-skills-modification-suggestions.md`
- Verify: `docs/gitnexus-skills-review.md`
- Verify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Re-read the historical 2026-03-26 suggestions doc**
- [x] **Step 2: Re-read the current historical skills-review sync framing**
- [x] **Step 3: Re-read the current roadmap context for later skill-doc convergence**
- [x] **Step 4: Reconfirm which suggestions have already been absorbed by the current skill docs**

### Task 2: Sync The Historical Suggestions Doc

**Files:**
- Modify: `docs/gitnexus-skills-modification-suggestions.md`

- [x] **Step 1: Add a top-level status-sync note**
- [x] **Step 2: Add a current follow-up snapshot ahead of the old summary**
- [x] **Step 3: Keep the original 2026-03-26 suggestion body intact for historical context**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-08-gitnexus-skills-modification-suggestions-status-sync.md`
- Create: `docs/superpowers/specs/2026-04-08-gitnexus-skills-modification-suggestions-status-sync-design.md`
- Create: `docs/superpowers/plans/2026-04-08-gitnexus-skills-modification-suggestions-status-sync-implementation-plan.md`
- Create: `openspec/changes/2026-04-08-gitnexus-skills-modification-suggestions-status-sync/proposal.md`
- Create: `openspec/changes/2026-04-08-gitnexus-skills-modification-suggestions-status-sync/design.md`
- Create: `openspec/changes/2026-04-08-gitnexus-skills-modification-suggestions-status-sync/specs/gitnexus-skills-modification-suggestions-status-sync/spec.md`
- Create: `openspec/changes/2026-04-08-gitnexus-skills-modification-suggestions-status-sync/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec truth-sync change**
- [x] **Step 3: Update the roadmap with the historical-suggestions sync entry**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-08-gitnexus-skills-modification-suggestions-status-sync`
  - result: `Change '2026-04-08-gitnexus-skills-modification-suggestions-status-sync' is valid`
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
    doc changes outside the current documentation-only status-sync slice
