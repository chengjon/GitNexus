## Why

The historical `docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design-review.md`
page already has top-level status-sync framing, but once readers enter the
preserved `整体评价` and `总结` sections there is still no extra local boundary
note explaining that those review structures remain the 2026-03-27
design-review baseline.

That still leaves room for the preserved suggestions to be mistaken for a
current implementation gate on the landed slice.

## What Changes

- Add an explicit historical-review note before the preserved review body
- Add an explicit note before `总结` clarifying that the recommendations are
  review-time only
- Record the boundary sync in audit and roadmap docs

## Capabilities

### New Capabilities

- `support-run-pipeline-review-body-boundary-sync`: Keep the preserved body of
  the 2026-03-27 support/run-pipeline review clearly marked as design-review
  baseline context.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design-review.md`
  - `docs/audits/2026-04-15-support-run-pipeline-review-body-boundary-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
  - `openspec/changes/2026-04-15-support-run-pipeline-review-body-boundary-sync/**`
- Reused truth sources:
  - current historical support/run-pipeline review
  - current 2026-04-08 truth-sync record
