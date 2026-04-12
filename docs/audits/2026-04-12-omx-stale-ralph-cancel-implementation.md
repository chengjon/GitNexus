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

## Residual Risk

- The implementation lives in an installed package path, not in a tracked source
  repository, so it can be overwritten by reinstall or upgrade.
- No upstream source patch was produced in this repository.
- The broader compiled persistence suite still has environment/package-layout
  failures that mask a totally clean green run.

## Recommended Next Step

Replay the same change into the canonical `oh-my-codex` source repository and
commit it there, so the new command survives package rebuilds and upgrades.
