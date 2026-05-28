## Why

`doctor --json` already exposes structured `host-config` data for evaluated host
plans, but the unknown-host and no-host-requested branches still emit prose
only.

That leaves the transport inconsistent for callers that must support both
Claude Code and Codex host flows.

## What Changes

- Add structured `data` to the `host-config` unknown-host branch
- Add structured `data` to the `host-config` no-host-requested branch
- Keep the current detail strings unchanged
- Add focused regression coverage for both edge paths
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `host-config-edge-structured-output`: Keep `host-config` edge-state results
  machine readable in `doctor --json`.

### Modified Capabilities

- None.

## Impact

- Affected runtime code:
  - `gitnexus/src/cli/doctor.ts`
- Affected tests:
  - `gitnexus/test/unit/doctor.test.ts`
- Affected docs:
  - `docs/audits/2026-04-07-host-config-edge-structured-output.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
