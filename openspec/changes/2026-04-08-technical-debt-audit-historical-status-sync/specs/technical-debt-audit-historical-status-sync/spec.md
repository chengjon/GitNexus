# technical-debt-audit-historical-status-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the 2026-03-28 technical-debt audit readable as a historical baseline

GitNexus SHALL keep `2026-03-28-technical-debt-audit.md` readable as a
historical worktree-era audit baseline without allowing it to be mistaken for
the current mainline status board.

#### Scenario: A maintainer reads the 2026-03-28 technical-debt audit

- **WHEN** a maintainer reads `2026-03-28-technical-debt-audit.md`
- **THEN** the document clearly signals that it is a historical worktree-era
  baseline
- **AND** it points current-state readers to later status-sync and roadmap
  artifacts before they treat old `pending merge`, `in progress`, or
  `local slice committed` wording as still current
- **AND** it preserves the original historical observations instead of silently
  deleting them
