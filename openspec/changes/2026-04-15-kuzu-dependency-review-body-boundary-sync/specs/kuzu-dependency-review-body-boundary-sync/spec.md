# kuzu-dependency-review-body-boundary-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the preserved kuzu dependency review body clearly bounded from current package-policy reading

GitNexus SHALL keep the preserved body sections in
`docs/audits/2026-04-06-kuzu-dependency-review.md` explicitly marked as
2026-04-06 review-only dependency-governance baseline context.

#### Scenario: A maintainer reads below the review-only status line

- **WHEN** they continue into the `Provisional Recommendation`,
  `Immediate Operating Rule`, or `Recommended Next Step` sections
- **THEN** the page explicitly warns that those recommendations remain the
  2026-04-06 review-only baseline
- **AND** the page explains that the later exit-strategy record controls
  current tracked-exception and reopen-trigger reading
