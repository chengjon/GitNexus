# GitNexus Skills Review Status Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sync the historical `docs/gitnexus-skills-review.md` report to the repository's current merged reality without destroying its baseline review value.

**Architecture:** Keep the slice docs-only. Reuse the historical skills-review report, the remediation roadmap, the later 2026-04-08 skill-doc convergence records, and the current skill docs as the truth source, then add bounded status-sync framing and register the change in audit/OpenSpec/roadmap artifacts.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm The Truth Source

**Files:**
- Verify: `docs/gitnexus-skills-review.md`
- Verify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Re-read the historical skills-review report**
- [x] **Step 2: Re-read the roadmap context for later skill-doc convergence**
- [x] **Step 3: Reconfirm which recommendations have already been absorbed by the current skill docs**

### Task 2: Sync The Historical Review Framing

**Files:**
- Modify: `docs/gitnexus-skills-review.md`

- [x] **Step 1: Add a top-level status-sync note**
- [x] **Step 2: Add a current follow-up snapshot ahead of the old summary table**
- [x] **Step 3: Keep the original 2026-03-26 review table and suggestions intact for historical context**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-08-gitnexus-skills-review-status-sync.md`
- Create: `docs/superpowers/specs/2026-04-08-gitnexus-skills-review-status-sync-design.md`
- Create: `docs/superpowers/plans/2026-04-08-gitnexus-skills-review-status-sync-implementation-plan.md`
- Create: `openspec/changes/2026-04-08-gitnexus-skills-review-status-sync/proposal.md`
- Create: `openspec/changes/2026-04-08-gitnexus-skills-review-status-sync/design.md`
- Create: `openspec/changes/2026-04-08-gitnexus-skills-review-status-sync/specs/gitnexus-skills-review-status-sync/spec.md`
- Create: `openspec/changes/2026-04-08-gitnexus-skills-review-status-sync/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the historical-review status sync**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-08-gitnexus-skills-review-status-sync`
  - result: `Change '2026-04-08-gitnexus-skills-review-status-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: critical`
  - `changed_files: 110`
  - `changed_count: 271`
  - `affected_count: 56`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
  - note: this worktree-wide result reflects unrelated pre-existing code and
    doc changes outside the current documentation-only convergence slice
