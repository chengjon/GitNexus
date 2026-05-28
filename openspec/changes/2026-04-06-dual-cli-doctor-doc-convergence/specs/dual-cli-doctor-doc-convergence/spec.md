# dual-cli-doctor-doc-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep dual-CLI doctor and detect_changes guidance aligned across primary entry docs

GitNexus SHALL document the current dual-CLI host names and worktree guidance
consistently across its primary user-entry docs.

#### Scenario: A user verifies Codex or Claude Code readiness from the main docs

- **WHEN** a user follows the shared quick-start and README doctor commands
- **THEN** the docs use `gitnexus doctor --host codex` and
  `gitnexus doctor --host claude-code` rather than stale host names
- **AND** the docs show that `--repo` should be supplied for the target
  repository when checking a specific repo

#### Scenario: A user learns detect_changes workflow from quick-start docs

- **WHEN** a user reads the main quick-start guides for `detect_changes`
- **THEN** the examples mention explicit `repo` usage in multi-repo sessions
- **AND** the docs explain that worktrees or mismatched MCP server cwd require
  explicit `cwd`

#### Scenario: A user reads analyze output expectations in quick-start docs

- **WHEN** a user reads the quick-start setup steps
- **THEN** the docs distinguish default `analyze` output from the additional
  repo-context outputs produced by `--with-context`
