## Why

The repository's shared dual-CLI freshness guidance already distinguishes
Claude Code automatic post-mutation reindexing from Codex manual reruns.
However, both `gitnexus-cli` skill-doc surfaces still mention only the Claude
Code automatic path.

That leaves a documentation mismatch between the skill docs and the rest of the
repository's current dual-CLI freshness contract.

## What Changes

- Update both `gitnexus-cli` skill-doc surfaces so they keep the Claude Code
  automatic note and add the Codex manual rerun note
- Keep the source skill and package skill copy aligned
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `gitnexus-cli-skill-dual-cli-freshness-convergence`: Keep the `gitnexus-cli`
  skill docs aligned with the repository's current Claude Code automatic /
  Codex manual freshness guidance.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `.claude/skills/gitnexus/gitnexus-cli/SKILL.md`
  - `gitnexus/skills/gitnexus-cli.md`
  - `docs/audits/2026-04-08-gitnexus-cli-skill-dual-cli-freshness-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - dual-cli post-mutation freshness guidance
  - quick-start dual-cli freshness wording
