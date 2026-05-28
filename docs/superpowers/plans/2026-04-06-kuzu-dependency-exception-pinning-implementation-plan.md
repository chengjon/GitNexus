# Kuzu Dependency Exception Pinning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> Status note: historical implementation plan only. The later
> `2026-04-06-kuzu-dependency-exception-pinning` audit/OpenSpec slice is the
> authoritative completion record for what was actually pinned and retained as
> the tracked-exception mitigation. Treat the checked steps below as historical
> planning context, not as the current operator task queue.

Historical implementation-plan note: the `Goal`, `Architecture`, and checked
task breakdown below remain the 2026-04-06 planning-time baseline. Read them
as historical planning context unless the later exception-pinning records
explicitly reassert them as still current.

**Goal:** Convert the current `kuzu` and `kuzu-wasm` direct dependencies from semver ranges to explicit pinned exceptions while the dedicated replacement review remains open.

**Architecture:** Keep the change minimal and reversible. Update only the direct dependency declarations in `package.json` and the root package entries in lockfiles so the repository stops widening these deprecated lines via `^` ranges. Do not reinstall or regenerate the full lockfiles in this slice.

**Tech Stack:** JSON, OpenSpec, npm lockfile metadata

---

Reader note: the checked tasks below preserve the 2026-04-06 planning-time
execution breakdown. They are historical plan artifacts, not a current live
task board, because the later exception-pinning audit/OpenSpec records now
define the retained tracked-exception mitigation state.

### Task 1: Record The Pinning Slice

**Files:**
- Create: `openspec/changes/2026-04-06-kuzu-dependency-exception-pinning/.openspec.yaml`
- Create: `openspec/changes/2026-04-06-kuzu-dependency-exception-pinning/proposal.md`
- Create: `openspec/changes/2026-04-06-kuzu-dependency-exception-pinning/design.md`
- Create: `openspec/changes/2026-04-06-kuzu-dependency-exception-pinning/tasks.md`
- Create: `openspec/changes/2026-04-06-kuzu-dependency-exception-pinning/specs/kuzu-dependency-exception-pinning/spec.md`

- [x] **Step 1: Record why exact pinning is the current tracked-exception mitigation**
- [x] **Step 2: Bound the slice to direct-dependency declaration changes only**

### Task 2: Apply Direct Dependency Pinning

**Files:**
- Modify: `gitnexus/package.json`
- Modify: `gitnexus/package-lock.json`
- Modify: `gitnexus-web/package.json`
- Modify: `gitnexus-web/package-lock.json`
- Modify: `docs/audits/2026-04-06-kuzu-dependency-review.md`

- [x] **Step 1: Pin CLI `kuzu` to an exact version**
- [x] **Step 2: Pin web `kuzu-wasm` to an exact version**
- [x] **Step 3: Sync the root lockfile package metadata with the exact direct dependency declarations**
- [x] **Step 4: Update the dependency review audit to state that exact pinning is now the current mitigation**

### Task 3: Validate The Slice

**Files:**
- Modify: `openspec/changes/2026-04-06-kuzu-dependency-exception-pinning/tasks.md`

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run scoped grep/status for the pinned dependency declarations**
