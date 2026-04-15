# GitNexus Web Build Boundary Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> Status note: historical implementation plan only. The later
> `2026-04-06-gitnexus-web-build-boundary-fix` audit/OpenSpec slice is the
> authoritative completion record for what was actually fixed and validated.
> Treat the checked steps below as historical planning context, not as the
> current operator task queue.

Historical implementation-plan note: the `Goal`, `Architecture`, and checked
task breakdown below remain the 2026-04-06 planning-time baseline. Read them
as historical planning context unless the later build-boundary records
explicitly reassert them as still current.

**Goal:** Restore reproducible `gitnexus-web` production build verification in the current repository by fixing the host-boundary config loading failure.

**Architecture:** Keep the application code unchanged. Add explicit local config boundaries so Vite/PostCSS no longer walk outside the repository during build verification, and route the production build through a small wrapper that passes inline config with `configFile: false`.

**Tech Stack:** Vite, PostCSS, Node ESM, npm scripts, Markdown, OpenSpec

---

Reader note: the checked tasks below preserve the 2026-04-06 planning-time
execution breakdown. They are historical plan artifacts, not a current live
task board, because the later build-boundary audit/OpenSpec records now define
the retained fixed-and-verified baseline.

### Task 1: Record The Repair Slice

**Files:**
- Create: `openspec/changes/2026-04-06-gitnexus-web-build-boundary-fix/.openspec.yaml`
- Create: `openspec/changes/2026-04-06-gitnexus-web-build-boundary-fix/proposal.md`
- Create: `openspec/changes/2026-04-06-gitnexus-web-build-boundary-fix/design.md`
- Create: `openspec/changes/2026-04-06-gitnexus-web-build-boundary-fix/tasks.md`
- Create: `openspec/changes/2026-04-06-gitnexus-web-build-boundary-fix/specs/gitnexus-web-build-boundary-fix/spec.md`

- [x] **Step 1: Add a dedicated OpenSpec change for the build-boundary fix**
- [x] **Step 2: Bound the slice to build verification and local config loading, not application behavior**

### Task 2: Apply The Fix

**Files:**
- Create: `gitnexus-web/postcss.config.mjs`
- Create: `gitnexus-web/vite.inline.config.mjs`
- Create: `gitnexus-web/scripts/build-vite.mjs`
- Modify: `gitnexus-web/package.json`
- Create: `docs/audits/2026-04-06-gitnexus-web-build-boundary-fix.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Add explicit local PostCSS config so config discovery does not walk outside the repo**
- [x] **Step 2: Add a build wrapper that bypasses Vite's config-file loader**
- [x] **Step 3: Point the production build script at the wrapper**
- [x] **Step 4: Record root cause, fix, and verification in the audit trail**

### Task 3: Validate The Fix

**Files:**
- Modify: `openspec/changes/2026-04-06-gitnexus-web-build-boundary-fix/tasks.md`

- [x] **Step 1: Run `npx tsc -b --noEmit`**
- [x] **Step 2: Run `npm run build`**
- [x] **Step 3: Run the targeted log-hygiene check**
