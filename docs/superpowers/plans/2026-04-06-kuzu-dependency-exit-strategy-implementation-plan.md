# Kuzu Dependency Exit Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> Status note: historical implementation plan only. The later
> `2026-04-06-kuzu-dependency-exit-strategy` audit/OpenSpec slice is the
> authoritative completion record for what was actually captured, validated,
> and kept as the follow-up dependency-governance baseline. Treat the checked
> steps below as historical planning context, not as the current operator task
> queue.

Historical implementation-plan note: the `Goal`, `Architecture`, and checked
task breakdown below remain the 2026-04-06 planning-time baseline. Read them
as historical planning context unless the later dependency-governance records
explicitly reassert them as still current.

**Goal:** Turn the current `kuzu` / `kuzu-wasm` tracked-exception state into a concrete exit-strategy slice with verified candidate disposition and track-specific exit criteria.

**Architecture:** Keep this slice documentation-only. Reuse the existing audit and exact-pinning work as inputs, verify the current package and repository status, map the real local usage surface, and define when the repo should keep pinning versus reopen a replacement or upgrade effort. Preserve the rule that any CLI-side dependency change must keep both Claude Code and Codex working.

**Tech Stack:** Markdown, OpenSpec, npm metadata, GitHub repository metadata, GitNexus code-intelligence context

---

Reader note: the checked tasks below preserve the 2026-04-06 planning-time
execution breakdown. They are historical plan artifacts, not a current live
task board, because the later exit-strategy audit/OpenSpec records now define
the retained dependency-governance follow-up state.

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
