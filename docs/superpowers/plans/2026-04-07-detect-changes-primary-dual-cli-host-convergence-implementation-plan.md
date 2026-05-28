# Detect Changes Primary Dual CLI Host Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge `detect_changes` host-governance docs so the repository’s required primary support surface is explicitly `Codex + Claude Code`, while Cursor remains optional external follow-up.

**Architecture:** Keep the slice docs-only. Reuse the existing Codex empirical evidence and Claude Code live-probe result as the operational truth source, record the current machine’s lack of a Cursor CLI, then rewrite the baseline/review/roadmap wording so optional external-host research no longer appears as blocking debt.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Confirm The Current Host Truth

**Files:**
- Verify: `docs/audits/2026-04-07-detect-changes-host-compatibility-matrix-baseline.md`
- Verify: `docs/audits/2026-04-07-detect-changes-claude-code-cwd-live-probe.md`
- Verify: `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`

- [x] **Step 1: Re-read the current Codex / Claude Code host evidence**
- [x] **Step 2: Confirm the current machine has no directly callable Cursor CLI**

### Task 2: Record The Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-07-detect-changes-primary-dual-cli-host-convergence.md`
- Create: `docs/superpowers/specs/2026-04-07-detect-changes-primary-dual-cli-host-convergence-design.md`
- Create: `docs/superpowers/plans/2026-04-07-detect-changes-primary-dual-cli-host-convergence-implementation-plan.md`
- Create: `openspec/changes/2026-04-07-detect-changes-primary-dual-cli-host-convergence/.openspec.yaml`
- Create: `openspec/changes/2026-04-07-detect-changes-primary-dual-cli-host-convergence/proposal.md`
- Create: `openspec/changes/2026-04-07-detect-changes-primary-dual-cli-host-convergence/design.md`
- Create: `openspec/changes/2026-04-07-detect-changes-primary-dual-cli-host-convergence/specs/detect-changes-primary-dual-cli-host-convergence/spec.md`
- Create: `openspec/changes/2026-04-07-detect-changes-primary-dual-cli-host-convergence/tasks.md`

- [x] **Step 1: Write the new audit note**
- [x] **Step 2: Register the docs-only OpenSpec change**

### Task 3: Sync The Existing Source Documents

**Files:**
- Modify: `docs/audits/2026-04-07-detect-changes-host-compatibility-matrix-baseline.md`
- Modify: `docs/audits/2026-04-07-detect-changes-claude-code-cwd-live-probe.md`
- Modify: `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Reclassify Cursor / other clients as optional external follow-up**
- [x] **Step 2: Mark the required Codex + Claude Code primary support surface as closed**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-07-detect-changes-primary-dual-cli-host-convergence`
  - result: `Change '2026-04-07-detect-changes-primary-dual-cli-host-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: low`
  - `changed_files: 74`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
