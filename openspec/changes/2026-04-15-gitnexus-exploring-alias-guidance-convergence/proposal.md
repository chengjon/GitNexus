## Why

The `gitnexus-exploring` skill still omits the current GitNexus tool aliases,
even though `search` already maps to `query` and `explore` already maps to
`context`.

That leaves both the source and package exploring skill docs behind the
current alias guidance expected by maintainers exploring an indexed repo.

## What Changes

- Update both `gitnexus-exploring` skill-doc surfaces so they explicitly note
  the current `search`/`query` and `explore`/`context` aliases
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `gitnexus-exploring-alias-guidance-convergence`: Keep the source and package
  `gitnexus-exploring` skill docs aligned with the current alias guidance.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md`
  - `gitnexus/skills/gitnexus-exploring.md`
  - `docs/audits/2026-04-15-gitnexus-exploring-alias-guidance-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - current exploring skill docs
  - historical skills-review note
  - current alias contract
