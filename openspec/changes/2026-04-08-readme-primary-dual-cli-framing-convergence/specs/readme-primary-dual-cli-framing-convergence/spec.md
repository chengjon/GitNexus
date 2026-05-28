# readme-primary-dual-cli-framing-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep shared README host framing aligned with the primary dual-CLI support surface

GitNexus SHALL keep `README.md` and `gitnexus/README.md` aligned with the
repository's primary maintained CLI support surface of `Claude Code + Codex`
while preserving optional MCP integration guidance for other hosts.

#### Scenario: A maintainer reads the shared README host support sections

- **WHEN** they read the root or package README host-support sections
- **THEN** the documents explicitly lead with `Claude Code + Codex` as the
  primary maintained pair
- **AND** they still preserve optional MCP setup guidance for other hosts such
  as Cursor, Windsurf, and OpenCode
- **AND** the docs do not blur the required primary pair with optional
  integrations into one undifferentiated support statement
