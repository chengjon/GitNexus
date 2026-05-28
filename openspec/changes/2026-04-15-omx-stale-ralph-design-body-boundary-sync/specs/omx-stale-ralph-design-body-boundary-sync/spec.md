# omx-stale-ralph-design-body-boundary-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the preserved stale-Ralph design body clearly bounded from current execution reading

GitNexus SHALL keep the preserved body sections in
`docs/superpowers/specs/2026-04-12-omx-stale-ralph-cancel-design.md`
explicitly marked as 2026-04-12 historical design context.

#### Scenario: A maintainer reads below the design status note

- **WHEN** they continue into the `Recommended Command` or `Recommendation`
  sections
- **THEN** the page explicitly warns that those command and rollout statements
  remain the 2026-04-12 design-time baseline
- **AND** it clarifies that later audits and OpenSpec records, not the design
  prose itself, control completion-history reading
