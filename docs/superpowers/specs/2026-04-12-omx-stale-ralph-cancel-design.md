# OMX Stale Ralph Cancel Design

> Status note: historical design record only. The verified local/operator replay, the verified fork-only stop point `46622fa`, and the closed-PR stop point are documented in the 2026-04-12 stale-Ralph audits and OpenSpec records. Treat those audit/OpenSpec files as the authoritative completion history, not this earlier proposed design status.

**Date**: 2026-04-12
**Status**: Historical design record
**Scope**: OMX mode-state cleanup command design

## Goal

Add a safe OMX command that clears the recurring warning:

```text
warning: OMX Ralph is still active (phase: starting)
```

without forcing users to manually inspect or delete `.omx/state/*` files.

The command should handle the specific case where Ralph was activated, state was
written, but the workflow never progressed beyond startup and now behaves like a
stale residual mode.

## Recommended Command

```bash
omx cancel ralph --stale
```

Optional future extensions:

```bash
omx cancel ralph --stale --session <session-id>
omx cancel ralph --stale --all-stale
```

## Why Reuse `cancel`

This should extend the existing `cancel` surface instead of inventing a new
top-level command.

Reasons:

- `cancel` already owns OMX mode shutdown semantics.
- Ralph termination rules are already defined through the cancel workflow.
- Users already learn "active mode cleanup" through `cancel`.
- A separate `cleanup stale-ralph` command would duplicate mode-state authority.

## Problem Statement

Current observed failure mode:

- `ralph` becomes active through keyword detection.
- session/global state is written under `.omx/state/.../ralph-state.json`.
- `skill-active-state.json` also marks `ralph` as active.
- required Ralph startup artifacts are missing:
  - no `.omx/context/*`
  - no `.omx/plans/*`
- state remains stuck at `current_phase: "starting"`.
- OMX stop hooks continue warning because the mode still looks active.

This is not the same as a healthy Ralph run that is executing or verifying.

## Functional Requirements

### 1. Command behavior

`omx cancel ralph --stale` must:

- inspect current-session Ralph state by default
- determine whether the state qualifies as stale
- if stale, terminalize Ralph cleanly instead of silently deleting files
- clear the matching active-skill marker when it points to the same session
- optionally clear the legacy global Ralph state when it is clearly a stale
  compatibility artifact for the same workspace

### 2. Default scope

Default scope must be the current session only.

The command must not mutate unrelated sessions unless the user explicitly opts
into a broader mode such as `--all-stale`.

### 3. Post-conditions

When stale cancellation succeeds, Ralph state should end in a terminal form,
not simply vanish:

- `active=false`
- `current_phase="cancelled"`
- `completed_at=<timestamp>`

If a matching `skill-active-state` record still points at the same session and
mode, it should also be marked inactive or cleared by the existing cancel path.

## Stale Detection

The command should only take stale cleanup action when all of the following are
true for the targeted session:

1. `mode == "ralph"`
2. `active == true`
3. `current_phase` is `starting`
   - future-compatible option: also allow `planning` if OMX later writes that
     phase into Ralph mode state
4. no `.omx/context/*` snapshot exists for the active session/task
5. no `.omx/plans/*` PRD/test-spec/progress artifacts exist for the run
6. no linked mode is active in the same scope
   - especially `ultrawork` or `ecomode`
7. the state is older than a small threshold
   - recommended default: 2 minutes minimum

This combination separates a stale half-started Ralph run from a legitimate
fresh startup.

## Refusal Cases

`omx cancel ralph --stale` must refuse and print a short reason when:

- Ralph is already in `executing`, `verifying`, or `fixing`
- `.omx/context/*` exists for the run
- `.omx/plans/*` exists for the run
- linked execution modes are active
- the state is too fresh to confidently call stale
- a different session owns the active Ralph state and no `--session` was given

In those cases, the user should be told to use:

```bash
omx cancel ralph
```

## Output Contract

### Success output

Success output should be short and structured:

```text
Cancelled stale Ralph session.
session_id: <id>
reason: stuck_in_starting_without_context_or_plans
cleared:
  - session ralph-state
  - matching skill-active-state
  - legacy global ralph-state
```

### Refusal output

Refusal output should also be short:

```text
Refused stale Ralph cancellation.
reason: session has context snapshot and is not stale
next: use `omx cancel ralph`
```

## Safety Rules

- Do not clear unrelated sessions by default.
- Do not clear non-Ralph modes.
- Do not use `--stale` as an alias for `--force`.
- Do not remove evidence needed for debugging without first terminalizing the
  state through the normal cancel semantics.
- Prefer session-scoped authority first; touch legacy global files only as a
  compatibility cleanup step.

## CLI Integration

Based on the current CLI structure, the natural integration point is the OMX
cancel command surface, not GitNexus CLI.

The design expectation is:

- extend the existing OMX cancel command parser
- add a Ralph-targeted stale branch under `cancel`
- route to the same Ralph terminalization logic used by ordinary cancel
- prepend stale-guard evaluation before destructive cleanup

The GitNexus repository only needs this design artifact; actual OMX CLI changes
may live in the OMX codebase if the command is implemented upstream.

## Test Plan

Minimum automated cases:

1. stale Ralph session in `starting` with no context/plans -> cancels
2. Ralph in `starting` but updated less than threshold ago -> refuses
3. Ralph in `executing` -> refuses
4. Ralph with `.omx/context/*` present -> refuses
5. Ralph with `.omx/plans/*` present -> refuses
6. Ralph with linked `ultrawork`/`ecomode` active -> refuses
7. session-scoped stale cancel does not mutate a different active session
8. stale cancel also clears matching skill-active marker
9. stale cancel terminalizes legacy global Ralph state only when it matches the
   current workspace/session cleanup conditions

## Migration / Rollout Notes

- Ship the command as an additive extension to `cancel`.
- Keep ordinary `omx cancel ralph` unchanged.
- Document `--stale` in cancel help text as the fix for warnings caused by
  half-started Ralph sessions.
- Avoid automatically invoking `--stale` from hooks until the guard logic is
  proven safe.

## Recommendation

Implement exactly one new operator-facing form first:

```bash
omx cancel ralph --stale
```

and defer `--session` / `--all-stale` until the first version proves reliable.
