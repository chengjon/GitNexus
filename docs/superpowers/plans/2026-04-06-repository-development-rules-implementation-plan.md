# Repository Development Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a single source of truth for repository-wide development governance, wire the relevant AI and human contribution entrypoints to it, and add lightweight automated enforcement for the highest-value rules.

**Architecture:** Keep one canonical governance document at the repo root, add short references in both the top-level and `gitnexus/` AI context files outside the GitNexus auto-generated marker block, add lightweight human-facing pointers in `README.md` plus `.github/PULL_REQUEST_TEMPLATE.md`, and centralize automation in one reusable governance-check script. Avoid changing GitNexus context-generation code so the rules stay repository-specific and survive `refresh-context` updates.

**Tech Stack:** Markdown, repository docs, GitNexus context-file conventions

---

### Task 1: Create the canonical governance document

**Files:**
- Create: `DEVELOPMENT_RULES.md`

- [x] **Step 1: Draft rule sections for the six requested governance areas**

Write sections for single source of truth, compatibility-layer retirement, migration completion, deletion gates, metric semantics, and temporary artifact hygiene.

- [x] **Step 2: Encode the rules as merge-blocking repository policy**

Use hard wording such as `MUST`, `MUST NOT`, and explicit merge-blocker language where the repository needs strict behavior.

- [x] **Step 3: Review for project-fit rather than literal transcription**

Confirm the rules are adapted to this repository's workflows and do not read like generic policy boilerplate.

### Task 2: Add durable entrypoint references

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `gitnexus/AGENTS.md`
- Modify: `gitnexus/CLAUDE.md`

- [x] **Step 1: Add a short repository-governance preamble above the generated GitNexus block**

Place the new text outside `<!-- gitnexus:start -->` and `<!-- gitnexus:end -->` so refresh flows preserve it.

- [x] **Step 2: Point both files to `DEVELOPMENT_RULES.md` as the governing source**

Keep the entry text short and explicit about when the rules apply.

- [x] **Step 3: Avoid duplicating the full policy text in the entrypoint files**

Preserve one canonical policy document instead of maintaining multiple copies.

### Task 3: Verify refresh-safety assumptions

**Files:**
- Inspect: `gitnexus/src/cli/ai-context.ts`
- Inspect: `AGENTS.md`
- Inspect: `CLAUDE.md`

- [x] **Step 1: Confirm GitNexus only replaces content inside its marker block**

Review the `upsertGitNexusSection` behavior to verify that content outside the marker block survives.

- [x] **Step 2: Inspect the final markdown files**

Confirm the preamble appears before the marker block in both top-level context files.

- [x] **Step 3: Check the resulting diff**

Make sure the change scope is limited to the new rules document, the two top-level entrypoint files, and this implementation plan.

### Task 4: Add human-facing contribution entrypoints

**Files:**
- Modify: `README.md`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`

- [x] **Step 1: Add a short governance pointer to `README.md`**

Keep the text brief and direct readers to `DEVELOPMENT_RULES.md` for migration, deletion, duplicate-layer, metrics, and temporary-artifact policy.

- [x] **Step 2: Add a PR template checklist**

Mirror the repository governance review points without duplicating the full policy body.

- [x] **Step 3: Keep the new human-facing entrypoints aligned with the canonical rules doc**

Treat `DEVELOPMENT_RULES.md` as the source of truth and avoid creating alternative policy wording.

### Task 5: Add automated governance checks

**Files:**
- Create: `gitnexus/scripts/ci/repository-governance-check.mjs`
- Create: `gitnexus/test/unit/repository-governance-check.test.ts`
- Create: `gitnexus/test/unit/repository-governance-integration.test.ts`
- Modify: `gitnexus/package.json`
- Modify: `.github/workflows/ci-quality.yml`
- Create: `.github/workflows/pr-governance.yml`
- Modify: `.github/PULL_REQUEST_TEMPLATE.md`

- [x] **Step 1: Write failing tests for governance-check behavior**

Cover temporary filename rejection in managed paths, fixture/docs exclusions, PR body metric-section validation, and workflow/package integration.

- [x] **Step 2: Implement one shared governance-check script**

Support both managed-path scanning and PR body validation without duplicating rule logic across workflows.

- [x] **Step 3: Add a local package command for repository governance checks**

Expose the path-check mode through `gitnexus/package.json` so contributors and CI invoke the same command.

- [x] **Step 4: Wire managed-path checks into CI quality gates**

Run the repository governance path check before typechecking.

- [x] **Step 5: Add a dedicated PR governance workflow**

Validate that PR bodies retain explicit canonical-path, compatibility-layer, exit-condition, deletion-reachability, and metric-classification fields.

- [x] **Step 6: Update the PR template to match the automated PR body contract**

Keep the template aligned with the required PR governance sections so valid PRs pass by default.

- [x] **Step 7: Require inline retirement metadata for new compatibility-like files**

For newly added `shim`, `compat`, `_v2`, or similar managed-path files, enforce `CANONICAL PATH:` and `EXIT CONDITION:` markers in the file body through the shared governance check script.

- [x] **Step 8: Require explicit GitNexus evidence for deletion decisions**

When managed-path files are deleted or retired through rename/move, enforce a `GitNexus Evidence:` field in the PR governance section that cites at least one concrete GitNexus tool call or `gitnexus://repo/...` resource and names the retired path or canonical replacement path.

- [x] **Step 9: Require structured deletion reachability notes**

When managed-path files are deleted or retired through rename/move, enforce that `Deletion Reachability:` explicitly covers runtime, scripts or automation, config or env branches, and tests or fixtures.

- [x] **Step 10: Keep canonical-path declarations pointed at stable paths**

When compatibility-layer paths change, enforce that `Canonical Path:` names the stable canonical replacement path rather than the shim, compat, `_new`, or `_v2` path itself.

- [x] **Step 11: Reject placeholder compatibility exit conditions**

When compatibility-layer paths change, reject `Exit Condition:` values that are still placeholders such as `TBD`, `later`, or generic follow-up cleanup notes.

- [x] **Step 12: Require compatibility notes to name the temporary path**

When compatibility-layer paths change, enforce that `Compatibility Layer / Shim:` names the actual shim, compat, `_new`, or `_v2` path under change rather than a generic description.

- [x] **Step 13: Validate compatibility file marker values**

When newly added compatibility-layer files declare `CANONICAL PATH:` and `EXIT CONDITION:` markers, enforce that the canonical path points at the stable replacement path and the exit condition is not still placeholder text.

- [x] **Step 14: Keep canonical-path declarations singular**

When `Canonical Path:` appears in PR governance notes or compatibility-file markers, enforce that it resolves to exactly one stable path rather than multiple candidate paths.
