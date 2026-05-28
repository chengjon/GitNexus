# ai-cli-local-quick-start-host-framing-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the local AI CLI quick start aligned with the primary dual-CLI host framing

GitNexus SHALL keep `docs/ai-cli-local-quick-start.md` aligned with the
repository's primary maintained `Claude Code + Codex` host framing while
preserving the document's concrete local MCP expectations for those two hosts.

#### Scenario: A maintainer reads the local AI CLI quick start

- **WHEN** they read `docs/ai-cli-local-quick-start.md`
- **THEN** the document explicitly states that the local fork's primary
  maintained CLI surface is `Claude Code + Codex`
- **AND** it does not imply that every external MCP host is part of the same
  maintained support surface
- **AND** it continues to provide concrete local expectations for Codex and
  Claude Code
