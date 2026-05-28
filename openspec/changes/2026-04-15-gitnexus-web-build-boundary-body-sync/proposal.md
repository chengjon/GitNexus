## Why

The historical `docs/audits/2026-04-06-gitnexus-web-build-boundary-fix.md`
page already states that the fix was completed and verified in the current
repository, but once readers enter the preserved `Problem`, `Fix`,
`Verification`, and `Residual Notes` sections there is no extra local boundary
note explaining that those statements remain the 2026-04-06 fixed build-boundary
baseline rather than current open build-failure work.

That still leaves room for the preserved audit body to be mistaken for a live
frontend blocker.

## What Changes

- Add an explicit historical-fix note before the preserved build-fix body
- Add an explicit note before `Residual Notes` clarifying historical post-fix
  scope
- Record the boundary sync in audit and roadmap docs

## Capabilities

### New Capabilities

- `gitnexus-web-build-boundary-body-sync`: Keep the preserved body of the
  2026-04-06 `gitnexus-web` build-boundary fix audit clearly marked as
  historical fixed-and-verified context.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/audits/2026-04-06-gitnexus-web-build-boundary-fix.md`
  - `docs/audits/2026-04-15-gitnexus-web-build-boundary-body-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
  - `openspec/changes/2026-04-15-gitnexus-web-build-boundary-body-sync/**`
- Reused truth sources:
  - current 2026-04-06 `gitnexus-web` build-boundary fix audit
  - current remediation roadmap frontend follow-up guidance
