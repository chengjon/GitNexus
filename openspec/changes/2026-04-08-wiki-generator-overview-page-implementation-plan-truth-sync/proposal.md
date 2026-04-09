## Why

The historical `wiki-generator-overview-page` implementation plan still shows
the extraction workflow as open even though the current repository already
contains the extracted overview-page module plus focused tests.

The drift is between stale historical implementation/design docs and the
repository's current merged-state records.

## What Changes

- Truth-sync the historical `wiki-generator-overview-page` implementation plan
  to current merged-state evidence
- Update the historical design record so it no longer reads as an active draft
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `wiki-generator-overview-page-implementation-plan-truth-sync`: Keep the
  historical wiki overview-page implementation plan aligned with the
  repository's current merged-state records.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/plans/2026-03-27-wiki-generator-overview-page-implementation-plan.md`
  - `docs/superpowers/specs/2026-03-27-wiki-generator-overview-page-design.md`
  - `docs/audits/2026-04-08-wiki-generator-overview-page-implementation-plan-truth-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - current wiki overview-page source and test anchors
  - current `generator.ts` import boundary
