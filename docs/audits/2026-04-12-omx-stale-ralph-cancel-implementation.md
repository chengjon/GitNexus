# OMX Stale Ralph Cancel Implementation Audit

**Date:** 2026-04-12
**Status:** Implemented locally in installed `oh-my-codex` package
**Scope:** `omx cancel ralph --stale`

## Outcome

The shortest safe cleanup command for the recurring warning

```text
warning: OMX Ralph is still active (phase: starting)
```

is now implemented and verified locally:

```bash
omx cancel ralph --stale
```

This implementation was applied to the currently installed OMX package rather
than GitNexus product code.

## Follow-up Edge Case

Later on 2026-04-12, a second stale-cleanup edge case was reproduced in the
live GitNexus workspace:

- the current session already had terminal session-scoped Ralph state
- a legacy root `ralph-state.json` still remained stuck in `starting`
- root `skill-active-state.json` still carried a stale `ralph` marker

In that shape, the first `--stale` implementation could still refuse cleanup
with:

```text
Refused stale Ralph cancellation.
reason: Ralph is not active in the current session scope
next: use `omx cancel ralph`
```

The verified fix now falls back to the stale root Ralph state only when the
session-scoped Ralph entry is absent or already terminal, and it also clears
the root `skill-active-state` entry when the session copy is already inactive.

## External Files Modified

- `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/index.js`
- `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/__tests__/session-scoped-runtime.test.js`
- `/root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/scripts/__tests__/codex-native-hook.test.js`

## Final Implemented Behavior

- `omx cancel ralph --stale` is accepted only for Ralph-specific stale cleanup.
- Ordinary `omx cancel` and `omx cancel ralph` behavior remains unchanged.
- Stale cleanup is session-scoped by default.
- Success terminalizes Ralph state instead of deleting it.
- Matching `skill-active-state` is cleared for the same session.
- Root compatibility files are also terminalized when they match the same stale
  run.

## Implementation Notes

The final implementation took the smallest viable path:

- stale detection and cleanup logic lives in the `cancel` branch in
  `dist/cli/index.js`
- no new top-level OMX command was introduced
- no generic stale cleanup framework was added
- no shared `skill-active` helper module was added; the targeted deactivation
  logic stayed local to the new Ralph stale-cancel path to minimize blast radius

## Verification Evidence

### Focused compiled tests

Command:

```bash
node --test dist/cli/__tests__/session-scoped-runtime.test.js dist/scripts/__tests__/codex-native-hook.test.js
```

Result:

- 61 tests passed
- 0 failed

Covered by that run:

- stale Ralph cancel success path
- refusal for fresh `starting`
- refusal for `executing`
- refusal when startup evidence exists
- cross-session isolation
- normal `omx cancel ralph` non-regression
- stop-hook unblocking after stale cancel

### Follow-up upstream/source verification

Source checkout:

- `/tmp/oh-my-codex-upstream`

Commands:

```bash
npm run build
node --test dist/cli/__tests__/session-scoped-runtime.test.js dist/scripts/__tests__/codex-native-hook.test.js
```

Result:

- 76 tests passed
- 0 failed

Additional coverage added in the follow-up:

- stale root Ralph cleanup when no scoped Ralph entry exists
- stale root Ralph cleanup when the current session already has terminal scoped
  Ralph state

### Broader Ralph persistence suite

Command:

```bash
npm run test:ralph-persistence:compiled
```

Result:

- stale-cancel related tests passed
- suite still failed for 4 pre-existing package-layout issues unrelated to this
  change

Observed unrelated failures:

- missing `src/mcp/trace-server.ts`
- missing `docs/reference/ralph-upstream-baseline.md`
- missing `docs/contracts/ralph-state-contract.md`
- missing `.github/workflows/ci.yml`

### Live workspace command proof

Command run in `/opt/claude/GitNexus`:

```bash
node /root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/omx.js cancel ralph --stale
```

Observed output:

```text
Cancelled stale Ralph session.
session_id: 019d7893-fada-7db0-b2a5-b23e02bc9b6c
reason: stuck_in_starting_without_execution_artifacts
cleared:
  - session ralph-state
  - legacy global ralph-state
  - matching skill-active-state
```

### Live workspace state proof

After running the command, these files were terminal/non-active:

- `.omx/state/ralph-state.json`
- `.omx/state/skill-active-state.json`
- `.omx/state/sessions/019d7893-fada-7db0-b2a5-b23e02bc9b6c/ralph-state.json`
- `.omx/state/sessions/019d7893-fada-7db0-b2a5-b23e02bc9b6c/skill-active-state.json`

### Live stop-hook proof

The current workspace stop-hook was replayed with:

```bash
dispatchCodexNativeHook({ hook_event_name: "Stop", ... })
```

Result:

- `outputJson: null`

That confirms the current GitNexus workspace is no longer blocked by the stale
Ralph warning after cleanup.

### Installed-package follow-up verification

Commands:

```bash
node --test /root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/__tests__/session-scoped-runtime.test.js /root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/scripts/__tests__/codex-native-hook.test.js
```

Result:

- 62 tests passed
- 0 failed

Follow-up live temp-workspace replay:

```bash
node /root/.nvm/versions/node/v24.7.0/lib/node_modules/oh-my-codex/dist/cli/omx.js cancel ralph --stale
```

Observed output for the terminal-scoped + root-stale scenario:

