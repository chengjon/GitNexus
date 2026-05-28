# Analyze MCP Lock Conflict Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `gitnexus analyze` automatically clear conflicting `gitnexus mcp` readers that hold the target Kuzu database lock.

**Architecture:** Keep the change localized to the analyze CLI. Before any writable Kuzu open, analyze will discover `gitnexus mcp` processes holding the target `.gitnexus/kuzu` file, terminate only those processes, wait for descriptors to clear, then continue. Tests cover process discovery, filtering, and the no-op path when nothing holds the file.

**Tech Stack:** TypeScript, Node.js `fs/promises`, `/proc` inspection on Linux, Vitest

---

### Task 1: Add failing tests for analyze-side lock-holder handling

**Files:**
- Modify: `gitnexus/test/unit/analyze-scope.test.ts`

- [ ] **Step 1: Write failing tests**
- [ ] **Step 2: Run the unit test file and confirm the new expectations fail**

### Task 2: Implement targeted MCP lock-holder detection

**Files:**
- Modify: `gitnexus/src/cli/analyze.ts`

- [ ] **Step 1: Add helpers to inspect `/proc/<pid>/fd` and `/proc/<pid>/cmdline`**
- [ ] **Step 2: Filter to `gitnexus mcp` processes that actually hold the target Kuzu file**
- [ ] **Step 3: Add termination + wait helpers with bounded timeout and clear logging**

### Task 3: Integrate helper into analyze flow

**Files:**
- Modify: `gitnexus/src/cli/analyze.ts`

- [ ] **Step 1: Run the quiesce logic before cached-embedding restore / writable Kuzu init**
- [ ] **Step 2: Keep behavior best-effort when no MCP holders exist**
- [ ] **Step 3: Preserve existing cleanup and error paths**

### Task 4: Verify

**Files:**
- Test: `gitnexus/test/unit/analyze-scope.test.ts`

- [ ] **Step 1: Run the targeted unit test file**
- [ ] **Step 2: Run any adjacent CLI/analyze unit tests if needed**
