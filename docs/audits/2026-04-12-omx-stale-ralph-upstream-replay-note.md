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

### Stop-hook regression test

The verified stop-hook regression test lives at:

- [`codex-native-hook.test.js:1161`](/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/scripts/__tests__/codex-native-hook.test.js#L1161)

It proves the session stops blocking after stale Ralph cancellation terminalizes
the session.

## Replay Strategy

In the canonical `oh-my-codex` source repository:

1. Locate the source equivalents of the currently verified compiled files.
2. Port the stale-cancel logic into source, not just generated `dist/`.
3. Port the five CLI tests and the stop-hook regression test.
4. Rebuild `dist/`.
5. Re-run the focused compiled tests.

## Minimum Replay Checklist

- Source equivalent of `dist/cli/index.js` updated
- Source equivalent of `dist/cli/__tests__/session-scoped-runtime.test.js` updated
- Source equivalent of `dist/scripts/__tests__/codex-native-hook.test.js` updated
- generated `dist/` refreshed from source
- `omx cancel ralph --stale` manually verified in a temp repo

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
