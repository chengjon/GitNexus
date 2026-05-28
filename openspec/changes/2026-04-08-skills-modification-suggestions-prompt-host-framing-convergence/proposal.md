## Why

The repository's shared README and host-governance docs now distinguish the
primary maintained CLI surface (`Claude Code + Codex`) from host-specific UX
details. However, `docs/gitnexus-skills-modification-suggestions.md` still
shows a Claude Code prompt-invocation example without explicitly marking it as a
host-specific example.

That leaves a documentation-layer mismatch: readers can misread the section as
either Claude Code only support or as an implied equal prompt UX guarantee for
Codex and other hosts.

## What Changes

- Update the skills modification suggestions doc so its prompt example is
  clearly marked as a Claude Code specific host example
- Preserve the repository's primary `Claude Code + Codex` support framing
  without inventing new Codex prompt-syntax claims
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `skills-modification-suggestions-prompt-host-framing-convergence`: Keep the
  skills modification suggestions doc aligned with the repository's dual-CLI
  support framing while keeping prompt invocation wording host-specific.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/gitnexus-skills-modification-suggestions.md`
  - `docs/audits/2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - shared README prompt wording
  - dual-CLI host-governance conclusion
  - shared README host-framing convergence
