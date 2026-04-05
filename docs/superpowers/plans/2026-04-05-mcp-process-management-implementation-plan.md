# MCP Process Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement MCP process management end-to-end: runtime registry, lifecycle-aware worker management, `gitnexus mcp ps/gc/drain`, and analyze-time drain-first quiesce behavior.

**Architecture:** Keep the current router/worker topology and add an advisory global runtime registry under `~/.gitnexus/runtime/mcp-processes`. Build the feature in two coherent slices: first publish/inspect/clean lifecycle metadata, then add cooperative repo-worker drain so `analyze` and `gitnexus mcp drain` can ask the exact worker holding a repo to release and exit before signal fallback.

**Tech Stack:** TypeScript, Node filesystem/process APIs, Commander, Vitest, OpenSpec

---

## Planned File Structure

**Create:**
- `gitnexus/src/runtime/mcp-process-config.ts`
- `gitnexus/src/runtime/mcp-process-registry.ts`
- `gitnexus/test/unit/mcp-process-registry.test.ts`

**Modify:**
- `gitnexus/src/cli/index.ts`
- `gitnexus/src/cli/mcp.ts`
- `gitnexus/src/cli/analyze.ts`
- `gitnexus/src/cli/platform-process-scan.ts`
- `gitnexus/src/mcp/repo-worker-protocol.ts`
- `gitnexus/src/mcp/repo-worker-manager.ts`
- `gitnexus/src/mcp/repo-worker.ts`
- `gitnexus/test/integration/repo-worker.test.ts`
- `gitnexus/test/unit/mcp-command.test.ts`
- `gitnexus/test/unit/repo-worker-manager.test.ts`

### Task 1: Runtime Registry Primitives

**Files:**
- Create: `gitnexus/src/runtime/mcp-process-config.ts`
- Create: `gitnexus/src/runtime/mcp-process-registry.ts`
- Test: `gitnexus/test/unit/mcp-process-registry.test.ts`

- [x] Write the failing registry tests
- [x] Run `npx vitest run test/unit/mcp-process-registry.test.ts` and verify failure
- [x] Implement session ID, record path, atomic write, list, health derivation, and cleanup helpers
- [x] Re-run `npx vitest run test/unit/mcp-process-registry.test.ts`

### Task 2: Worker Bootstrap Ownership

**Files:**
- Modify: `gitnexus/src/mcp/repo-worker-protocol.ts`
- Modify: `gitnexus/src/mcp/repo-worker-manager.ts`
- Modify: `gitnexus/src/mcp/repo-worker.ts`
- Test: `gitnexus/test/unit/repo-worker-manager.test.ts`

- [x] Keep the existing worker-manager tests red for the new `sessionId` and `routerPid` bootstrap shape
- [x] Add the minimal bootstrap protocol fields and thread them through the manager
- [x] Re-run `npx vitest run test/unit/repo-worker-manager.test.ts`

### Task 3: MCP Operator Commands

**Files:**
- Modify: `gitnexus/src/cli/mcp.ts`
- Modify: `gitnexus/src/cli/index.ts`
- Test: `gitnexus/test/unit/mcp-command.test.ts`

- [x] Keep the `mcp ps` and `mcp gc` command tests red
- [x] Add command exports and registry-backed JSON/text output
- [x] Wire `gitnexus mcp ps` and `gitnexus mcp gc` subcommands in Commander
- [x] Re-run `npx vitest run test/unit/mcp-command.test.ts`

### Task 4: Registry-Aware Analyze Cleanup

**Files:**
- Modify: `gitnexus/src/cli/analyze.ts`
- Modify: `gitnexus/src/cli/platform-process-scan.ts`

- [x] Add registry-aware holder classification without removing the existing process-scan fallback
- [x] Surface registry-backed details in analyze timeout reporting
- [x] Run focused analyze-related tests if new coverage is added

### Task 5: Validation

**Files:**
- Modify as needed based on failing verification

- [x] Run `npx vitest run test/unit/mcp-process-registry.test.ts test/unit/repo-worker-manager.test.ts test/unit/mcp-command.test.ts`
- [x] Run `npm run build`
- [x] Run `openspec change validate mcp-process-management`
- [ ] Run GitNexus staged change detection before commit if the MCP transport is healthy, otherwise document the blocker explicitly

### Task 6: Cooperative Drain Protocol

**Files:**
- Modify: `gitnexus/src/runtime/mcp-process-config.ts`
- Modify: `gitnexus/src/mcp/repo-worker-protocol.ts`
- Modify: `gitnexus/src/mcp/repo-worker-manager.ts`
- Modify: `gitnexus/src/mcp/repo-worker.ts`
- Test: `gitnexus/test/unit/repo-worker-manager.test.ts`
- Test: `gitnexus/test/integration/repo-worker.test.ts`

- [x] Write failing tests for worker-ready/drain lifecycle and router-loss shutdown behavior
- [x] Run the targeted worker lifecycle tests and confirm the failures are for missing drain semantics
- [x] Add worker lifecycle messages and manager coordination for cooperative drain
- [x] Add worker-side draining state, in-flight request tracking, and owner-PID exit handling
- [x] Re-run the targeted worker lifecycle tests

### Task 7: CLI Drain Command

**Files:**
- Modify: `gitnexus/src/cli/index.ts`
- Modify: `gitnexus/src/cli/mcp.ts`
- Modify: `gitnexus/src/cli/platform-process-scan.ts`
- Test: `gitnexus/test/unit/mcp-command.test.ts`
- Test: `gitnexus/test/unit/analyze-scope.test.ts`

- [x] Write failing tests for `gitnexus mcp drain --repo <name>` and drain helper behavior
- [x] Run the drain-focused unit tests and confirm they fail for the expected missing exports/logic
- [x] Implement registry-backed repo-worker drain lookup, signaling, and reporting
- [x] Wire the `mcp drain` subcommand in Commander
- [x] Re-run the drain-focused unit tests

### Task 8: Analyze Drain-First Quiesce

**Files:**
- Modify: `gitnexus/src/cli/analyze.ts`
- Modify: `gitnexus/src/cli/platform-process-scan.ts`
- Test: `gitnexus/test/unit/analyze-scope.test.ts`

- [x] Write failing tests for analyze preferring cooperative drain before signal fallback
- [x] Run the analyze drain tests and confirm the failure path
- [x] Implement cooperative drain requests, acknowledgement polling, and fallback-to-SIGTERM behavior
- [x] Re-run the analyze drain tests

### Task 9: Final Verification

**Files:**
- Modify as needed based on failing verification

- [x] Run `npx vitest run test/unit/mcp-process-registry.test.ts test/unit/repo-worker-manager.test.ts test/unit/mcp-command.test.ts test/unit/analyze-scope.test.ts`
- [x] Run `npx vitest run --config vitest.integration.native.config.ts test/integration/repo-worker.test.ts test/integration/router-backend-worker.test.ts test/integration/mcp-worker-isolation.test.ts`
- [x] Run `npm run build`
- [x] Run `openspec change validate mcp-process-management`
- [ ] Run GitNexus staged change detection before commit if the MCP transport is healthy, otherwise document the blocker explicitly
