# detect-changes-claude-code-cwd-live-probe Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep a current Claude Code live-probe record for detect_changes cwd behavior

GitNexus SHALL keep a current live-probe record of whether Claude Code
automatically injects `cwd` into detect_changes-like MCP tool calls.

#### Scenario: A maintainer reads the worktree review after the Claude Code probe

- **WHEN** a maintainer reads the worktree review and related audit docs
- **THEN** Claude Code is no longer grouped with generic unverified host debt
- **AND** the docs state that the 2026-04-07 live probe observed tool calls with `scope` only and no auto-injected `cwd`
- **AND** the remaining open host probes are narrowed to Cursor and other clients
