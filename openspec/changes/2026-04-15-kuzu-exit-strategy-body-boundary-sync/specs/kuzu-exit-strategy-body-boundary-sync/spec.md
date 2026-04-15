# kuzu-exit-strategy-body-boundary-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the preserved kuzu exit-strategy body clearly bounded from current sole-policy reading

GitNexus SHALL keep the preserved body sections in
`docs/audits/2026-04-06-kuzu-dependency-exit-strategy.md` explicitly marked as
2026-04-06 tracked-exception baseline context.

#### Scenario: A maintainer reads below the follow-up status line

- **WHEN** they continue into the `Exit Criteria` or `Current Decision` sections
- **THEN** the page explicitly warns that those conditions and decision notes
  remain the 2026-04-06 dependency-governance baseline
- **AND** the page explains that current package-policy reading should still
  defer to the remediation roadmap and any later dependency-changing record
