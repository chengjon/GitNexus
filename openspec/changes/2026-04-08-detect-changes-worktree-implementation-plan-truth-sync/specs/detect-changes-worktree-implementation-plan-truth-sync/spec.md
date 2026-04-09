# detect-changes-worktree-implementation-plan-truth-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the historical detect_changes worktree resolution implementation plan aligned with merged-state records

GitNexus SHALL keep the historical `detect_changes` worktree resolution
implementation plan aligned with the repository's current merged-state records
after the fix has landed.

#### Scenario: A maintainer reads the historical detect_changes implementation plan

- **WHEN** a maintainer reads
  `2026-03-25-detect-changes-worktree-resolution-implementation-plan.md`
- **THEN** the plan does not incorrectly show the landed fix as entirely
  unchecked
- **AND** it points readers to the truth-synced design/review records and
  roadmap as the pre-OpenSpec truth source
- **AND** it does not reopen the already-landed `detect_changes` worktree
  resolution fix itself
