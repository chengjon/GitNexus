# Dual CLI Manual MCP Command Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep Claude Code and Codex manual MCP registration instructions aligned with the real platform command entry on both Windows and non-Windows hosts.

**Architecture:** Reuse `getDefaultMcpEntry()` as the command truth source and add a small shared formatter for manual CLI registration strings. Update the Claude Code and Codex adapters to render user-facing manual commands from that shared source, then sync the repo docs to the same cross-platform behavior.

**Tech Stack:** TypeScript, Vitest, Markdown, OpenSpec

---

> **Execution status sync note (2026-04-07):** Synced against `openspec/changes/2026-04-06-dual-cli-manual-mcp-command-convergence/tasks.md`.

### Task 1: Record The Change Scope

**Files:**
- Create: `openspec/changes/2026-04-06-dual-cli-manual-mcp-command-convergence/.openspec.yaml`
- Create: `openspec/changes/2026-04-06-dual-cli-manual-mcp-command-convergence/proposal.md`
- Create: `openspec/changes/2026-04-06-dual-cli-manual-mcp-command-convergence/design.md`
- Create: `openspec/changes/2026-04-06-dual-cli-manual-mcp-command-convergence/tasks.md`
- Create: `openspec/changes/2026-04-06-dual-cli-manual-mcp-command-convergence/specs/dual-cli-manual-mcp-command-convergence/spec.md`

- [x] **Step 1: Write the OpenSpec change summary**
- [x] **Step 2: Record the dual-CLI convergence requirement and verification tasks**

### Task 2: Add Failing Tests For Manual Command Rendering

**Files:**
- Modify: `gitnexus/test/unit/host-adapters.test.ts`

- [x] **Step 1: Write a failing test for Claude Code manual instructions on Windows**
- [x] **Step 2: Run the targeted test to confirm it fails for the expected reason**
- [x] **Step 3: Write a failing test for Codex manual instructions on Windows**
- [x] **Step 4: Run the targeted test to confirm it fails for the expected reason**

### Task 3: Implement Shared Manual Command Formatting

**Files:**
- Modify: `gitnexus/src/cli/host-adapters/shared.ts`
- Modify: `gitnexus/src/cli/host-adapters/claude-code.ts`
- Modify: `gitnexus/src/cli/host-adapters/codex.ts`
- Test: `gitnexus/test/unit/host-adapters.test.ts`

- [x] **Step 1: Add a shared formatter that converts `McpEntry` into a shell-safe manual command string**
- [x] **Step 2: Update `createClaudeCodeAdapter` to render manual instructions from `getDefaultMcpEntry()`**
- [x] **Step 3: Update `createCodexAdapter` to render manual instructions from `getDefaultMcpEntry()`**
- [x] **Step 4: Run the targeted host adapter tests and confirm they pass**

### Task 4: Sync Shared Docs To The Same Behavior

**Files:**
- Modify: `README.md`
- Modify: `gitnexus/README.md`
- Modify: `docs/gitnexus-quick-start-guide.md`

- [x] **Step 1: Update the Claude Code manual MCP examples to show the cross-platform command**
- [x] **Step 2: Update the Codex manual MCP examples to show the same cross-platform rule**
- [x] **Step 3: Keep the wording scoped to Claude Code and Codex only**

### Task 5: Validate The Slice

**Files:**
- Modify: `openspec/changes/2026-04-06-dual-cli-manual-mcp-command-convergence/tasks.md`

- [x] **Step 1: Run the targeted host adapter test file**
- [x] **Step 2: Validate the new OpenSpec change**
- [x] **Step 3: Re-run scoped `git status` and confirm only intended files changed for this slice**
