# wiki-generator-support-run-pipeline-review-truth-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the historical wiki support-run-pipeline review aligned with merged-state records

GitNexus SHALL keep the historical
`wiki-generator-support-run-pipeline-design-review` doc aligned with the
repository's current merged-state records after the extraction has landed.

#### Scenario: A maintainer reads the historical wiki support-run-pipeline review doc

- **WHEN** a maintainer reads
  `2026-03-27-wiki-generator-support-run-pipeline-design-review.md`
- **THEN** the document does not incorrectly present the landed slice as still
  waiting to enter implementation
- **AND** it remains available as a historical review record rather than being
  deleted or rewritten as if no review occurred
- **AND** it still preserves the original design-review comments as historical
  context
