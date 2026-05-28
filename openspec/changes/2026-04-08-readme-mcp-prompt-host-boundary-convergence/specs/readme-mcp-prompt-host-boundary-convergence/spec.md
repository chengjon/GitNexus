# readme-mcp-prompt-host-boundary-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the root README's MCP prompt example host-specific and aligned with dual-CLI support framing

GitNexus SHALL keep the root `README.md` MCP prompt section aligned with the
repository's primary maintained `Claude Code + Codex` support framing while
marking direct prompt invocation syntax as host-specific when the example is
documented for only one host.

#### Scenario: A maintainer reads the root README prompt section

- **WHEN** they read the MCP prompt section in `README.md`
- **THEN** the document explicitly states that the shown `@gitnexus ...`
  invocation is a Claude Code specific host example
- **AND** it does not imply that every primary or optional host exposes the same
  direct prompt syntax
- **AND** it still preserves the repository's primary maintained
  `Claude Code + Codex` CLI framing
