## Why

The historical `docs/superpowers/plans/2026-04-12-omx-stale-ralph-cancel-implementation-plan.md`
page already says that later audits and OpenSpec records control completion
history, but once readers enter the preserved `Goal`, `Architecture`, and
unchecked task sections there is no extra local boundary note explaining that
those statements remain the 2026-04-12 plan baseline rather than a current
active implementation board.

That still leaves room for the preserved plan body to be mistaken for live
execution guidance.

## What Changes

- Add an explicit historical implementation-plan note before the preserved plan body
- Add an explicit note before the unchecked task sections clarifying historical
  planning scope
- Record the boundary sync in audit and OpenSpec docs

## Capabilities

### New Capabilities

- `omx-stale-ralph-plan-body-boundary-sync`: Keep the preserved body of the
  2026-04-12 stale-Ralph implementation plan clearly marked as historical
  planning context.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/plans/2026-04-12-omx-stale-ralph-cancel-implementation-plan.md`
  - `docs/audits/2026-04-15-omx-stale-ralph-plan-body-boundary-sync.md`
  - `openspec/changes/2026-04-15-omx-stale-ralph-plan-body-boundary-sync/**`
- Reused truth sources:
  - current 2026-04-12 stale-Ralph implementation plan
  - current 2026-04-12 stale-Ralph implementation and replay records
