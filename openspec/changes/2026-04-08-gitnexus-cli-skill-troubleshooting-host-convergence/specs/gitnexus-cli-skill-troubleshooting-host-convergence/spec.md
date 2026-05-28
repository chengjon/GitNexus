# gitnexus-cli-skill-troubleshooting-host-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep `gitnexus-cli` stale-index troubleshooting aligned with the current dual-CLI host framing

GitNexus SHALL keep both `gitnexus-cli` skill-doc surfaces aligned with the
repository's current dual-CLI host framing when describing stale-index recovery
after re-analyzing.

#### Scenario: A maintainer reads either `gitnexus-cli` troubleshooting section

- **WHEN** they read `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` or
  `gitnexus/skills/gitnexus-cli.md`
- **THEN** the docs describe stale-index recovery as reconnecting the MCP host
  session to the updated index
- **AND** they explicitly name restarting Claude Code as the Claude Code path
- **AND** they explicitly name restarting the Codex session when the existing
  MCP connection still shows stale context as the Codex path
- **AND** the two doc surfaces stay semantically aligned
