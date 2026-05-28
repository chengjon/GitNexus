## Why

The historical `docs/superpowers/plans/2026-04-06-kuzu-dependency-review-implementation-plan.md`
page still preserves the original `Goal`, `Architecture`, and checked task
breakdown, but it does not yet explicitly say that later audit/OpenSpec records
are the authoritative completion history for this slice.

That still leaves room for the preserved implementation-plan body to be
mistaken for a current active dependency-review plan.

## What Changes

- Add an explicit historical implementation-plan note before the preserved plan body
- Add an explicit note before the checked task sections clarifying historical
  planning scope
- Add a top status note pointing readers to the authoritative follow-up audit
  and OpenSpec records
- Record the boundary sync in audit and OpenSpec docs

## Capabilities

### New Capabilities

- `kuzu-review-plan-body-boundary-sync`: Keep the preserved body of the
  2026-04-06 `kuzu` dependency-review implementation plan clearly marked as
  historical planning context.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/plans/2026-04-06-kuzu-dependency-review-implementation-plan.md`
  - `docs/audits/2026-04-15-kuzu-review-plan-body-boundary-sync.md`
  - `openspec/changes/2026-04-15-kuzu-review-plan-body-boundary-sync/**`
- Reused truth sources:
  - current 2026-04-06 `kuzu` dependency-review implementation plan
  - current 2026-04-06 `kuzu` dependency-review audit and OpenSpec records
