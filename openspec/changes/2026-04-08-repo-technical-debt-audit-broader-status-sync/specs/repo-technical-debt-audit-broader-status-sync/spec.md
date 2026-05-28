# repo-technical-debt-audit-broader-status-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the 2026-04-06 repo technical-debt audit readable after later stale-doc convergence work

GitNexus SHALL keep `2026-04-06-repo-technical-debt-and-residual-audit.md`
readable after later stale-doc convergence work without allowing its original
repair-order wording to be mistaken for an untouched current backlog.

#### Scenario: A maintainer reads the historical 2026-04-06 repo audit

- **WHEN** a maintainer reads `2026-04-06-repo-technical-debt-and-residual-audit.md`
- **THEN** the document points readers at later stale-doc / repair-order
  follow-up records before they treat the original repair order as still
  wholly current
- **AND** it preserves the original baseline findings instead of deleting them
- **AND** it still indicates that the 2026-04-06 audit is a historical baseline,
  not the sole current status board
