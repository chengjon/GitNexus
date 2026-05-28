# Dual CLI Post-Mutation Freshness Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make shared GitNexus guidance explicitly cover both Claude Code automatic freshness handling and Codex manual freshness handling.

**Architecture:** Reuse the existing generated context / quick-start guidance surfaces and align them to the actual host behavior without adding new runtime hooks.

**Tech Stack:** TypeScript, Vitest, Markdown audit/OpenSpec docs

---

### Task 1: Add Failing Coverage

**Files:**
- Modify: `gitnexus/test/unit/ai-context.test.ts`

- [x] **Step 1: Require generated context to mention Claude Code automatic freshness handling**
- [x] **Step 2: Require generated context to mention Codex manual freshness handling**
- [x] **Step 3: Run the focused test and confirm it fails before implementation**

### Task 2: Align Shared Guidance

**Files:**
- Modify: `gitnexus/src/cli/ai-context.ts`
- Modify: `docs/gitnexus-quick-start-guide.md`
- Modify: `gitnexus/test/fixtures/mini-repo/AGENTS.md`
- Modify: `gitnexus/test/fixtures/mini-repo/CLAUDE.md`

- [x] **Step 1: Keep the existing Claude Code PostToolUse note**
- [x] **Step 2: Add the Codex manual-rerun note**
- [x] **Step 3: Re-run focused tests and confirm they pass**
- [x] **Step 4: Re-run `npm run build` and confirm the text-only code change compiles cleanly**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-07-dual-cli-post-mutation-freshness-guidance.md`
- Create: `docs/superpowers/specs/2026-04-07-dual-cli-post-mutation-freshness-guidance-design.md`
- Create: `docs/superpowers/plans/2026-04-07-dual-cli-post-mutation-freshness-guidance-implementation-plan.md`
- Create: `openspec/changes/2026-04-07-dual-cli-post-mutation-freshness-guidance/.openspec.yaml`
- Create: `openspec/changes/2026-04-07-dual-cli-post-mutation-freshness-guidance/proposal.md`
- Create: `openspec/changes/2026-04-07-dual-cli-post-mutation-freshness-guidance/design.md`
- Create: `openspec/changes/2026-04-07-dual-cli-post-mutation-freshness-guidance/specs/dual-cli-post-mutation-freshness-guidance/spec.md`
- Create: `openspec/changes/2026-04-07-dual-cli-post-mutation-freshness-guidance/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the new convergence status**

### Task 4: Final Verification

**Files:**
- Verify: `gitnexus/src/cli/ai-context.ts`
- Verify: target tests and governance artifacts

- [x] **Step 1: Run focused tests**
- [x] **Step 2: Run `npm run build`**
- [x] **Step 3: Validate the OpenSpec change**
- [x] **Step 4: Re-run GitNexus change detection for final scope review**
