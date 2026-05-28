## Why

The historical `repo-hygiene-doc-convergence` implementation plan still shows
three unchecked commit steps even though its OpenSpec task ledger is fully
complete and the change still validates.

This creates false-open plan debt and makes a closed governance slice look
unfinished.

## What Changes

- Truth-sync the repo-hygiene implementation plan to its completed OpenSpec
  task ledger
- Add an execution-status sync note that points readers at the task-truth source
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `repo-hygiene-implementation-plan-truth-sync`: Keep the historical
  repo-hygiene implementation plan aligned with the recorded completion state of
  the original OpenSpec change.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/plans/2026-04-06-repo-hygiene-doc-convergence-implementation-plan.md`
  - `docs/audits/2026-04-07-repo-hygiene-implementation-plan-truth-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Verified prior change:
  - `2026-04-06-repo-hygiene-doc-convergence`
