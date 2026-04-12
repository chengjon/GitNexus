# OMX Stale Ralph Cancel Upstream Replay Note

**Date:** 2026-04-12
**Purpose:** Explain how to replay the locally verified `omx cancel ralph --stale`
implementation into the canonical `oh-my-codex` source repository.

## Why This Note Exists

The working implementation currently lives in the installed package directory:

- `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/index.js`
- `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/__tests__/session-scoped-runtime.test.js`
- `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/scripts/__tests__/codex-native-hook.test.js`

That path is executable and locally verified, but it is not a stable product
source-of-truth checkout for normal git review and merge. The package tree sits
under `/root/.nvm`, and `git status` on that enclosing repo does not surface
the package-file edits as reviewable tracked changes.

## Verified Behavior To Replay

The upstream replay must preserve all of these outcomes:

1. `omx cancel ralph --stale` succeeds only for a stale Ralph startup session.
2. Ordinary `omx cancel` and `omx cancel ralph` behavior remain unchanged.
3. Cleanup is session-scoped by default.
4. Success terminalizes Ralph state instead of deleting it.
5. Matching canonical `skill-active-state` is deactivated.
6. Stop-hook no longer blocks after stale cancellation.
7. If the current session already has terminal session-scoped Ralph state, a
   stale legacy root Ralph state can still be cleaned safely.
8. If the session-scoped `skill-active-state` is already inactive, the matching
   root `skill-active-state` entry is still cleared.

## Implementation Anchors From The Verified Local Build

### CLI entry and stale branch

The verified local build added the stale branch in:

- [`dist/cli/index.js:101`](/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/index.js#L101)
- [`dist/cli/index.js:549`](/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/index.js#L549)
- [`dist/cli/index.js:2395`](/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/index.js#L2395)
- [`dist/cli/index.js:2455`](/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/index.js#L2455)
- [`dist/cli/index.js:2482`](/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/index.js#L2482)
- [`dist/cli/index.js:2530`](/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/index.js#L2530)
- [`dist/cli/index.js:2569`](/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/index.js#L2569)

Key verified pieces:

- help text mention for `omx cancel ralph --stale`
- `cancel` command dispatch now forwards `args.slice(1)`
- `RALPH_STALE_MIN_AGE_MS`
- `parseCancelModeArgs(...)`
- `shouldRefuseRalphStaleCancel(...)`
- `deactivateCanonicalSkillEntry(...)`
- stale-only Ralph cleanup branch before ordinary cancel flow

### CLI acceptance/refusal/non-regression tests

The verified local tests live at:

- [`session-scoped-runtime.test.js:115`](/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/__tests__/session-scoped-runtime.test.js#L115)
- [`session-scoped-runtime.test.js:150`](/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/__tests__/session-scoped-runtime.test.js#L150)
- [`session-scoped-runtime.test.js:174`](/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/__tests__/session-scoped-runtime.test.js#L174)
- [`session-scoped-runtime.test.js:202`](/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/__tests__/session-scoped-runtime.test.js#L202)
- [`session-scoped-runtime.test.js:233`](/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/__tests__/session-scoped-runtime.test.js#L233)

Those tests prove:

- stale success path
- normal `omx cancel ralph` non-regression
- refusal when context evidence exists
- refusal for fresh or active Ralph runs
- cross-session isolation
- root fallback when no scoped Ralph entry exists
- root fallback when scoped Ralph state is already terminal

## Upstream Source Replay Status

The canonical source replay was completed in `/tmp/oh-my-codex-upstream` and
produced two local git commits:

- `13f9aa5` `Allow safe cleanup of stale Ralph startup state`
- `9185353` `Handle stale Ralph cleanup when scoped state already terminated`

Those commits are currently local to that checkout. They still need to be
pushed or turned into a PR in the actual `oh-my-codex` repository lifecycle.

## Commit Hygiene Note

The local upstream commits above contain shell-quoting damage in parts of their
commit bodies:

- literal `\n` sequences appear in trailer sections
- one body accidentally captured refusal-output text inline
- one sentence lost the intended backticked `` `starting` `` fragment

The code and verification evidence are still valid, but those commit messages
should be cleaned up before the changes are pushed, rebased into a PR branch,
or copied into release notes.

### Suggested Clean Replacement Subjects

If those commits are rewritten before push, these subject lines preserve the
validated intent:

- `Allow safe cleanup of stale Ralph startup state`
- `Handle stale Ralph cleanup when scoped state already terminated`

### Suggested Clean Replacement Body Themes

For the first upstream commit, preserve these points:

- stale Ralph can be stuck in `starting` after a half-started session
- `omx cancel ralph --stale` is the canonical operator command
- stale cleanup must stay session-scoped by default
- cleanup terminalizes Ralph state and clears the matching canonical
  `skill-active-state`

For the second upstream commit, preserve these points:

- a terminal session-scoped Ralph state can hide a stale legacy root Ralph
  state
- root fallback must only activate when the scoped Ralph entry is absent or
  already terminal
- root `skill-active-state` cleanup must still happen when the session copy is
  already inactive

### Stop-hook regression test

The verified stop-hook regression test lives at:

- [`codex-native-hook.test.js:1161`](/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/scripts/__tests__/codex-native-hook.test.js#L1161)

It proves the session stops blocking after stale Ralph cancellation terminalizes
the session.

## Replay Strategy

In the canonical `oh-my-codex` source repository:

1. Preserve both upstream commits above or replay their equivalent source diffs.
2. Ensure the stale-cancel logic handles both:
   - normal session-scoped stale Ralph cleanup
   - root fallback when the scoped Ralph entry is absent or already terminal
3. Ensure root `skill-active-state` cleanup still occurs when the session copy
   is already inactive.
4. Rebuild `dist/`.
5. Re-run the focused compiled tests.

## Minimum Replay Checklist

- Source equivalent of `dist/cli/index.js` updated
- Source equivalent of `dist/cli/__tests__/session-scoped-runtime.test.js` updated
- Source equivalent of `dist/scripts/__tests__/codex-native-hook.test.js` updated
- generated `dist/` refreshed from source
- `omx cancel ralph --stale` manually verified in a temp repo
- terminal scoped + root stale fallback manually verified in a temp repo

## Verification Commands To Reuse

Focused:

```bash
node --test dist/cli/__tests__/session-scoped-runtime.test.js dist/scripts/__tests__/codex-native-hook.test.js
```

Live command proof:

```bash
node dist/cli/omx.js cancel ralph --stale
```

Live stop-hook proof:

```bash
dispatchCodexNativeHook({ hook_event_name: "Stop", ... })
```

## Known Non-Blocking Environment Failures

The broader compiled suite still reports unrelated packaging/layout failures in
the installed package environment:

- missing `src/mcp/trace-server.ts`
- missing `docs/reference/ralph-upstream-baseline.md`
- missing `docs/contracts/ralph-state-contract.md`
- missing `.github/workflows/ci.yml`

Do not treat those as stale-cancel regressions when replaying the patch.
