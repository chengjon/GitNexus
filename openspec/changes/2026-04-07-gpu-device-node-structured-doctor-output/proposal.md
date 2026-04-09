## Why

`doctor --json` still emits `gpu-device-node` mostly as prose even though the
GPU doctor path already knows the current platform, which Linux GPU device node
paths were checked, and which nodes were visible.

This shared doctor contract needs to stay machine readable regardless of
whether the operator reaches it via Claude Code or Codex.

## What Changes

- Add structured `data` to `gpu-device-node` checks
- Reuse the existing platform and visible-node results
- Keep the current detail string unchanged
- Add focused regression coverage for visible-node and missing-node paths
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `gpu-device-node-structured-doctor-output`: Keep GPU device-node diagnostics
  machine readable for shared dual-CLI doctor flows.

### Modified Capabilities

- None.

## Impact

- Affected runtime code:
  - `gitnexus/src/cli/doctor.ts`
- Affected tests:
  - `gitnexus/test/unit/doctor.test.ts`
- Affected docs:
  - `docs/audits/2026-04-07-gpu-device-node-structured-doctor-output.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
