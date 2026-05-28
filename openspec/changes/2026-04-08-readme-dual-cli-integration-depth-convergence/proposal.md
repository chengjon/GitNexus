## Why

The repository already treats `Claude Code + Codex` as the primary maintained
CLI surface, and recent doc slices already removed most single-host framing.

However, `README.md` and `gitnexus/README.md` still retain smaller wording
residuals such as `Support`, `Full`, and `full support`, which can still be
read as a support-tier split rather than an integration-depth difference.

## What Changes

- Rename the shared README support-profile wording to host-neutral integration
  wording
- Replace `Full` / `full support` labels with explicit integration descriptors
- Add clarification that Codex remains part of the primary maintained CLI
  surface and differs only in integration depth and automation today
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `readme-dual-cli-integration-depth-convergence`: Keep the shared README host
  wording aligned with the repository's dual-CLI primary support surface
  without implying a support-tier split.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `README.md`
  - `gitnexus/README.md`
  - `docs/audits/2026-04-08-readme-dual-cli-integration-depth-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - shared README primary dual-CLI framing convergence
  - quick-start dual-CLI label parity convergence
  - current remediation roadmap
