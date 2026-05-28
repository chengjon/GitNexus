# detect-changes-host-compatibility-matrix-baseline Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep a bounded external-host compatibility baseline for detect_changes cwd passthrough

GitNexus SHALL keep a bounded compatibility baseline for how external hosts may
or may not provide the path signals needed for `detect_changes` worktree
correctness.

#### Scenario: A maintainer reads the worktree review after the matrix baseline is recorded

- **WHEN** a maintainer reads the worktree review and related audit docs
- **THEN** they can see a bounded matrix baseline for Claude Code, Codex, and Cursor
- **AND** the docs distinguish documented host capabilities from unverified live behavior
- **AND** the remaining open work is explicitly framed as live probing for hosts that are still unverified
