# GitNexus PR Review Skill Path Verification Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge the `gitnexus-pr-review` package skill so it explicitly matches the source skill's current worktree path-verification guidance.

**Architecture:** Keep the slice docs-only. Reuse the current source skill and the prior pr-review detect-changes convergence audit as the truth source, update only the package skill copy, then record the convergence in audit/OpenSpec/roadmap artifacts.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm The Truth Source

**Files:**
- Verify: `.claude/skills/gitnexus/gitnexus-pr-review/SKILL.md`
- Verify: `gitnexus/skills/gitnexus-pr-review.md`
- Verify: `docs/audits/2026-04-07-pr-review-skill-detect-changes-guidance-convergence.md`

- [x] **Step 1: Re-read the current source skill wording**
- [x] **Step 2: Re-read the current package skill wording**
- [x] **Step 3: Reconfirm the earlier pr-review detect-changes convergence direction**

### Task 2: Sync The Package Skill

**Files:**
- Modify: `gitnexus/skills/gitnexus-pr-review.md`

- [x] **Step 1: Restore the worktree checklist wording that requires checking `path_resolution`**
- [x] **Step 2: Restore the `Path verification` review dimension**
- [x] **Step 3: Reconfirm the package skill now matches the source skill semantics**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-08-gitnexus-pr-review-skill-path-verification-convergence.md`
- Create: `docs/superpowers/specs/2026-04-08-gitnexus-pr-review-skill-path-verification-convergence-design.md`
- Create: `docs/superpowers/plans/2026-04-08-gitnexus-pr-review-skill-path-verification-convergence-implementation-plan.md`
- Create: `openspec/changes/2026-04-08-gitnexus-pr-review-skill-path-verification-convergence/proposal.md`
- Create: `openspec/changes/2026-04-08-gitnexus-pr-review-skill-path-verification-convergence/design.md`
- Create: `openspec/changes/2026-04-08-gitnexus-pr-review-skill-path-verification-convergence/specs/gitnexus-pr-review-skill-path-verification-convergence/spec.md`
- Create: `openspec/changes/2026-04-08-gitnexus-pr-review-skill-path-verification-convergence/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the skill-doc convergence**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-08-gitnexus-pr-review-skill-path-verification-convergence`
  - result: `Change '2026-04-08-gitnexus-pr-review-skill-path-verification-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: critical`
  - `changed_files: 107`
  - `changed_count: 269`
  - `affected_count: 56`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
  - note: this worktree-wide result reflects unrelated pre-existing code and
    doc changes outside the current documentation-only convergence slice
