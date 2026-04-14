# gitnexus-exploring-alias-guidance-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep `gitnexus-exploring` alias guidance aligned with the current tool aliases

GitNexus SHALL keep both `gitnexus-exploring` skill-doc surfaces aligned with
the current tool alias guidance for exploration workflows.

#### Scenario: A maintainer reads either `gitnexus-exploring` skill doc

- **WHEN** they read `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md`
  or `gitnexus/skills/gitnexus-exploring.md`
- **THEN** the docs explicitly note that `search` is an alias for `query`
- **AND** they explicitly note that `explore` is an alias for `context`
- **AND** the rest of the exploring workflow remains unchanged
