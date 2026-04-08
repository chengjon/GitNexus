# repo-hygiene-implementation-plan-truth-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the historical repo-hygiene implementation plan aligned with recorded completion

GitNexus SHALL keep the historical `repo-hygiene-doc-convergence`
implementation plan aligned with the completion state recorded in its
corresponding OpenSpec task ledger.

#### Scenario: A maintainer reads the repo-hygiene implementation plan

- **WHEN** a maintainer reads `2026-04-06-repo-hygiene-doc-convergence-implementation-plan.md`
- **THEN** it does not incorrectly leave already-completed historical steps unchecked
- **AND** it points readers to `openspec/changes/2026-04-06-repo-hygiene-doc-convergence/tasks.md` as the execution-truth source
- **AND** it does not reopen the original repository-hygiene implementation work
