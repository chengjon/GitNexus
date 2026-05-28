# wiki-generator-incremental-update-implementation-plan-truth-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the historical wiki incremental-update implementation plan aligned with merged-state records

GitNexus SHALL keep the historical `wiki-generator-incremental-update`
implementation plan aligned with the repository's current merged-state records
after the extraction has landed.

#### Scenario: A maintainer reads the historical wiki incremental-update implementation plan

- **WHEN** a maintainer reads
  `2026-03-27-wiki-generator-incremental-update-implementation-plan.md`
- **THEN** the plan does not incorrectly show the landed extraction as still
  open
- **AND** it points readers to the truth-synced design record, technical-debt
  audit, and roadmap as merged-state truth sources
- **AND** it does not reopen the already-landed incremental-update extraction
  itself