```text
Cancelled stale Ralph session.
session_id: sess-current
reason: stuck_in_starting_without_execution_artifacts
cleared:
  - legacy global ralph-state
  - matching skill-active-state
```

That confirms the installed OMX runtime now handles the second edge case that
appeared after the original implementation audit.

## Publication Status

The verified upstream/source replay is no longer only local:

- clean branch: `stale-ralph-clean-pr-v2`
- clean commits:
  - `1193124` `Allow safe cleanup of stale Ralph startup state`
  - `bf1b47d` `Handle stale Ralph cleanup when scoped state already terminated`
- closed wrong-base PR:
  - `Yeachan-Heo/oh-my-codex#1505`
  - closed by owner because repository changes must target `dev`, not `main`
- closed `dev`-base PR:
  - `Yeachan-Heo/oh-my-codex#1509`
  - <https://github.com/Yeachan-Heo/oh-my-codex/pull/1509>
  - closed by the owner at `2026-04-12T15:45:57Z`
  - owner note: the lifecycle / termination contract change was too broad to merge as-is and needs a narrower maintainer-led pass
- `dev`-base commit series at PR close:
  - `e8c9244` `Allow safe cleanup of stale Ralph startup state`
  - `6897673` `Handle stale Ralph cleanup when scoped state already terminated`
  - `7707816` `Harden stale Ralph cleanup for portable evidence paths`
  - `0022b24` `Clear stale root Ralph skill state during scoped cleanup`
- post-close PR-branch state at the verified fork-only stop point:
  - `46622fa` `Preserve repo-local stale evidence across Windows paths`
  - review reply: <https://github.com/Yeachan-Heo/oh-my-codex/pull/1509#discussion_r3069689242>
  - focused verification at that stop point: `85/85` passing

That dev-based publication attempt superseded the earlier local-only replay state, preserved
the clean commit series, and moved the same scope onto the repository's
required `dev` base after the owner closed the original `main`-targeted PR.
A later review loop on `#1509` added two more targeted hardening commits, then
flagged one more Windows-path-on-POSIX edge case, and finally ended with the
owner closing the PR instead of taking the contract change in its current form.
That review-point fix now survives only at the verified fork-only stop point and
in the review reply, not in an active upstream PR.

## Earlier Live Re-Verification Before The Post-Closure Replay

Later on 2026-04-12, the workspace re-entered the stale root
compatibility shape:

- root `.omx/state/ralph-state.json` was `active: true` with
  `current_phase: "starting"`
- root `.omx/state/skill-active-state.json` was still `active: true`
- the session-scoped Ralph and skill states for
  `019d7893-fada-7db0-b2a5-b23e02bc9b6c` were already terminal/inactive

Re-running the canonical operator command:

```bash
omx cancel ralph --stale
```

returned:

```text
Cancelled stale Ralph session.
session_id: 019d7893-fada-7db0-b2a5-b23e02bc9b6c
reason: stuck_in_starting_without_execution_artifacts
cleared:
  - legacy global ralph-state
  - matching skill-active-state
```

After that replay:

- root `.omx/state/ralph-state.json` was terminalized to
  `active: false`, `current_phase: "cancelled"`
- root `.omx/state/skill-active-state.json` was `active: false`
- a fresh Stop-hook replay again returned `outputJson: null`

That second live replay confirms the installed command remains the shortest safe
operator fix for the recurring stale-Ralph warning in this workspace.

A later fresh replay after the closed-PR / fork-follow-up audit line reached the
same result again. At that point:

- root `.omx/state/ralph-state.json` had regressed to `active: true`,
  `current_phase: "starting"`
- root `.omx/state/skill-active-state.json` had regressed to `active: true`
- `omx cancel ralph --stale` again returned `Cancelled stale Ralph session.`
  with `reason: stuck_in_starting_without_execution_artifacts`
- root `.omx/state/ralph-state.json` was then terminalized with
  `completed_at: "2026-04-12T16:04:28.274Z"`
- root `.omx/state/skill-active-state.json` was again reduced to
  `active: false`, `active_skills: []`
- a fresh `omx status` after that replay again reported
  `ralph: inactive (phase: cancelled)` and `skill-active: inactive`

That post-closure replay confirms the local operator command still safely clears
new stale root Ralph state even after the upstream PR was closed.

## Residual Risk

- The implementation lives in an installed package path, not in a tracked source
  repository, so it can be overwritten by reinstall or upgrade.
- The upstream source patch is still not vendored into GitNexus.
- PR `#1509` is now closed, and the owner explicitly said the lifecycle /
  termination contract change needs a narrower maintainer-led pass before any
  upstream adoption.
- The later Windows-path-on-POSIX fix (`46622fa`, `85/85`) remains at the
  verified fork-only stop point and in the closed PR discussion, but not on an
  active maintainer-owned upstream handoff path.
- The broader compiled persistence suite still has environment/package-layout
  failures that mask a totally clean green run.

## Recommended Next Step

Keep `omx cancel ralph --stale` as the local operator fix, preserve the
verified fork-only stop point (`46622fa`, `85/85`), and monitor for the
maintainer-led narrower follow-up that the owner said would be needed before
any maintainer-owned upstream handoff restarts.

As of 2026-04-13, a fresh upstream check still shows no new maintainer-led
follow-up PR, issue, or branch carrying this narrower stale-cleanup contract.
