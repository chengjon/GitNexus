# omx-stale-ralph-implementation-body-boundary-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the preserved stale-Ralph implementation audit body clearly bounded from current execution reading

GitNexus SHALL keep the preserved body sections in
`docs/audits/2026-04-12-omx-stale-ralph-cancel-implementation.md` explicitly
marked as 2026-04-12 historical implementation and replay context.

#### Scenario: A maintainer reads below the top implementation status line

- **WHEN** they continue into the `Publication Status` or
  `Recommended Next Step` sections
- **THEN** the page explicitly warns that those replay and follow-up statements
  remain the 2026-04-12 implementation baseline
- **AND** the audits entrypoint also frames that record as historical
  implementation context rather than current open execution work
