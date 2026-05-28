# Dual CLI Doctor Doc Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the main user-entry docs with the current `gitnexus doctor --host codex|claude-code` behavior and the current `detect_changes` multi-repo/worktree guidance.

**Architecture:** Keep the repair doc-only and bounded. Update the top-level README, package README, and quick-start guides so they all use the real host name `claude-code`, explain when `repo` is required, and remind users to pass `cwd` when the active worktree does not match the MCP server cwd.

**Tech Stack:** Markdown, OpenSpec

---

> **Execution status sync note (2026-04-07):** Synced against `openspec/changes/2026-04-06-dual-cli-doctor-doc-convergence/tasks.md`.

### Task 1: Record The Documentation Slice

**Files:**
- Create: `openspec/changes/2026-04-06-dual-cli-doctor-doc-convergence/.openspec.yaml`
- Create: `openspec/changes/2026-04-06-dual-cli-doctor-doc-convergence/proposal.md`
- Create: `openspec/changes/2026-04-06-dual-cli-doctor-doc-convergence/design.md`
- Create: `openspec/changes/2026-04-06-dual-cli-doctor-doc-convergence/tasks.md`
- Create: `openspec/changes/2026-04-06-dual-cli-doctor-doc-convergence/specs/dual-cli-doctor-doc-convergence/spec.md`

- [x] **Step 1: Record the remaining dual-CLI documentation drift**
- [x] **Step 2: Capture the bounded docs-only convergence scope**

### Task 2: Update Shared Entry Docs

**Files:**
- Modify: `README.md`
- Modify: `gitnexus/README.md`
- Modify: `docs/gitnexus-quick-start-guide.md`
- Modify: `docs/ai-cli-local-quick-start.md`

- [x] **Step 1: Replace stale `doctor --host claude` examples with `doctor --host claude-code`**
- [x] **Step 2: Add explicit `repo` and `cwd` guidance where the docs teach `detect_changes` or doctor verification**
- [x] **Step 3: Align quick-start output expectations with current `analyze` default versus `--with-context` behavior**

### Task 3: Validate The Slice

**Files:**
- Modify: `openspec/changes/2026-04-06-dual-cli-doctor-doc-convergence/tasks.md`

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Review the scoped doc diff and status for this slice**
