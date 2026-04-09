# Mini Repo AI Context Fixture Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the checked-in `mini-repo` AI context fixture docs aligned with the current `ai-context` generator contract.

**Architecture:** Add one focused `ai-context` regression test for the fixture contract, then update the fixture docs to match the already-correct generated guidance.

**Tech Stack:** TypeScript, Vitest, Markdown audit/OpenSpec docs

---

### Task 1: Add Failing Coverage

**Files:**
- Modify: `gitnexus/test/unit/ai-context.test.ts`

- [x] **Step 1: Require `mini-repo` fixture docs to drop dynamic counts**
- [x] **Step 2: Require `mini-repo` fixture docs to include current `detect_changes` guidance**
- [x] **Step 3: Require `mini-repo` fixture docs to keep the current Claude Code / Codex freshness split**
- [x] **Step 4: Run the focused test and confirm it fails before implementation**

### Task 2: Align Fixture Docs

**Files:**
- Modify: `gitnexus/test/fixtures/mini-repo/AGENTS.md`
- Modify: `gitnexus/test/fixtures/mini-repo/CLAUDE.md`

- [x] **Step 1: Remove stale dynamic intro counts**
- [x] **Step 2: Add current `repo` / `cwd` guidance to `detect_changes` examples**
- [x] **Step 3: Re-run focused tests and confirm they pass**
- [x] **Step 4: Re-run `npm run build` and confirm the bounded change remains clean**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-07-mini-repo-ai-context-fixture-convergence.md`
- Create: `docs/superpowers/specs/2026-04-07-mini-repo-ai-context-fixture-convergence-design.md`
- Create: `docs/superpowers/plans/2026-04-07-mini-repo-ai-context-fixture-convergence-implementation-plan.md`
- Create: `openspec/changes/2026-04-07-mini-repo-ai-context-fixture-convergence/.openspec.yaml`
- Create: `openspec/changes/2026-04-07-mini-repo-ai-context-fixture-convergence/proposal.md`
- Create: `openspec/changes/2026-04-07-mini-repo-ai-context-fixture-convergence/design.md`
- Create: `openspec/changes/2026-04-07-mini-repo-ai-context-fixture-convergence/specs/mini-repo-ai-context-fixture-convergence/spec.md`
- Create: `openspec/changes/2026-04-07-mini-repo-ai-context-fixture-convergence/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the new convergence status**

### Task 4: Final Verification

**Files:**
- Verify: `gitnexus/test/unit/ai-context.test.ts`
- Verify: fixture docs and governance artifacts

- [x] **Step 1: Run focused tests**
- [x] **Step 2: Run `npm run build`**
- [x] **Step 3: Validate the OpenSpec change**
- [x] **Step 4: Re-run GitNexus change detection for final scope review**
