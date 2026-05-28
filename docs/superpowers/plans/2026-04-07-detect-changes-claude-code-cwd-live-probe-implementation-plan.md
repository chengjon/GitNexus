# Detect Changes Claude Code CWD Live Probe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record a live-probe result for whether Claude Code automatically injects `cwd` into detect_changes-like MCP tool calls.

**Architecture:** Use a temporary MCP probe server outside the repo to capture raw tool-call arguments, run the probe once from the repo and once from a temporary git worktree, then update the review and roadmap docs so Claude Code moves from “unverified” to “current CLI probed”.

**Tech Stack:** Markdown, OpenSpec, Claude Code CLI, temporary MCP probe server

---

### Task 1: Run The Live Probe

**Files:**
- Verify: temporary probe outputs under `/tmp`

- [x] **Step 1: Run a Claude Code probe from the repository directory**
- [x] **Step 2: Run the same Claude Code probe from a temporary git worktree**
- [x] **Step 3: Confirm the raw server log recorded only `scope`, not `cwd`**

### Task 2: Record The Result

**Files:**
- Create: `docs/audits/2026-04-07-detect-changes-claude-code-cwd-live-probe.md`
- Modify: `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`

- [x] **Step 1: Write the Claude Code live-probe audit note**
- [x] **Step 2: Update the review doc so Claude Code is no longer grouped under generic unverified host debt**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/superpowers/specs/2026-04-07-detect-changes-claude-code-cwd-live-probe-design.md`
- Create: `docs/superpowers/plans/2026-04-07-detect-changes-claude-code-cwd-live-probe-implementation-plan.md`
- Create: `openspec/changes/2026-04-07-detect-changes-claude-code-cwd-live-probe/.openspec.yaml`
- Create: `openspec/changes/2026-04-07-detect-changes-claude-code-cwd-live-probe/proposal.md`
- Create: `openspec/changes/2026-04-07-detect-changes-claude-code-cwd-live-probe/design.md`
- Create: `openspec/changes/2026-04-07-detect-changes-claude-code-cwd-live-probe/specs/detect-changes-claude-code-cwd-live-probe/spec.md`
- Create: `openspec/changes/2026-04-07-detect-changes-claude-code-cwd-live-probe/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Register the live probe as an OpenSpec change**
- [x] **Step 2: Update the roadmap with the narrowed remaining host debt**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-07-detect-changes-claude-code-cwd-live-probe`
  - result: `Change '2026-04-07-detect-changes-claude-code-cwd-live-probe' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: low`
  - `changed_files: 74`
  - `changed_symbols: 0`
  - `affected_processes: 0`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
