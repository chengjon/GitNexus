## Why

The `gitnexus-guide` skill is still missing parts of the current GitNexus
surface area in both its source and package forms. It does not mention the
`search`/`explore` aliases, and its graph schema summary still omits newer
node and edge types such as `Folder`, `CodeElement`, `HAS_METHOD`, and
`OVERRIDES`.

That leaves the primary guide skill lagging behind the current tool and schema
contract.

## What Changes

- Update both `gitnexus-guide` skill-doc surfaces to mention the
  `search`/`explore` aliases
- Expand the graph schema summary to the current node and edge set
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `gitnexus-guide-skill-schema-alias-convergence`: Keep the source and package
  `gitnexus-guide` skill docs aligned with the current alias and graph schema
  contract.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `.claude/skills/gitnexus/gitnexus-guide/SKILL.md`
  - `gitnexus/skills/gitnexus-guide.md`
  - `docs/audits/2026-04-08-gitnexus-guide-skill-schema-alias-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - current guide skill docs
  - `docs/gitnexus-skills-review.md`
  - current GitNexus tool/schema contract
