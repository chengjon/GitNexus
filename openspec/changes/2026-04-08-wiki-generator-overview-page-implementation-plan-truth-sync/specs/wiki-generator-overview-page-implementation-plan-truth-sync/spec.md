# wiki-generator-overview-page-implementation-plan-truth-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the historical wiki overview-page implementation plan aligned with merged-state records

GitNexus SHALL keep the historical `wiki-generator-overview-page`
implementation plan aligned with the repository's current merged-state records
after the extraction has landed.

#### Scenario: A maintainer reads the historical wiki overview-page implementation plan

- **WHEN** a maintainer reads
  `2026-03-27-wiki-generator-overview-page-implementation-plan.md`
- **THEN** the plan does not incorrectly show the landed extraction as still
  open
- **AND** it points readers to the truth-synced design record, roadmap, and
  current source/test anchors as merged-state truth sources
- **AND** it does not reopen the already-landed overview-page extraction
  itself
