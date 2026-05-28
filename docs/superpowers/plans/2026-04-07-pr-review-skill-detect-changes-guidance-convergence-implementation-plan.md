# PR Review Skill Detect Changes Guidance Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the PR review skill with the current `detect_changes` `repo` / `cwd` guidance.

**Architecture:** Add one focused skill-doc regression test, then update both the source skill and the checked-in installed skill copy to the same current guidance.

**Tech Stack:** TypeScript, Vitest, Markdown audit/OpenSpec docs

---

### Task 1: Add Failing Coverage

**Files:**
- Create: `gitnexus/test/unit/pr-review-skill.test.ts`

- [x] **Step 1: Require the PR review skill to document explicit `repo` guidance**
- [x] **Step 2: Require the PR review skill to document explicit `cwd` worktree guidance**
- [x] **Step 3: Run the focused test and confirm it fails before implementation**

### Task 2: Align Skill Docs

**Files:**
- Modify: `gitnexus/skills/gitnexus-pr-review.md`
- Modify: `.claude/skills/gitnexus/gitnexus-pr-review/SKILL.md`

- [x] **Step 1: Update the main `detect_changes` examples to include `repo`**
- [x] **Step 2: Update the checklist and worktree examples to include current `repo` / `cwd` guidance**
- [x] **Step 3: Re-run focused tests and confirm they pass**
- [x] **Step 4: Re-run `npm run build` and confirm the bounded change remains clean**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-07-pr-review-skill-detect-changes-guidance-convergence.md`
- Create: `docs/superpowers/specs/2026-04-07-pr-review-skill-detect-changes-guidance-convergence-design.md`
- Create: `docs/superpowers/plans/2026-04-07-pr-review-skill-detect-changes-guidance-convergence-implementation-plan.md`
- Create: `openspec/changes/2026-04-07-pr-review-skill-detect-changes-guidance-convergence/.openspec.yaml`
- Create: `openspec/changes/2026-04-07-pr-review-skill-detect-changes-guidance-convergence/proposal.md`
- Create: `openspec/changes/2026-04-07-pr-review-skill-detect-changes-guidance-convergence/design.md`
- Create: `openspec/changes/2026-04-07-pr-review-skill-detect-changes-guidance-convergence/specs/pr-review-skill-detect-changes-guidance-convergence/spec.md`
- Create: `openspec/changes/2026-04-07-pr-review-skill-detect-changes-guidance-convergence/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the new convergence status**

### Task 4: Final Verification

**Files:**
- Verify: `gitnexus/test/unit/pr-review-skill.test.ts`
- Verify: skill docs and governance artifacts

- [x] **Step 1: Run focused tests**
- [x] **Step 2: Run `npm run build`**
- [x] **Step 3: Validate the OpenSpec change**
- [x] **Step 4: Re-run GitNexus change detection for final scope review**
