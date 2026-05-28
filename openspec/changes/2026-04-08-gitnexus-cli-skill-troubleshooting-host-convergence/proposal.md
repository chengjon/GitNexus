## Why

The repository already treats `Claude Code + Codex` as its primary maintained
CLI surface, and the `gitnexus-cli` skill now reflects that in its freshness
guidance. However, the troubleshooting section still tells readers only to
restart Claude Code when the index remains stale after re-analyzing.

That leaves a documentation mismatch inside the same skill doc: the main
guidance is dual-CLI, but the stale-index recovery wording falls back to a
single-host narrative.

## What Changes

- Update both `gitnexus-cli` skill-doc surfaces so stale-index troubleshooting
  uses host-neutral reconnect wording
- Explicitly name the corresponding recovery action for Claude Code and Codex
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `gitnexus-cli-skill-troubleshooting-host-convergence`: Keep the
  `gitnexus-cli` skill troubleshooting wording aligned with the repository's
  current dual-CLI host framing.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `.claude/skills/gitnexus/gitnexus-cli/SKILL.md`
  - `gitnexus/skills/gitnexus-cli.md`
  - `docs/audits/2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - prior dual-cli freshness convergence audit
  - quick-start dual-cli host wording
