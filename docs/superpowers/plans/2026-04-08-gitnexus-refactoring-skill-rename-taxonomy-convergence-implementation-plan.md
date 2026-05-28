# GitNexus Refactoring Skill Rename Taxonomy Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge the `gitnexus-refactoring` source and package skill docs so their rename confidence wording matches the current `graph` / `text_search` taxonomy.

**Architecture:** Keep the slice docs-only. Reuse the current refactoring skill docs and the current rename taxonomy as the truth source, update both skill-doc surfaces, then record the convergence in audit/OpenSpec/roadmap artifacts.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm The Truth Source

**Files:**
- Verify: `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`
- Verify: `gitnexus/skills/gitnexus-refactoring.md`

- [x] **Step 1: Re-read the current source refactoring skill wording**
- [x] **Step 2: Re-read the current package refactoring skill wording**
- [x] **Step 3: Reconfirm the current rename taxonomy uses `graph` / `text_search`**

### Task 2: Sync The Refactoring Skill Docs

**Files:**
- Modify: `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`
- Modify: `gitnexus/skills/gitnexus-refactoring.md`

- [x] **Step 1: Replace stale `ast_search` wording with `text_search`**
- [x] **Step 2: Keep all rename examples aligned with the current taxonomy**
- [x] **Step 3: Keep source skill and package skill wording aligned**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence.md`
- Create: `docs/superpowers/specs/2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence-design.md`
- Create: `docs/superpowers/plans/2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence-implementation-plan.md`
- Create: `openspec/changes/2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence/proposal.md`
- Create: `openspec/changes/2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence/design.md`
- Create: `openspec/changes/2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence/specs/gitnexus-refactoring-skill-rename-taxonomy-convergence/spec.md`
- Create: `openspec/changes/2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the refactoring-skill convergence**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence`
  - result: `Change '2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: critical`
  - `changed_files: 110`
  - `changed_count: 271`
  - `affected_count: 56`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
  - note: this worktree-wide result reflects unrelated pre-existing code and
    doc changes outside the current documentation-only convergence slice
