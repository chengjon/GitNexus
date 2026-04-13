# OMX Stale Ralph Cancel Implementation Plan

> Status note: historical implementation plan only. Execution later diverged into the verified local/operator replay, the verified fork-only stop point `46622fa`, and the closed-PR stop point documented in the 2026-04-12 stale-Ralph audits. Treat the audit/OpenSpec records as the authoritative completion history, not the unchecked boxes below.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe `omx cancel ralph --stale` command that clears half-started Ralph state stuck in `starting` without touching unrelated sessions.

**Architecture:** Extend the existing `omx cancel` branch in the installed `oh-my-codex` CLI so it can recognize one Ralph-specific stale-startup shape, terminalize the matched Ralph state, and clear the matching canonical `skill-active` marker. Keep ordinary `omx cancel` behavior unchanged, keep the default scope session-local, and prove the change with compiled-node tests that reproduce the current stop-hook warning path.

**Tech Stack:** Node.js ESM, installed `oh-my-codex` `dist/` bundle, `node:test`, session-scoped `.omx/state` fixtures

---

## Planned File Map

- Modify: `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/index.js`
  - Parse `omx cancel ralph --stale`
  - Add stale-session detection and Ralph-only terminalization branch
  - Keep ordinary `omx cancel` behavior unchanged
  - Update CLI help text for the new operator-facing form
- Modify: `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/state/skill-active.js`
  - Add a helper that deactivates one canonical workflow skill for one session while preserving unrelated entries
- Modify: `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/__tests__/session-scoped-runtime.test.js`
  - Add acceptance and refusal coverage for `omx cancel ralph --stale`
- Modify: `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/state/__tests__/skill-active.test.js`
  - Lock the new targeted skill deactivation helper
- Modify: `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/scripts/__tests__/codex-native-hook.test.js`
  - Reproduce the stop-hook warning shape and prove stale cancel removes the block

## Constraints

- The canonical operator surface remains `omx cancel`; do not add a new top-level cleanup command.
- The installed package currently exposes the operational code in `dist/`; do not assume matching TypeScript source files are available.
- Default cleanup scope must stay bound to the current session from `.omx/state/session.json`.
- Do not treat `--stale` as `--force`; refuse when Ralph looks legitimately active.
- Preserve debugging evidence by terminalizing state instead of unlinking the Ralph session file.

### Task 1: Lock The Runtime Contract With Failing Tests

**Files:**
- Modify: `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/__tests__/session-scoped-runtime.test.js`
- Modify: `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/scripts/__tests__/codex-native-hook.test.js`

- [ ] **Step 1: Add a stale Ralph acceptance fixture to the CLI runtime test**
- [ ] **Step 2: Assert `omx cancel ralph --stale` exits `0`, reports stale-session cancellation, and terminalizes the session Ralph state**
- [ ] **Step 3: Add refusal cases for fresh `starting`, `executing`, existing `.omx/context/*`, and existing `.omx/plans/prd-*.md` or `test-spec-*.md` artifacts**
- [ ] **Step 4: Add a cross-session isolation case proving only the current session Ralph state changes**
- [ ] **Step 5: Add a stop-hook regression test that starts with the current warning shape, runs stale cancel, and verifies the next `Stop` evaluation no longer blocks on Ralph**

### Task 2: Add Targeted Skill-Active Cleanup

**Files:**
- Modify: `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/state/skill-active.js`
- Modify: `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/state/__tests__/skill-active.test.js`

- [ ] **Step 1: Add a helper that reads the visible canonical skill-active state for one session and removes only the targeted workflow entry**
- [ ] **Step 2: Make the helper preserve unrelated `active_skills` entries and keep root/session copies in sync**
- [ ] **Step 3: Ensure the helper becomes a no-op when no matching skill entry exists for the targeted session**
- [ ] **Step 4: Add tests for session-local Ralph removal, preservation of another session’s entry, and preservation of a different active skill in the same root file**

### Task 3: Extend `omx cancel` With A Ralph Stale Branch

**Files:**
- Modify: `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/index.js`

- [ ] **Step 1: Change the `cancel` command dispatch from `await cancelModes()` to `await cancelModes(args.slice(1))`**
- [ ] **Step 2: Add argument parsing that recognizes only Ralph-targeted stale cleanup and leaves all other `cancel` forms on the existing path**
- [ ] **Step 3: Add a stale-detection helper that requires all of the following**
  - current session owns the visible Ralph state
  - `active === true`
  - `current_phase === "starting"`
  - the state age is older than the minimum threshold
  - no linked `ultrawork` or `ecomode` state is active in the same scope
  - no `context_snapshot_path` is set and no `.omx/context/*` snapshot exists
  - no canonical planning artifact exists for the run in `.omx/plans/` such as `prd-*.md` or `test-spec-*.md`
- [ ] **Step 4: Keep the stale detector session-aware and refusal-first**
  - if the session Ralph state is missing, refuse
  - if a different session owns the active Ralph state, refuse
  - if Ralph is already `executing`, `verifying`, or `fixing`, refuse
  - if startup evidence exists, refuse
- [ ] **Step 5: On success, terminalize only the matched Ralph session state with `active=false`, `current_phase="cancelled"`, `completed_at=<iso>`, and `last_turn_at=<iso>`**
- [ ] **Step 6: Clear the matching canonical Ralph skill-active entry for that same session**
- [ ] **Step 7: Optionally terminalize the legacy root `ralph-state.json` only when it clearly matches the stale session cleanup shape**
- [ ] **Step 8: Emit short structured output on both success and refusal so operators can distinguish “cleaned stale state” from “use normal cancel”**

### Task 4: Document The Operator Surface In Help Text

**Files:**
- Modify: `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/index.js`

- [ ] **Step 1: Update the top-level CLI help so `omx cancel` mentions the new `omx cancel ralph --stale` form**
- [ ] **Step 2: Keep the help text explicit that `--stale` is Ralph-only and session-scoped by default**

### Task 5: Verify Against The Real Failure Shape

**Files:**
- Verify: compiled OMX package under `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex`

- [ ] **Step 1: Run focused compiled tests**
  - `node --test dist/cli/__tests__/session-scoped-runtime.test.js dist/state/__tests__/skill-active.test.js dist/scripts/__tests__/codex-native-hook.test.js`
- [ ] **Step 2: Run the broader compiled Ralph persistence suite**
  - `npm run test:ralph-persistence:compiled`
- [ ] **Step 3: Recreate the stale-starting fixture in a temporary repo and manually run `node dist/cli/omx.js cancel ralph --stale`**
- [ ] **Step 4: Confirm the resulting session Ralph state is terminal, the matching skill-active entry is inactive, and the stop-hook warning no longer reproduces**

## Notes For Execution

- The current installed package contains operational JS in `dist/` and package tests already target compiled JS there, so this implementation should modify `dist/` directly.
- Do not broaden this change into generic stale cleanup for other modes in the same patch.
- If the upstream `oh-my-codex` source repository is available later, replay the same logic into its canonical source files after this local operator fix is proven.
