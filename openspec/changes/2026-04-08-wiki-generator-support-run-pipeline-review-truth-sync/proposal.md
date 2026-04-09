## Why

The historical `wiki-generator-support-run-pipeline` review doc still frames
the slice as something that must fix review issues before entering
implementation even though the current repository already contains the landed
support-helper and run-pipeline modules plus focused tests.

The drift is between stale review wording and the repository's current
merged-state records.

## What Changes

- Truth-sync the historical `wiki-generator-support-run-pipeline` review doc to
  current merged-state evidence
- Reframe the review as a historical record instead of a current gate
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `wiki-generator-support-run-pipeline-review-truth-sync`: Keep the
  historical wiki support/run-pipeline review doc aligned with the repository's
  current merged-state records.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design-review.md`
  - `docs/audits/2026-04-08-wiki-generator-support-run-pipeline-review-truth-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - truth-synced historical design record
  - current wiki support/run-pipeline source and test anchors
  - current roadmap status
