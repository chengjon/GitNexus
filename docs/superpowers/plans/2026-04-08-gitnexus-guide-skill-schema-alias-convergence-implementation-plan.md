# GitNexus Guide Skill Schema Alias Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge the `gitnexus-guide` source and package skill docs so their alias and graph schema summaries match the current GitNexus contract.

**Architecture:** Keep the slice docs-only. Reuse the current guide skill docs, the earlier skills-review drift note, and the current MCP/schema contract as the truth source, update both skill-doc surfaces, then record the convergence in audit/OpenSpec/roadmap artifacts.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm The Truth Source

**Files:**
- Verify: `.claude/skills/gitnexus/gitnexus-guide/SKILL.md`
- Verify: `gitnexus/skills/gitnexus-guide.md`
- Verify: `docs/gitnexus-skills-review.md`

- [x] **Step 1: Re-read the current source guide skill wording**
- [x] **Step 2: Re-read the current package guide skill wording**
- [x] **Step 3: Reconfirm the earlier skills-review note that guide alias/schema drift existed**

### Task 2: Sync The Guide Skill Docs

**Files:**
- Modify: `.claude/skills/gitnexus/gitnexus-guide/SKILL.md`
- Modify: `gitnexus/skills/gitnexus-guide.md`

- [x] **Step 1: Add the `search` / `explore` alias note**
- [x] **Step 2: Expand the graph schema summary to the current node/edge set**
- [x] **Step 3: Keep source skill and package skill wording aligned**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-08-gitnexus-guide-skill-schema-alias-convergence.md`
- Create: `docs/superpowers/specs/2026-04-08-gitnexus-guide-skill-schema-alias-convergence-design.md`
- Create: `docs/superpowers/plans/2026-04-08-gitnexus-guide-skill-schema-alias-convergence-implementation-plan.md`
- Create: `openspec/changes/2026-04-08-gitnexus-guide-skill-schema-alias-convergence/proposal.md`
- Create: `openspec/changes/2026-04-08-gitnexus-guide-skill-schema-alias-convergence/design.md`
- Create: `openspec/changes/2026-04-08-gitnexus-guide-skill-schema-alias-convergence/specs/gitnexus-guide-skill-schema-alias-convergence/spec.md`
- Create: `openspec/changes/2026-04-08-gitnexus-guide-skill-schema-alias-convergence/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the guide-skill convergence**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-08-gitnexus-guide-skill-schema-alias-convergence`
  - result: `Change '2026-04-08-gitnexus-guide-skill-schema-alias-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: critical`
  - `changed_files: 108`
  - `changed_count: 270`
  - `affected_count: 56`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
  - note: this worktree-wide result reflects unrelated pre-existing code and
    doc changes outside the current documentation-only convergence slice
