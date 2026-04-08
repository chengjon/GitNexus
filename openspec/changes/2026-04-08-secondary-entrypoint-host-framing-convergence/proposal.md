## Why

The repository's shared README docs now distinguish the primary maintained CLI
surface (`Claude Code + Codex`) from optional MCP integrations. However,
secondary entrypoint docs still retain older host framing.

That leaves a documentation-layer mismatch between the main entry docs and the
quick-start / eval entrypoints.

## What Changes

- Update the quick-start guide so it explicitly distinguishes the repository's
  primary pair from optional MCP integrations
- Update the eval harness README so its hook analogy uses neutral host wording
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `secondary-entrypoint-host-framing-convergence`: Keep secondary entrypoint
  docs aligned with the repository's primary `Claude Code + Codex` host
  framing.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/gitnexus-quick-start-guide.md`
  - `eval/README.md`
  - `docs/audits/2026-04-08-secondary-entrypoint-host-framing-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - shared README host-framing convergence
  - dual-CLI host-governance conclusion
