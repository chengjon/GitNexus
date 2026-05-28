## Why

The historical `docs/audits/2026-04-06-kuzu-dependency-review.md` page is
already marked as a review-only decision baseline and already points at the
later exit-strategy follow-up, but once readers enter the preserved
`Provisional Recommendation`, `Immediate Operating Rule`, and
`Recommended Next Step` sections there is no extra local boundary note
explaining that those recommendations remain the 2026-04-06 review-time
dependency-governance baseline rather than the current live package policy.

That still leaves room for the preserved review body to be mistaken for the
current tracked-exception rule source.

## What Changes

- Add an explicit historical-review note before the preserved dependency-review
  body
- Add an explicit note before `Provisional Recommendation` clarifying
  review-time posture
- Add an explicit note before `Immediate Operating Rule` clarifying later
  exit-strategy precedence
- Record the boundary sync in audit and roadmap docs

## Capabilities

### New Capabilities

- `kuzu-dependency-review-body-boundary-sync`: Keep the preserved body of the
  2026-04-06 `kuzu` dependency review clearly marked as review-only baseline
  context.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/audits/2026-04-06-kuzu-dependency-review.md`
  - `docs/audits/2026-04-15-kuzu-dependency-review-body-boundary-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
  - `openspec/changes/2026-04-15-kuzu-dependency-review-body-boundary-sync/**`
- Reused truth sources:
  - current 2026-04-06 `kuzu` dependency review
  - current 2026-04-06 `kuzu` dependency exit strategy
