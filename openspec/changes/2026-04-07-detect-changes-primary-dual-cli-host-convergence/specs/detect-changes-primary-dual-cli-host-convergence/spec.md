# detect-changes-primary-dual-cli-host-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep detect_changes host-governance aligned with its required primary dual-CLI surface

GitNexus SHALL keep `detect_changes` host-governance documents aligned with the
repository’s required primary CLI support surface: Codex and Claude Code.

#### Scenario: A maintainer reads the worktree review after dual-CLI host convergence

- **WHEN** a maintainer reads the host-governance docs after the convergence slice
- **THEN** the docs state that Codex and Claude Code are the repository’s
  required primary host surface for `detect_changes` guidance
- **AND** the docs record that neither host may be assumed to auto-inject `cwd`
  based on current repo evidence
- **AND** Cursor and other clients are tracked only as optional external
  follow-up rather than as blocking repository debt
