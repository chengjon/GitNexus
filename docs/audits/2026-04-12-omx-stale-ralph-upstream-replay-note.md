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
produced two clean git commits:

- `1193124` `Allow safe cleanup of stale Ralph startup state`
- `bf1b47d` `Handle stale Ralph cleanup when scoped state already terminated`

Those commits were first pushed on branch `stale-ralph-clean-pr-v2` and opened
as PR `#1505` against `main`, but the owner closed that PR because repository
changes must target `dev`. The later `dev`-based publication path was:

- dev-based branch: `stale-ralph-clean-pr-dev`
- closed PR: `Yeachan-Heo/oh-my-codex#1509`
- URL: <https://github.com/Yeachan-Heo/oh-my-codex/pull/1509>
- closed at: `2026-04-12T15:45:57Z`
- head commit at close: `0022b24` `Clear stale root Ralph skill state during scoped cleanup`
- owner closure note: the stale Ralph lifecycle / termination contract change was too broad to merge as-is and would need a narrower maintainer-led pass
- later fork-only follow-up on the same branch: `46622fa` `Preserve repo-local stale evidence across Windows paths`

## Historical Commit Hygiene Note

Earlier live-repair commits outside the clean publication branch contained
shell-quoting damage in parts of their commit bodies:

- literal `\n` sequences appear in trailer sections
- one body accidentally captured refusal-output text inline
- one sentence lost the intended backticked `` `starting` `` fragment

The code and verification evidence were still valid, but those damaged commits
are no longer the publication path.

### Suggested Clean Replacement Subjects

These subject lines are the clean publication subjects that preserve the
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

### Historical Rewrite Workflow

Before the clean branch was created, a maintainer could have rewritten the two
damaged local commit messages with a focused interactive rebase over the stale-
Ralph commits:

```bash
git rebase -i d5975af
```

Then they would have marked the stale-Ralph commits as `reword`:

- `13f9aa5` `Allow safe cleanup of stale Ralph startup state`
- `9185353` `Handle stale Ralph cleanup when scoped state already terminated`

When the editor opens for each commit, keep the validated subject lines above
and rewrite the bodies using the listed body themes instead of carrying forward
the shell-damaged text.

### Stop-hook regression test

The verified stop-hook regression test lives at:

- [`codex-native-hook.test.js:1161`](/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/scripts/__tests__/codex-native-hook.test.js#L1161)

It proves the session stops blocking after stale Ralph cancellation terminalizes
the session.

## Replay Strategy

In the canonical `oh-my-codex` source repository:

1. Preserve the verified stale-cancel behavior from the four-commit dev-based
   series plus the later Windows-path follow-up `46622fa`, even if the final
   maintainer-owned version is reshaped into a narrower patch.
2. Ensure the stale-cancel logic handles both:
   - normal session-scoped stale Ralph cleanup
   - root fallback when the scoped Ralph entry is absent or already terminal
3. Ensure root `skill-active-state` cleanup still occurs when the session copy
   is already inactive.
4. Ensure scoped stale cleanup also removes a legacy/global root Ralph skill entry
   when the session-visible skill file has already moved to another skill.
5. Ensure Windows-style absolute paths that still point into repo-local
   `/.omx/...` artifacts do not evade POSIX-host evidence checks.
6. Rebuild `dist/`.
7. Re-run the focused compiled tests.

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

## Latest PR Review Follow-up

After PR `#1509` was opened on `dev`, two review-driven hardening passes were
added on the same branch:

- `7707816` hardened Windows drive-letter evidence-path handling and preserved
  unrelated root skill entries during session-scoped cleanup
- `0022b24` cleared a stale legacy/global root Ralph skill entry when the
  session-visible skill file had already moved to another skill

The latest focused verification on that branch was:

```bash
npm run build
node --test dist/cli/__tests__/session-scoped-runtime.test.js dist/scripts/__tests__/codex-native-hook.test.js
```

Result:

- 84 tests passed
- 0 failed

One of those 84 tests now specifically covers the mixed session/root skill-state
shape raised in the latest PR review thread.

## Latest Review Follow-up And Closure

After `0022b24`, Codex posted one more review comment on `#1509`:

- discussion: <https://github.com/Yeachan-Heo/oh-my-codex/pull/1509#discussion_r3069643047>
- concern: `resolveRepoPath` still returns raw Windows-style absolute paths such
  as `C:\...` on POSIX hosts, so `existsSync` can miss real evidence artifacts
  and incorrectly allow `omx cancel ralph --stale`

That review point was addressed later on the fork branch in:

- `46622fa` `Preserve repo-local stale evidence across Windows paths`
- reply: <https://github.com/Yeachan-Heo/oh-my-codex/pull/1509#discussion_r3069689242>

The follow-up verification after `46622fa` was:

```bash
npm run build
node --test dist/cli/__tests__/session-scoped-runtime.test.js dist/scripts/__tests__/codex-native-hook.test.js
```

Result:

- 85 tests passed
- 0 failed

However, PR `#1509` itself was closed earlier at `2026-04-12T15:45:57Z` with
an owner note that this lifecycle / termination contract change would need a
narrower maintainer-led pass rather than merge in its current form.

## Latest Workspace Proof After PR Migration To `dev`

After the clean branch was migrated onto `origin/dev` and reopened as PR `#1509`,
the current GitNexus workspace still reproduced the same stale root compatibility shape.
Running:

```bash
omx cancel ralph --stale
```

again terminalized the root `ralph-state.json`, cleared the matching root
`skill-active-state.json`, and a fresh Stop-hook replay in
`/opt/claude/GitNexus` returned:

```json
{"hookEventName":"Stop","omxEventName":"stop","skillState":null,"outputJson":null}
```

That confirms the command and the verified fork replay still match live
operator behavior in the current workspace, not just an earlier temp replay.

A later fresh local replay after the PR-closure audit updates again found a root
compatibility Ralph state stuck in `starting`. Re-running `omx cancel ralph --stale`
produced the same stale-cleanup output, then left:

- root `ralph-state.json` at `active: false`, `current_phase: "cancelled"`,
  `completed_at: "2026-04-12T16:04:28.274Z"`
- root `skill-active-state.json` at `active: false` with `active_skills: []`
- `omx status` reporting `ralph: inactive (phase: cancelled)` and
  `skill-active: inactive`

That gives one more post-closure operator proof that the canonical local command
still safely clears recurring stale root Ralph state in `/opt/claude/GitNexus`.

As of 2026-04-13, upstream still shows no new maintainer-led replacement PR,
issue, or branch for this narrower stale-cleanup contract. The publication stop
point remains: closed PR `#1509`, owner closure note, and fork-only follow-up
`46622fa`.
