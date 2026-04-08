# gitnexus-refactoring-skill-rename-taxonomy-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep `gitnexus-refactoring` skill rename taxonomy aligned with the current contract

GitNexus SHALL keep both `gitnexus-refactoring` skill-doc surfaces aligned with
the current rename preview taxonomy.

#### Scenario: A maintainer reads either `gitnexus-refactoring` skill doc

- **WHEN** they read `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`
  or `gitnexus/skills/gitnexus-refactoring.md`
- **THEN** the docs describe lower-confidence rename edits as `text_search`
  rather than `ast_search`
- **AND** the examples and checklist stay semantically aligned with the current
  `graph` / `text_search` taxonomy
