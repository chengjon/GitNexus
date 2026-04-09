# Kuzu Dependency Exit Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current `kuzu` / `kuzu-wasm` tracked-exception state into a concrete exit-strategy slice with verified candidate disposition and track-specific exit criteria.

**Architecture:** Keep this slice documentation-only. Reuse the existing audit and exact-pinning work as inputs, verify the current package and repository status, map the real local usage surface, and define when the repo should keep pinning versus reopen a replacement or upgrade effort. Preserve the rule that any CLI-side dependency change must keep both Claude Code and Codex working.

**Tech Stack:** Markdown, OpenSpec, npm metadata, GitHub repository metadata, GitNexus code-intelligence context

---

### Task 1: Record The Exit-Strategy Slice

**Files:**
- Create: `openspec/changes/2026-04-06-kuzu-dependency-exit-strategy/.openspec.yaml`
- Create: `openspec/changes/2026-04-06-kuzu-dependency-exit-strategy/proposal.md`
- Create: `openspec/changes/2026-04-06-kuzu-dependency-exit-strategy/design.md`
- Create: `openspec/changes/2026-04-06-kuzu-dependency-exit-strategy/tasks.md`
- Create: `openspec/changes/2026-04-06-kuzu-dependency-exit-strategy/specs/kuzu-dependency-exit-strategy/spec.md`

- [x] **Step 1: Create a dedicated follow-up OpenSpec change after review and exact pinning**
- [x] **Step 2: Bound the slice to candidate disposition and exit criteria, not dependency replacement**

### Task 2: Write The Decision Follow-Up

**Files:**
- Create: `docs/audits/2026-04-06-kuzu-dependency-exit-strategy.md`
- Modify: `docs/audits/2026-04-06-kuzu-dependency-review.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Record the verified package and repository status for the current lines and alternate wasm candidate**
- [x] **Step 2: Map the local CLI and web usage surface to estimate migration difficulty**
- [x] **Step 3: Define explicit exit criteria for CLI native and web wasm separately**
- [x] **Step 4: Carry forward the dual-CLI support rule for any future CLI dependency migration**

### Task 3: Validate The Slice

**Files:**
- Modify: `openspec/changes/2026-04-06-kuzu-dependency-exit-strategy/tasks.md`

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Review the scoped diff and status for the exit-strategy slice**
