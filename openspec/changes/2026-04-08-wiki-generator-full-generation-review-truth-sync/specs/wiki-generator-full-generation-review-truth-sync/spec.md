# wiki-generator-full-generation-review-truth-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the historical wiki full-generation review aligned with merged-state records

GitNexus SHALL keep the historical `wiki-generator-full-generation` review doc
aligned with the repository's current merged-state records after the
full-generation extraction has landed.

#### Scenario: A maintainer reads the historical wiki full-generation review doc

- **WHEN** a maintainer reads
  `2026-03-28-wiki-generator-full-generation-review.md`
- **THEN** the document does not incorrectly present the landed extraction as
  still blocked before implementation
- **AND** it identifies the `failedModules` finding as resolved in the landed
  helper/wrapper implementation
- **AND** it remains available as a historical review record rather than being
  deleted or silently rewritten as if no review occurred
