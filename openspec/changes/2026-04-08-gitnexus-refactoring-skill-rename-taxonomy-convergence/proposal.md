## Why

The `gitnexus-refactoring` skill still uses the old `ast_search` label for
lower-confidence rename edits, even though the current rename contract uses the
`graph` / `text_search` taxonomy.

That leaves both the source and package refactoring skill docs behind the
current rename preview vocabulary.

## What Changes

- Update both `gitnexus-refactoring` skill-doc surfaces to replace
  `ast_search` with `text_search`
- Keep the examples and checklist aligned with the current rename taxonomy
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `gitnexus-refactoring-skill-rename-taxonomy-convergence`: Keep the source
  and package `gitnexus-refactoring` skill docs aligned with the current rename
  taxonomy.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`
  - `gitnexus/skills/gitnexus-refactoring.md`
  - `docs/audits/2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - current refactoring skill docs
  - current rename taxonomy contract
