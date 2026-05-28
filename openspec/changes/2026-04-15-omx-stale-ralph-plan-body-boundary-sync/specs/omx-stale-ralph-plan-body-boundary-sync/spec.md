# omx-stale-ralph-plan-body-boundary-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the preserved stale-Ralph implementation plan body clearly bounded from current execution reading

GitNexus SHALL keep the preserved body sections in
`docs/superpowers/plans/2026-04-12-omx-stale-ralph-cancel-implementation-plan.md`
explicitly marked as 2026-04-12 historical planning context.

#### Scenario: A maintainer reads below the plan status note

- **WHEN** they continue into the `Goal`, `Architecture`, or unchecked task
  sections
- **THEN** the page explicitly warns that those plan and checkbox statements
  remain the 2026-04-12 planning-time baseline
- **AND** it clarifies that later audits and OpenSpec records, not the
  unchecked task list, control completion-history reading
