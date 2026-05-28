# kuzu-review-plan-body-boundary-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the preserved kuzu dependency-review implementation plan body clearly bounded from current execution reading

GitNexus SHALL keep the preserved body sections in
`docs/superpowers/plans/2026-04-06-kuzu-dependency-review-implementation-plan.md`
explicitly marked as 2026-04-06 historical planning context.

#### Scenario: A maintainer reads below the plan title

- **WHEN** they continue into the `Goal`, `Architecture`, or checked task
  sections
- **THEN** the page explicitly warns that those plan and checkbox statements
  remain the 2026-04-06 planning-time baseline
- **AND** it clarifies that the later dependency-review audit and OpenSpec
  records, not the plan prose itself, control completion-history reading
