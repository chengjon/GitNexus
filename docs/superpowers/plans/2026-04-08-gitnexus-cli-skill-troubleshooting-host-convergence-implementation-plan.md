# GitNexus CLI Skill Troubleshooting Host Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge the `gitnexus-cli` skill troubleshooting wording so its stale-index recovery guidance explicitly matches the repository's current dual-CLI host framing for Claude Code and Codex.

**Architecture:** Keep the slice docs-only. Reuse the already-closed dual-CLI freshness convergence and the current quick-start wording as the truth source, then update both the source skill and package skill copy, record the convergence in audit/OpenSpec/roadmap artifacts, and avoid reopening any runtime behavior.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm The Truth Source

**Files:**
- Verify: `.claude/skills/gitnexus/gitnexus-cli/SKILL.md`
- Verify: `gitnexus/skills/gitnexus-cli.md`
- Verify: `docs/audits/2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence.md`
- Verify: `docs/gitnexus-quick-start-guide.md`

- [x] **Step 1: Re-read the current source skill troubleshooting wording**
- [x] **Step 2: Re-read the current package skill troubleshooting wording**
- [x] **Step 3: Reconfirm the already-closed dual-CLI freshness convergence**
- [x] **Step 4: Reconfirm the quick-start dual-CLI wording used as the current host truth source**

### Task 2: Sync The Troubleshooting Wording

**Files:**
- Modify: `.claude/skills/gitnexus/gitnexus-cli/SKILL.md`
- Modify: `gitnexus/skills/gitnexus-cli.md`

- [x] **Step 1: Remove the stale single-host "Restart Claude Code" wording**
- [x] **Step 2: Replace it with host-neutral reconnect wording**
- [x] **Step 3: Keep source skill and package skill wording aligned**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence.md`
- Create: `docs/superpowers/specs/2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence-design.md`
- Create: `docs/superpowers/plans/2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence-implementation-plan.md`
- Create: `openspec/changes/2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence/proposal.md`
- Create: `openspec/changes/2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence/design.md`
- Create: `openspec/changes/2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence/specs/gitnexus-cli-skill-troubleshooting-host-convergence/spec.md`
- Create: `openspec/changes/2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the troubleshooting convergence**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence`
  - result: `Change '2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: critical`
  - `changed_files: 107`
  - `changed_count: 269`
  - `affected_count: 56`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
  - note: this worktree-wide result reflects unrelated pre-existing code and
    doc changes outside the current documentation-only convergence slice
