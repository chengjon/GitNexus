# Detect Changes Host Compatibility Matrix Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the vague external-host compatibility TODO with a documented baseline matrix for detect_changes `cwd` passthrough research.

**Architecture:** Keep the slice docs-only. Gather official documentation signals for Claude Code, Codex, and Cursor, combine them with the repo’s existing Codex empirical evidence, record a bounded compatibility matrix, then update the worktree review and roadmap so the remaining open work is explicitly live probing rather than generic matrix debt.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Gather Research Inputs

**Files:**
- Verify: external official docs
- Verify: `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`

- [x] **Step 1: Re-read official Claude Code, Codex, and Cursor MCP documentation**
- [x] **Step 2: Re-read the repo’s existing Codex empirical evidence**

### Task 2: Record The Matrix Baseline

**Files:**
- Create: `docs/audits/2026-04-07-detect-changes-host-compatibility-matrix-baseline.md`
- Modify: `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`

- [x] **Step 1: Write the bounded host compatibility matrix baseline**
- [x] **Step 2: Update the review doc so the open item becomes live probes rather than an empty matrix placeholder**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/superpowers/specs/2026-04-07-detect-changes-host-compatibility-matrix-baseline-design.md`
- Create: `docs/superpowers/plans/2026-04-07-detect-changes-host-compatibility-matrix-baseline-implementation-plan.md`
- Create: `openspec/changes/2026-04-07-detect-changes-host-compatibility-matrix-baseline/.openspec.yaml`
- Create: `openspec/changes/2026-04-07-detect-changes-host-compatibility-matrix-baseline/proposal.md`
- Create: `openspec/changes/2026-04-07-detect-changes-host-compatibility-matrix-baseline/design.md`
- Create: `openspec/changes/2026-04-07-detect-changes-host-compatibility-matrix-baseline/specs/detect-changes-host-compatibility-matrix-baseline/spec.md`
- Create: `openspec/changes/2026-04-07-detect-changes-host-compatibility-matrix-baseline/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Register the research baseline as an OpenSpec change**
- [x] **Step 2: Update the roadmap with the new matrix-baseline status**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-07-detect-changes-host-compatibility-matrix-baseline`
  - result: `Change '2026-04-07-detect-changes-host-compatibility-matrix-baseline' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: low`
  - `changed_files: 68`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
