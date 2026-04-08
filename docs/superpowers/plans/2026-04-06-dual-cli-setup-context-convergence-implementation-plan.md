# Dual CLI Setup Context Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the GitNexus CLI setup help and repo-local agent context aligned with the actual dual-CLI support surface for Claude Code and Codex.

**Architecture:** Lock the `gitnexus setup --help` host list with a failing integration test, then update the CLI description string. Refresh the repo-local `gitnexus/AGENTS.md`, `gitnexus/CLAUDE.md`, and packaged skill copies so their `detect_changes` guidance matches the current multi-repo and worktree rules.

**Tech Stack:** TypeScript, Vitest, Markdown, OpenSpec

---

> **Execution status sync note (2026-04-07):** Synced against `openspec/changes/2026-04-06-dual-cli-setup-context-convergence/tasks.md`.

### Task 1: Record The Slice

**Files:**
- Create: `openspec/changes/2026-04-06-dual-cli-setup-context-convergence/.openspec.yaml`
- Create: `openspec/changes/2026-04-06-dual-cli-setup-context-convergence/proposal.md`
- Create: `openspec/changes/2026-04-06-dual-cli-setup-context-convergence/design.md`
- Create: `openspec/changes/2026-04-06-dual-cli-setup-context-convergence/tasks.md`
- Create: `openspec/changes/2026-04-06-dual-cli-setup-context-convergence/specs/dual-cli-setup-context-convergence/spec.md`

- [x] **Step 1: Record the dual-CLI support surface mismatch**
- [x] **Step 2: Capture the setup-help and context-refresh scope**

### Task 2: Lock The Setup Help Output

**Files:**
- Modify: `gitnexus/test/integration/cli-e2e.test.ts`
- Modify: `gitnexus/src/cli/index.ts`

- [x] **Step 1: Write a failing integration test for `gitnexus setup --help`**
- [x] **Step 2: Run the targeted integration test and confirm it fails**
- [x] **Step 3: Update the setup command description to include Codex**
- [x] **Step 4: Re-run the targeted integration test and confirm it passes**

### Task 3: Refresh Repo-Local Context Artifacts

**Files:**
- Modify: `gitnexus/AGENTS.md`
- Modify: `gitnexus/CLAUDE.md`
- Modify: `gitnexus/.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md`
- Modify: `gitnexus/.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`

- [x] **Step 1: Refresh the `gitnexus/` repo-local AGENTS and CLAUDE GitNexus block**
- [x] **Step 2: Keep the generated `detect_changes` guidance aligned with explicit `repo` and worktree `cwd` usage**
- [x] **Step 3: Verify only the expected repo-local skill copies changed**

### Task 4: Validate The Slice

**Files:**
- Modify: `openspec/changes/2026-04-06-dual-cli-setup-context-convergence/tasks.md`

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run scoped status for the setup/context slice**
