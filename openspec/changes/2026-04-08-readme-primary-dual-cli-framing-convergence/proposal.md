## Why

The repository's governance docs already treat `Claude Code + Codex` as the
required primary CLI support surface, while Cursor and other MCP hosts are
optional follow-up integrations.

However, the root and package READMEs still frame all hosts at the same level.
That creates support-surface drift in the entry docs.

## What Changes

- Update the shared READMEs so they explicitly lead with `Claude Code + Codex`
  as the primary maintained pair
- Keep Cursor, Windsurf, and OpenCode documented as optional MCP integrations
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `readme-primary-dual-cli-framing-convergence`: Keep the shared README host
  framing aligned with the repository's primary `Claude Code + Codex` support
  surface.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `README.md`
  - `gitnexus/README.md`
  - `docs/audits/2026-04-08-readme-primary-dual-cli-framing-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - existing dual-CLI host-governance conclusion
  - current roadmap statement that `Codex + Claude Code` is the required pair
