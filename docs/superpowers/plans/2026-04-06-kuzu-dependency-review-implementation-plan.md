# Kuzu Dependency Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> Status note: historical implementation plan only. The later
> `2026-04-06-kuzu-dependency-review` audit/OpenSpec slice is the authoritative
> completion record for what was actually captured, validated, and kept as the
> review-only dependency baseline. Treat the checked steps below as historical
> planning context, not as the current operator task queue.

Historical implementation-plan note: the `Goal`, `Architecture`, and checked
task breakdown below remain the 2026-04-06 planning-time baseline. Read them
as historical planning context unless the later dependency-review records
explicitly reassert them as still current.

**Goal:** Turn the audited `kuzu` / `kuzu-wasm` dependency debt into a bounded upgrade-or-replacement review plan with explicit decision criteria for CLI and web separately.

**Architecture:** Keep this slice review-only. Do not change dependency versions yet. Record the current deprecated direct and transitive dependency line, define separate evaluation tracks for CLI `kuzu` and web `kuzu-wasm`, and establish the decision rule for upgrade, replacement, or rationale-backed pinning.

**Tech Stack:** Markdown, OpenSpec, npm dependency metadata

---

Reader note: the checked tasks below preserve the 2026-04-06 planning-time
execution breakdown. They are historical plan artifacts, not a current live
task board, because the later dependency-review audit/OpenSpec records now
define the retained review-only baseline.

### Task 1: Record The Review Slice

**Files:**
- Create: `openspec/changes/2026-04-06-kuzu-dependency-review/.openspec.yaml`
- Create: `openspec/changes/2026-04-06-kuzu-dependency-review/proposal.md`
- Create: `openspec/changes/2026-04-06-kuzu-dependency-review/design.md`
- Create: `openspec/changes/2026-04-06-kuzu-dependency-review/tasks.md`
- Create: `openspec/changes/2026-04-06-kuzu-dependency-review/specs/kuzu-dependency-review/spec.md`

- [x] **Step 1: Capture why the dependency line needs a dedicated review**
- [x] **Step 2: Bound the slice to review and decision criteria, not package upgrades**

### Task 2: Define The Decision Framework

**Files:**
- Create: `docs/audits/2026-04-06-kuzu-dependency-review.md`
- Modify: `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Separate CLI `kuzu` and web `kuzu-wasm` review tracks**
- [x] **Step 2: Record the acceptable outcomes: upgrade, replace, or rationale-backed pin**
- [x] **Step 3: Keep the current line explicitly classified as a tracked exception until the review completes**

### Task 3: Validate The Slice

**Files:**
- Modify: `openspec/changes/2026-04-06-kuzu-dependency-review/tasks.md`

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Review the scoped diff and status for the dependency-review slice**
