## Why

`doctor --json` still emits `gpu-container-runtime` mostly as prose even though
the GPU doctor path already knows whether the container probe was attempted,
whether it succeeded, and what exit metadata and output summary were produced.

This shared doctor contract needs to stay machine readable regardless of
whether the operator reaches it via Claude Code or Codex.

## What Changes

- Add structured `data` to `gpu-container-runtime` checks
- Reuse the existing container probe result metadata and skip state
- Keep the current detail string unchanged
- Add focused regression coverage for successful-probe and missing-container paths
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `gpu-container-runtime-structured-doctor-output`: Keep container GPU runtime
  diagnostics machine readable for shared dual-CLI doctor flows.

### Modified Capabilities

- None.

## Impact

- Affected runtime code:
  - `gitnexus/src/cli/doctor.ts`
- Affected tests:
  - `gitnexus/test/unit/doctor.test.ts`
- Affected docs:
  - `docs/audits/2026-04-07-gpu-container-runtime-structured-doctor-output.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
