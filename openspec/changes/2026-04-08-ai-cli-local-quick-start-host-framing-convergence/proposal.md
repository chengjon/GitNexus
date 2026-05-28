## Why

The repository's shared README docs and secondary entrypoint docs now
distinguish the primary maintained CLI surface (`Claude Code + Codex`) from
optional or analogy-only external MCP hosts. However,
`docs/ai-cli-local-quick-start.md` still reads like a generic AI CLI entrypoint
without a clear host-scope boundary.

That leaves a documentation-layer mismatch between the local quick start and the
rest of the repository's current host-governance framing.

## What Changes

- Update the AI CLI local quick start so it explicitly states the local fork's
  primary maintained CLI pair
- Keep the document's concrete expectations scoped to Codex and Claude Code
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `ai-cli-local-quick-start-host-framing-convergence`: Keep the local AI CLI
  quick start aligned with the repository's primary `Claude Code + Codex`
  host framing.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/ai-cli-local-quick-start.md`
  - `docs/audits/2026-04-08-ai-cli-local-quick-start-host-framing-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - shared README host-framing convergence
  - secondary entrypoint host-framing convergence
  - dual-CLI host-governance conclusion
