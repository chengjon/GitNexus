## Why

`doctor --json` still emits `gpu-host-runtime` mostly as prose even though the
GPU doctor path already knows whether `nvidia-smi` succeeded, what its exit
metadata was, and what output summary was captured.

This shared doctor contract needs to stay machine readable regardless of
whether the operator reaches it via Claude Code or Codex.

## What Changes

- Add structured `data` to `gpu-host-runtime` checks
- Reuse the existing `nvidia-smi` command result metadata
- Keep the current detail string unchanged
- Add focused regression coverage for pass and `ENOENT` warn paths
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `gpu-host-runtime-structured-doctor-output`: Keep host GPU runtime
  diagnostics machine readable for shared dual-CLI doctor flows.

### Modified Capabilities

- None.

## Impact

- Affected runtime code:
  - `gitnexus/src/cli/doctor.ts`
- Affected tests:
  - `gitnexus/test/unit/doctor.test.ts`
- Affected docs:
  - `docs/audits/2026-04-07-gpu-host-runtime-structured-doctor-output.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
