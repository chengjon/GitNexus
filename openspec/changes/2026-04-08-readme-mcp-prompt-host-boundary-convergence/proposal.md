## Why

The repository's shared README docs already distinguish the primary maintained
CLI surface (`Claude Code + Codex`) from optional integrations. However, the
root README's MCP prompt section still shows a Claude Code direct prompt example
without an explicit note that this is a host-specific UX example.

That leaves a small documentation mismatch: readers can miss the boundary
between dual-CLI support framing and host-specific prompt invocation syntax.

## What Changes

- Update the root README prompt section so the direct `@gitnexus ...` syntax is
  explicitly marked as a Claude Code specific host example
- Preserve the repository's primary `Claude Code + Codex` support framing
  without inventing new prompt-syntax claims for other hosts
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `readme-mcp-prompt-host-boundary-convergence`: Keep the root README's MCP
  prompt section aligned with dual-CLI support framing while keeping direct
  prompt syntax wording host-specific.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `README.md`
  - `docs/audits/2026-04-08-readme-mcp-prompt-host-boundary-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - dual-CLI host-governance conclusion
  - shared README host-framing convergence
  - skills-suggestion prompt-host convergence
