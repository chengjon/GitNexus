# gitnexus-guide-skill-schema-alias-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep `gitnexus-guide` skill alias and schema summaries aligned with the current contract

GitNexus SHALL keep both `gitnexus-guide` skill-doc surfaces aligned with the
current alias and graph schema contract.

#### Scenario: A maintainer reads either `gitnexus-guide` skill doc

- **WHEN** they read `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` or
  `gitnexus/skills/gitnexus-guide.md`
- **THEN** the docs mention `search` → `query` and `explore` → `context`
- **AND** the graph schema summary includes the fuller current node/edge set,
  including `Folder`, `CodeElement`, `HAS_METHOD`, and `OVERRIDES`
- **AND** the two doc surfaces stay semantically aligned
