# Quick Start Dual CLI Label Parity Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge `docs/gitnexus-quick-start-guide.md` so its per-host labels reflect the repository's current dual-CLI primary support framing without implying a support-tier split.

**Architecture:** Keep the slice docs-only. Reuse the current quick-start wording, the secondary-entrypoint host-framing conclusion, and the remediation roadmap as the truth source, then narrow the change to label parity plus one clarifying note and register the convergence in audit/OpenSpec/roadmap artifacts.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm The Truth Source

**Files:**
- Verify: `docs/gitnexus-quick-start-guide.md`
- Verify: `docs/audits/2026-04-08-secondary-entrypoint-host-framing-convergence.md`
- Verify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Re-read the current quick-start host section**
- [x] **Step 2: Re-read the secondary-entrypoint host-framing convergence record**
- [x] **Step 3: Reconfirm the roadmap treats `Claude Code + Codex` as the primary maintained pair**

### Task 2: Sync The Quick-Start Labels

**Files:**
- Modify: `docs/gitnexus-quick-start-guide.md`

- [x] **Step 1: Remove the single-host `Claude Code（完整支持）` label**
- [x] **Step 2: Add a clarifying note that differences are UX/automation differences, not support-tier differences**
- [x] **Step 3: Keep the command examples intact**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-08-quick-start-dual-cli-label-parity-convergence.md`
- Create: `docs/superpowers/specs/2026-04-08-quick-start-dual-cli-label-parity-convergence-design.md`
- Create: `docs/superpowers/plans/2026-04-08-quick-start-dual-cli-label-parity-convergence-implementation-plan.md`
- Create: `openspec/changes/2026-04-08-quick-start-dual-cli-label-parity-convergence/proposal.md`
- Create: `openspec/changes/2026-04-08-quick-start-dual-cli-label-parity-convergence/design.md`
- Create: `openspec/changes/2026-04-08-quick-start-dual-cli-label-parity-convergence/specs/quick-start-dual-cli-label-parity-convergence/spec.md`
- Create: `openspec/changes/2026-04-08-quick-start-dual-cli-label-parity-convergence/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the quick-start label convergence**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-08-quick-start-dual-cli-label-parity-convergence`
  - result: `Change '2026-04-08-quick-start-dual-cli-label-parity-convergence' is valid`
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
    doc changes outside the current documentation-only label convergence slice
