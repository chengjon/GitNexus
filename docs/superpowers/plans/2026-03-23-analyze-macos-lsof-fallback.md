# Analyze macOS `lsof` Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend GitNexus analyze lock-holder detection so macOS and other non-Linux environments can quiesce local `gitnexus mcp` holders too.

**Architecture:** Keep Linux on the existing `/proc` fast path. For non-Linux hosts, shell out to `lsof` for the target `kuzu` path, map returned PIDs back to `gitnexus mcp` command lines, and reuse the same quiesce flow.

**Tech Stack:** TypeScript, Node.js, `child_process.execFile`, Vitest

---

### Task 1: Add failing unit coverage

**Files:**
- Modify: `gitnexus/test/unit/analyze-scope.test.ts`

- [ ] **Step 1: Add a failing test for `lsof` output parsing on non-Linux**
- [ ] **Step 2: Add a failing test for fallback dispatch when `process.platform !== 'linux'`**

### Task 2: Implement the fallback

**Files:**
- Modify: `gitnexus/src/cli/analyze.ts`

- [ ] **Step 1: Add a small `lsof` runner + parser helper**
- [ ] **Step 2: Route non-Linux lock-holder discovery through the new helper**
- [ ] **Step 3: Keep Linux `/proc` behavior unchanged**

### Task 3: Verify

**Files:**
- Test: `gitnexus/test/unit/analyze-scope.test.ts`

- [ ] **Step 1: Run the targeted unit test file**
- [ ] **Step 2: Re-run `npm run build`**
