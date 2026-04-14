# technical-debt-audit-body-boundary-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep preserved technical-debt audit status tables clearly bounded from current-state reading

GitNexus SHALL keep the preserved status tables in
`docs/superpowers/specs/2026-03-28-technical-debt-audit.md` explicitly marked
as 2026-03-28 worktree-era baseline context.

#### Scenario: A maintainer reads the preserved status tables

- **WHEN** they continue into the `Design Documents Status` or
  `Tech Debt Roadmap Progress` sections
- **THEN** the page explicitly warns that those status tables remain
  worktree-era baseline context
- **AND** the page points readers back to the remediation roadmap and later
  truth-sync records for current-state guidance
