# dual-cli-doctor-worktree-guidance Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL expose host-specific detect_changes guidance for Codex and Claude Code in doctor output

GitNexus SHALL expose explicit `detect_changes` worktree guidance when users run
`gitnexus doctor --host codex` or `gitnexus doctor --host claude-code`.

#### Scenario: A user inspects Codex host readiness

- **WHEN** a user runs `gitnexus doctor --host codex`
- **THEN** doctor output includes a guidance check explaining that worktree
  scenarios may require explicit `cwd`, along with the existing MCP readiness
  result

#### Scenario: A user inspects Claude Code host readiness

- **WHEN** a user runs `gitnexus doctor --host claude-code`
- **THEN** doctor output includes a guidance check explaining when explicit
  `cwd` should be passed if the server cwd may not match the active worktree

#### Scenario: A user runs doctor without targeting a dual CLI host

- **WHEN** a user runs `gitnexus doctor` without `--host codex` or `--host claude-code`
- **THEN** the host-specific guidance check is not added to the general output
