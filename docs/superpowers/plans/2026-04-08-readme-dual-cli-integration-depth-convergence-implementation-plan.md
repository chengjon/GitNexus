# README Dual CLI Integration Depth Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge `README.md` and `gitnexus/README.md` so the remaining host-specific wording describes `Claude Code` vs `Codex` as integration-depth and automation differences within one primary maintained CLI surface, not as a support-tier split.

**Architecture:** Keep the slice docs-only. Reuse the existing shared-README primary-pair conclusion plus the quick-start label-parity conclusion as truth sources, then narrow the change to wording updates in the support tables, notes, and manual setup headings before recording the convergence in audit/OpenSpec/roadmap artifacts.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm The Truth Source

**Files:**
- Verify: `README.md`
- Verify: `gitnexus/README.md`
- Verify: `docs/audits/2026-04-08-readme-primary-dual-cli-framing-convergence.md`
- Verify: `docs/audits/2026-04-08-quick-start-dual-cli-label-parity-convergence.md`
- Verify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Re-read the current root README host-support wording**
- [x] **Step 2: Re-read the current package README host-support wording**
- [x] **Step 3: Reconfirm the earlier dual-CLI framing and label-parity conclusions**

### Task 2: Sync The Shared README Wording

**Files:**
- Modify: `README.md`
- Modify: `gitnexus/README.md`

- [x] **Step 1: Rename the support-profile column to host-neutral integration wording**
- [x] **Step 2: Replace `Full` / `full support` wording with explicit integration labels**
- [x] **Step 3: Add a clarifying note that Codex remains part of the primary maintained CLI surface**
- [x] **Step 4: Keep command examples intact**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-08-readme-dual-cli-integration-depth-convergence.md`
- Create: `docs/superpowers/specs/2026-04-08-readme-dual-cli-integration-depth-convergence-design.md`
- Create: `docs/superpowers/plans/2026-04-08-readme-dual-cli-integration-depth-convergence-implementation-plan.md`
- Create: `openspec/changes/2026-04-08-readme-dual-cli-integration-depth-convergence/proposal.md`
- Create: `openspec/changes/2026-04-08-readme-dual-cli-integration-depth-convergence/design.md`
- Create: `openspec/changes/2026-04-08-readme-dual-cli-integration-depth-convergence/specs/readme-dual-cli-integration-depth-convergence/spec.md`
- Create: `openspec/changes/2026-04-08-readme-dual-cli-integration-depth-convergence/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the integration-depth convergence**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-08-readme-dual-cli-integration-depth-convergence`
  - result: `Change '2026-04-08-readme-dual-cli-integration-depth-convergence' is valid`
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
    doc changes outside the current documentation-only README wording slice
