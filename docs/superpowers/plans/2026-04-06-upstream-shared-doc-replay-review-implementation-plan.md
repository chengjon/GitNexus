# Upstream Shared Doc Replay Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record the latest `upstream/main` shared-document replay decision after the refreshed fetch, without replaying upstream wording that still conflicts with local code or governance reality.

**Architecture:** Keep this slice review-only. Refresh upstream refs, inspect only the shared replay hotspots, and cross-check upstream doc claims against current local source, CLI surface, and root-governance files. The output is a bounded decision record that says whether any new shared replay is safe right now.

**Tech Stack:** Markdown, OpenSpec, git diff/log, local CLI source review

---

### Task 1: Record The Follow-Up Slice

**Files:**
- Create: `openspec/changes/2026-04-06-upstream-shared-doc-replay-review/.openspec.yaml`
- Create: `openspec/changes/2026-04-06-upstream-shared-doc-replay-review/proposal.md`
- Create: `openspec/changes/2026-04-06-upstream-shared-doc-replay-review/design.md`
- Create: `openspec/changes/2026-04-06-upstream-shared-doc-replay-review/tasks.md`
- Create: `openspec/changes/2026-04-06-upstream-shared-doc-replay-review/specs/upstream-shared-doc-replay-review/spec.md`

- [x] **Step 1: Create a dedicated follow-up OpenSpec change after the earlier convergence baseline**
- [x] **Step 2: Bound the slice to the latest shared replay decision, not broad upstream integration**

### Task 2: Write The Shared Replay Review

**Files:**
- Create: `docs/audits/2026-04-06-upstream-shared-doc-replay-review.md`
- Modify: `docs/audits/2026-04-06-upstream-doc-governance-convergence-baseline.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Refresh the upstream divergence count and record the new baseline**
- [x] **Step 2: Re-check the shared hotspot files against current local source and governance reality**
- [x] **Step 3: Record whether any new replay slice is safe right now**
- [x] **Step 4: Carry forward the rule that future replay must stay evidence-backed and code-matched**

### Task 3: Validate The Slice

**Files:**
- Modify: `openspec/changes/2026-04-06-upstream-shared-doc-replay-review/tasks.md`

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Review the scoped diff and status for the shared replay review slice**
