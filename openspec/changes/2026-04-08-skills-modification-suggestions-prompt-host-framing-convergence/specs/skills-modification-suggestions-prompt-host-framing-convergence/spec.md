# skills-modification-suggestions-prompt-host-framing-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep prompt invocation examples in the skills modification suggestions doc host-specific and aligned with dual-CLI support framing

GitNexus SHALL keep `docs/gitnexus-skills-modification-suggestions.md`
aligned with the repository's primary maintained `Claude Code + Codex` support
framing while marking direct prompt invocation syntax as host-specific when the
example is only documented for one host.

#### Scenario: A maintainer reads the MCP prompt suggestion section

- **WHEN** they read the MCP prompt section in
  `docs/gitnexus-skills-modification-suggestions.md`
- **THEN** the document explicitly states that the shown `@gitnexus ...`
  invocation is a Claude Code specific example
- **AND** it does not imply that every primary or optional host exposes the same
  direct prompt syntax
- **AND** it still preserves the repository's primary maintained
  `Claude Code + Codex` CLI framing
