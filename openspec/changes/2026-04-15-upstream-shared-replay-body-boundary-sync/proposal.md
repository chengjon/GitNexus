## Why

The historical `docs/audits/2026-04-06-upstream-shared-doc-replay-review.md`
page already has a later follow-up pointer at the top, but once readers enter
the preserved `Refresh Summary` and `High-Level Decision` sections there is no
extra local boundary note explaining that those replay counts and “right now”
phrases remain the 2026-04-06 refreshed-fetch baseline.

That still leaves room for the preserved replay baseline body to be mistaken
for the current live replay cut line.

## What Changes

- Add an explicit historical-baseline note before the preserved replay-summary
  body
- Add an explicit note before `High-Level Decision` clarifying that the later
  follow-up record controls current live-baseline reading
- Record the boundary sync in audit and roadmap docs

## Capabilities

### New Capabilities

- `upstream-shared-replay-body-boundary-sync`: Keep the preserved body of the
  2026-04-06 upstream shared-doc replay review clearly marked as
  refreshed-fetch baseline context.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/audits/2026-04-06-upstream-shared-doc-replay-review.md`
  - `docs/audits/2026-04-15-upstream-shared-replay-body-boundary-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
  - `openspec/changes/2026-04-15-upstream-shared-replay-body-boundary-sync/**`
- Reused truth sources:
  - current 2026-04-06 upstream replay baseline
  - current 2026-04-08 follow-up replay record
