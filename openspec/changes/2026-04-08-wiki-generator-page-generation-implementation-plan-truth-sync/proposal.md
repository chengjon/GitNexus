## Why

The historical `wiki-generator-page-generation` implementation plan still shows
the extraction workflow as open even though the current repository already
contains the extracted leaf/parent page-generation modules plus focused tests.

The drift is between stale historical implementation/design docs and the
repository's current merged-state records.

## What Changes

- Truth-sync the historical `wiki-generator-page-generation` implementation
  plan to current merged-state evidence
- Update the historical design record so it no longer reads as an active draft
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `wiki-generator-page-generation-implementation-plan-truth-sync`: Keep the
  historical wiki page-generation implementation plan aligned with the
  repository's current merged-state records.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/plans/2026-03-26-wiki-generator-page-generation-implementation-plan.md`
  - `docs/superpowers/specs/2026-03-26-wiki-generator-page-generation-design.md`
  - `docs/audits/2026-04-08-wiki-generator-page-generation-implementation-plan-truth-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - current wiki page-generation source and test anchors
  - current `generator.ts` import boundary
