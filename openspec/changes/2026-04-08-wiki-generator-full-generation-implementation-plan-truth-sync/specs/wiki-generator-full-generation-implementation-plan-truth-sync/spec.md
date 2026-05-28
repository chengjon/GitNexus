# wiki-generator-full-generation-implementation-plan-truth-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the historical wiki full-generation implementation plan aligned with merged-state records

GitNexus SHALL keep the historical `wiki-generator-full-generation`
implementation plan aligned with the repository's current merged-state records
after the extraction has landed.

#### Scenario: A maintainer reads the historical wiki full-generation implementation plan

- **WHEN** a maintainer reads
  `2026-03-28-wiki-generator-full-generation-implementation-plan.md`
- **THEN** the plan does not incorrectly show the landed extraction as still
  open
- **AND** it points readers to the truth-synced design record,
  `2026-03-28` technical-debt audit, roadmap, and current source/test anchors
  as merged-state truth sources
- **AND** it does not reopen the already-landed full-generation extraction
  itself
- **AND** it does not preserve an outdated `failedModules` contract that
  disagrees with the landed helper/wrapper behavior
