## Why

`docs/gitnexus-quick-start-guide.md` already says the repository's primary
maintained CLI surface is `Claude Code + Codex`, but the per-host section still
labels Claude Code as `完整支持`, which can be misread as a support-tier split.

That leaves a small but real wording drift inside a secondary entrypoint doc.

## What Changes

- Remove the single-host `Claude Code（完整支持）` label
- Add wording that clarifies Claude Code and Codex differ in host UX and
  automation behavior, not in support-tier status
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `quick-start-dual-cli-label-parity-convergence`: Keep the quick-start guide's
  per-host labels aligned with the repository's dual-CLI primary support
  framing.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/gitnexus-quick-start-guide.md`
  - `docs/audits/2026-04-08-quick-start-dual-cli-label-parity-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - current quick-start guide
  - secondary-entrypoint host-framing convergence
  - remediation roadmap
