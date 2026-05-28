# GitNexus Impact Analysis Detect Changes Metadata Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge the `gitnexus-impact-analysis` source and package skill docs so their `gitnexus_detect_changes` metadata guidance matches the current path-resolution contract.

**Architecture:** Keep the slice docs-only. Reuse the current impact-analysis skill docs, the earlier skills-review drift note, and the `detect_changes` worktree metadata contract as the truth source, update both skill-doc surfaces, then record the convergence in audit/OpenSpec/roadmap artifacts.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm The Truth Source

**Files:**
- Verify: `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md`
- Verify: `gitnexus/skills/gitnexus-impact-analysis.md`
- Verify: `docs/gitnexus-skills-review.md`
- Verify: `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-design.md`

- [x] **Step 1: Re-read the current source impact-analysis skill wording**
- [x] **Step 2: Re-read the current package impact-analysis skill wording**
- [x] **Step 3: Reconfirm the earlier skills-review note that metadata guidance drift existed**
- [x] **Step 4: Reconfirm the current `detect_changes` metadata contract**

### Task 2: Sync The Impact Analysis Skill Docs

**Files:**
- Modify: `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md`
- Modify: `gitnexus/skills/gitnexus-impact-analysis.md`

- [x] **Step 1: Expand the workflow note so `detect_changes` path verification is explicit**
- [x] **Step 2: Add the metadata fields to the `detect_changes` example**
- [x] **Step 3: Add checklist guidance for checking `git_diff_path`, `process_cwd`, `path_resolution`, and `fallback_reason`**
- [x] **Step 4: Keep source skill and package skill wording aligned**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence.md`
- Create: `docs/superpowers/specs/2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence-design.md`
- Create: `docs/superpowers/plans/2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence-implementation-plan.md`
- Create: `openspec/changes/2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence/proposal.md`
- Create: `openspec/changes/2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence/design.md`
- Create: `openspec/changes/2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence/specs/gitnexus-impact-analysis-detect-changes-metadata-convergence/spec.md`
- Create: `openspec/changes/2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the impact-analysis convergence**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence`
  - result: `Change '2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence' is valid`
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
    doc changes outside the current documentation-only convergence slice
