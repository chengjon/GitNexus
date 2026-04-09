# Kuzu Dependency Exception Pinning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current `kuzu` and `kuzu-wasm` direct dependencies from semver ranges to explicit pinned exceptions while the dedicated replacement review remains open.

**Architecture:** Keep the change minimal and reversible. Update only the direct dependency declarations in `package.json` and the root package entries in lockfiles so the repository stops widening these deprecated lines via `^` ranges. Do not reinstall or regenerate the full lockfiles in this slice.

**Tech Stack:** JSON, OpenSpec, npm lockfile metadata

---

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
