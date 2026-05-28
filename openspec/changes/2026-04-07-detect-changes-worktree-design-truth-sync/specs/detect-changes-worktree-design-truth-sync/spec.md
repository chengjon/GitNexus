# detect-changes-worktree-design-truth-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep detect_changes worktree design docs aligned with the implemented contract

GitNexus SHALL keep the `detect_changes` worktree design and review docs
aligned with the implemented `cwd` resolution, git identity, metadata, and test
coverage contract.

#### Scenario: A maintainer reads the worktree design or review docs

- **WHEN** a maintainer reads the worktree design or review documentation
- **THEN** the design doc describes the implemented `params.cwd || process.cwd()` resolution behavior
- **AND** it explains the distinction between `--git-common-dir`, `--git-dir`, and `--show-toplevel`
- **AND** the review doc no longer lists design-doc sync as an open item
- **AND** the only remaining open item is external host compatibility research
