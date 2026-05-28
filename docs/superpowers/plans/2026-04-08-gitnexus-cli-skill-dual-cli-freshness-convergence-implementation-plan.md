# GitNexus CLI Skill Dual CLI Freshness Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge the `gitnexus-cli` skill docs so they explicitly match the repository's current dual-CLI freshness guidance for Claude Code and Codex.

**Architecture:** Keep the slice docs-only. Reuse the dual-CLI freshness audit, current quick-start wording, and fixture wording as the truth source, then update both the source skill and package skill copy, record the convergence in audit/OpenSpec/roadmap artifacts, and avoid reopening any runtime behavior.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm The Truth Source

**Files:**
- Verify: `.claude/skills/gitnexus/gitnexus-cli/SKILL.md`
- Verify: `gitnexus/skills/gitnexus-cli.md`
- Verify: `docs/audits/2026-04-07-dual-cli-post-mutation-freshness-guidance.md`
- Verify: `docs/gitnexus-quick-start-guide.md`

- [x] **Step 1: Re-read the current source skill wording**
- [x] **Step 2: Re-read the current package skill wording**
- [x] **Step 3: Reconfirm the dual-CLI freshness guidance conclusion**
- [x] **Step 4: Reconfirm the quick-start wording used as the current truth source**

### Task 2: Sync The Skill Docs

**Files:**
- Modify: `.claude/skills/gitnexus/gitnexus-cli/SKILL.md`
- Modify: `gitnexus/skills/gitnexus-cli.md`

- [x] **Step 1: Keep the Claude Code automatic freshness note**
- [x] **Step 2: Add the Codex manual rerun note**
- [x] **Step 3: Keep source skill and package skill wording aligned**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence.md`
- Create: `docs/superpowers/specs/2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence-design.md`
- Create: `docs/superpowers/plans/2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence-implementation-plan.md`
- Create: `openspec/changes/2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence/.openspec.yaml`
- Create: `openspec/changes/2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence/proposal.md`
- Create: `openspec/changes/2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence/design.md`
- Create: `openspec/changes/2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence/specs/gitnexus-cli-skill-dual-cli-freshness-convergence/spec.md`
- Create: `openspec/changes/2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence/tasks.md`
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
- `openspec validate 2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence`
  - result: `Change '2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: critical`
  - `changed_files: 107`
  - `changed_count: 269`
  - `affected_count: 54`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
  - note: this worktree-wide result reflects unrelated pre-existing code and
    doc changes outside the current documentation-only convergence slice
