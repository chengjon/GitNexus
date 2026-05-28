# dual-cli-manual-mcp-command-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL derive Claude Code and Codex manual MCP instructions from the real platform command entry

GitNexus SHALL render Claude Code and Codex manual MCP registration
instructions from the same `McpEntry` platform command data used for host
configuration.

#### Scenario: Non-Windows manual setup instructions are shown

- **WHEN** a maintainer or user requests manual MCP setup instructions for
  Claude Code or Codex on a non-Windows host
- **THEN** GitNexus shows the host-specific `mcp add gitnexus -- npx -y
  gitnexus@latest mcp` command derived from the configured `McpEntry`

#### Scenario: Windows manual setup instructions are shown

- **WHEN** a maintainer or user requests manual MCP setup instructions for
  Claude Code or Codex on Windows
- **THEN** GitNexus shows the host-specific `mcp add gitnexus -- cmd /c npx -y
  gitnexus@latest mcp` command derived from the configured `McpEntry`

### Requirement: GitNexus SHALL keep shared dual-CLI manual setup docs aligned with the rendered command behavior

GitNexus SHALL keep the shared manual setup docs for Claude Code and Codex in
sync with the rendered manual MCP command behavior.

#### Scenario: A maintainer updates manual setup guidance

- **WHEN** shared documentation presents manual Claude Code or Codex MCP setup
  examples
- **THEN** the wording reflects the same cross-platform command behavior as the
  host adapters instead of a hard-coded non-Windows-only command
