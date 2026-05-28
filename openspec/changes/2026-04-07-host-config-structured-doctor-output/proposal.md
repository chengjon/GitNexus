## Why

`doctor --json` still emits `host-config` mostly as prose even though the host
evaluation path already has the exact structured facts needed by automation:
which host was evaluated, whether it was detected, whether it was configured,
and whether manual setup is expected.

This is particularly relevant because the repository must continue to support
both Claude Code and Codex.

## What Changes

- Add structured `data` to evaluated `host-config` checks
- Reuse existing host detection/configuration/manual-setup results
- Keep the current detail string unchanged
- Add focused regression coverage for Codex and Claude Code paths
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `host-config-structured-doctor-output`: Keep host configuration diagnostics
  machine readable for dual-CLI environments.

### Modified Capabilities

- None.

## Impact

- Affected runtime code:
  - `gitnexus/src/cli/doctor.ts`
- Affected tests:
  - `gitnexus/test/unit/doctor.test.ts`
- Affected docs:
  - `docs/audits/2026-04-07-host-config-structured-doctor-output.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
