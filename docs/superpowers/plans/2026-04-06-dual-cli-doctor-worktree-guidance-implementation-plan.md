# Dual CLI Doctor Worktree Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface explicit `detect_changes` worktree and `cwd` guidance for the primary CLI hosts directly in `gitnexus doctor --host codex|claude-code`.

**Architecture:** Add a dedicated doctor guidance check for targeted dual-CLI host inspections instead of burying the advice only in audits and generated context files. Lock the behavior with failing unit tests, then implement the smallest possible `runDoctor()` change.

**Tech Stack:** TypeScript, Vitest, Markdown, OpenSpec

---

> **Execution status sync note (2026-04-07):** Synced against `openspec/changes/2026-04-06-dual-cli-doctor-worktree-guidance/tasks.md`.

### Task 1: Record The Slice

**Files:**
- Create: `openspec/changes/2026-04-06-dual-cli-doctor-worktree-guidance/.openspec.yaml`
- Create: `openspec/changes/2026-04-06-dual-cli-doctor-worktree-guidance/proposal.md`
- Create: `openspec/changes/2026-04-06-dual-cli-doctor-worktree-guidance/design.md`
- Create: `openspec/changes/2026-04-06-dual-cli-doctor-worktree-guidance/tasks.md`
- Create: `openspec/changes/2026-04-06-dual-cli-doctor-worktree-guidance/specs/dual-cli-doctor-worktree-guidance/spec.md`

- [x] **Step 1: Record the host-diagnostics gap**
- [x] **Step 2: Capture the scoped doctor/test change**

### Task 2: Add Failing Doctor Tests

**Files:**
- Modify: `gitnexus/test/unit/doctor.test.ts`

- [x] **Step 1: Write a failing Codex doctor test for explicit worktree/cwd guidance**
- [x] **Step 2: Write a failing Claude Code doctor test for explicit worktree/cwd guidance**
- [x] **Step 3: Run the targeted doctor tests and confirm they fail before implementation**

### Task 3: Implement Doctor Guidance

**Files:**
- Modify: `gitnexus/src/cli/doctor.ts`
- Test: `gitnexus/test/unit/doctor.test.ts`

- [x] **Step 1: Add a host-specific guidance check for Codex and Claude Code**
- [x] **Step 2: Keep the guidance scoped to targeted host inspections**
- [x] **Step 3: Fix option-only `doctorCommand()` parsing for Commander invocations without a positional path**
- [x] **Step 4: Re-run the targeted doctor tests and confirm they pass**

### Task 4: Validate The Slice

**Files:**
- Modify: `openspec/changes/2026-04-06-dual-cli-doctor-worktree-guidance/tasks.md`

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run scoped repository status for the doctor guidance slice**
