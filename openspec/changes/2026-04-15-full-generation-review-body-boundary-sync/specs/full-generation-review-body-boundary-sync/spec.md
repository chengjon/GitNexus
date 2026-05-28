# full-generation-review-body-boundary-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the preserved full-generation review body clearly bounded from current-gate reading

GitNexus SHALL keep the preserved body sections in
`docs/superpowers/specs/2026-03-28-wiki-generator-full-generation-review.md`
explicitly marked as 2026-03-28 design-review context.

#### Scenario: A maintainer reads below the top status-sync framing

- **WHEN** they continue into the `Verdict` or `Summary` sections
- **THEN** the page explicitly warns that those sections remain design-review
  baseline context
- **AND** the page explains that the preserved blocker/severity wording is not
  a current implementation gate on the landed slice
