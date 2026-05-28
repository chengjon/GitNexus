# gitnexus-cli-skill-dual-cli-freshness-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep `gitnexus-cli` skill docs aligned with the current dual-CLI freshness guidance

GitNexus SHALL keep both `gitnexus-cli` skill-doc surfaces aligned with the
repository's current dual-CLI freshness contract: Claude Code automatic
post-mutation freshness handling and Codex manual rerun guidance.

#### Scenario: A maintainer reads either `gitnexus-cli` skill doc

- **WHEN** they read `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` or
  `gitnexus/skills/gitnexus-cli.md`
- **THEN** the docs still mention the Claude Code `PostToolUse` automatic
  freshness path
- **AND** they also state that Codex currently has no equivalent automatic hook
  and requires a manual `gitnexus analyze` rerun when a fresh index is needed
- **AND** the two doc surfaces stay semantically aligned
