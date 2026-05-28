## Why

The historical `docs/superpowers/specs/2026-04-12-omx-stale-ralph-cancel-design.md`
page already says that later audits and OpenSpec records control completion
history, but once readers enter the preserved `Goal`, `Recommended Command`,
and `Recommendation` sections there is no extra local boundary note explaining
that those statements remain the 2026-04-12 design baseline rather than a
current active implementation queue.

That still leaves room for the preserved design body to be mistaken for live
execution guidance.

## What Changes

- Add an explicit historical-design note before the preserved design body
- Add an explicit note before `Recommended Command` clarifying proposed-surface
  scope
- Add an explicit note before `Recommendation` clarifying historical rollout
  posture
- Record the boundary sync in audit and OpenSpec docs

## Capabilities

### New Capabilities

- `omx-stale-ralph-design-body-boundary-sync`: Keep the preserved body of the
  2026-04-12 stale-Ralph design clearly marked as historical design context.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/specs/2026-04-12-omx-stale-ralph-cancel-design.md`
  - `docs/audits/2026-04-15-omx-stale-ralph-design-body-boundary-sync.md`
  - `openspec/changes/2026-04-15-omx-stale-ralph-design-body-boundary-sync/**`
- Reused truth sources:
  - current 2026-04-12 stale-Ralph design record
  - current 2026-04-12 stale-Ralph implementation and replay records
