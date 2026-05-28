# omx-stale-ralph-upstream-replay-body-boundary-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the preserved stale-Ralph upstream replay note body clearly bounded from current execution reading

GitNexus SHALL keep the preserved body sections in
`docs/audits/2026-04-12-omx-stale-ralph-upstream-replay-note.md` explicitly
marked as 2026-04-12 historical replay context.

#### Scenario: A maintainer reads below the replay note purpose

- **WHEN** they continue into the `Upstream Source Replay Status` or
  `Replay Strategy` sections
- **THEN** the page explicitly warns that those PR, branch, and checklist
  statements remain the 2026-04-12 replay baseline
- **AND** the audits entrypoint also frames that record as historical replay
  context rather than current open execution work
