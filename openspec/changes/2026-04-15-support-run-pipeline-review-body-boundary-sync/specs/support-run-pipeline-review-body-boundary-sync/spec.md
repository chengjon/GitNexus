# support-run-pipeline-review-body-boundary-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the preserved support/run-pipeline review body clearly bounded from current-gate reading

GitNexus SHALL keep the preserved body sections in
`docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design-review.md`
explicitly marked as 2026-03-27 design-review context.

#### Scenario: A maintainer reads below the top status-sync framing

- **WHEN** they continue into the `整体评价` or `总结` sections
- **THEN** the page explicitly warns that those sections remain design-review
  baseline context
- **AND** the page explains that the preserved suggestions are not a current
  implementation gate on the landed slice
