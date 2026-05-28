# upstream-shared-replay-body-boundary-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the preserved upstream shared replay review body clearly bounded from current live-baseline reading

GitNexus SHALL keep the preserved body sections in
`docs/audits/2026-04-06-upstream-shared-doc-replay-review.md` explicitly
marked as 2026-04-06 refreshed-fetch baseline context.

#### Scenario: A maintainer reads below the top status-sync pointer

- **WHEN** they continue into the `Refresh Summary` or `High-Level Decision`
  sections
- **THEN** the page explicitly warns that those replay counts and decision
  statements remain the 2026-04-06 refreshed-fetch baseline
- **AND** the page explains that the later 2026-04-08 follow-up record
  controls current live-baseline reading
