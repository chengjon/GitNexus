# Repo Technical Debt Audit Broader Status Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add broader stale-doc / repair-order follow-up framing to the historical `2026-04-06-repo-technical-debt-and-residual-audit.md`.

**Architecture:** Keep the slice docs-only. Reuse the historical repo audit, the remediation roadmap, the existing host-validation status sync, and the later 2026-04-08 truth-sync records as the current-state truth source, then add bounded follow-up entrypoints and register the convergence in audit/OpenSpec/roadmap artifacts.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm The Truth Source

**Files:**
- Verify: `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md`
- Verify: `docs/audits/2026-04-08-repo-technical-debt-audit-status-sync.md`
- Verify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Re-read the historical 2026-04-06 repo audit**
- [x] **Step 2: Re-read the existing host-validation status sync**
- [x] **Step 3: Re-read the roadmap context**
- [x] **Step 4: Reconfirm the later 2026-04-08 truth-sync records that partially close the stale-doc repair direction**

### Task 2: Sync The Historical Audit Follow-Up Entry Points

**Files:**
- Modify: `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md`

- [x] **Step 1: Add a broader status-sync note near the top of the document**
- [x] **Step 2: Add follow-up guidance under Finding 2**
- [x] **Step 3: Add reader guidance before Recommended Repair Order**
- [x] **Step 4: Extend Output Mapping with the broader status-sync entrypoint**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-08-repo-technical-debt-audit-broader-status-sync.md`
- Create: `docs/superpowers/specs/2026-04-08-repo-technical-debt-audit-broader-status-sync-design.md`
- Create: `docs/superpowers/plans/2026-04-08-repo-technical-debt-audit-broader-status-sync-implementation-plan.md`
- Create: `openspec/changes/2026-04-08-repo-technical-debt-audit-broader-status-sync/.openspec.yaml`
- Create: `openspec/changes/2026-04-08-repo-technical-debt-audit-broader-status-sync/proposal.md`
- Create: `openspec/changes/2026-04-08-repo-technical-debt-audit-broader-status-sync/design.md`
- Create: `openspec/changes/2026-04-08-repo-technical-debt-audit-broader-status-sync/specs/repo-technical-debt-audit-broader-status-sync/spec.md`
- Create: `openspec/changes/2026-04-08-repo-technical-debt-audit-broader-status-sync/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec truth-sync change**
- [x] **Step 3: Update the roadmap with the broader status-sync entry**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-08-repo-technical-debt-audit-broader-status-sync`
  - result: `Change '2026-04-08-repo-technical-debt-audit-broader-status-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: critical`
  - `changed_files: 106`
  - `changed_count: 268`
  - `affected_count: 54`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
  - note: this worktree-wide result reflects unrelated pre-existing code changes
    outside the current documentation-only truth-sync slice
