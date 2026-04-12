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

## Residual Risk

- The implementation lives in an installed package path, not in a tracked source
  repository, so it can be overwritten by reinstall or upgrade.
- The upstream source patch now exists outside this repository in a separate
  `oh-my-codex` checkout, but that source commit is not vendored into GitNexus.
- Several local commit bodies created during the live repair path were polluted
  by shell-quoting artifacts; push/PR preparation should rewrite those messages
  even though the underlying code and verification results are correct.
- The broader compiled persistence suite still has environment/package-layout
  failures that mask a totally clean green run.

## Recommended Next Step

Push or PR the two upstream `oh-my-codex` commits so both the original
`--stale` command and the terminal-scoped/root-stale fallback fix survive
package rebuilds and upgrades. Before doing that, rewrite the local commit
messages so they keep the validated subjects but drop the shell-quoting damage
captured during the live repair path.
