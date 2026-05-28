## Why

`doctor --json` still emits `gpu-fix` mostly as prose even though the GPU
doctor path already knows which safe fixes were applied and which manual
follow-ups remain.

This shared doctor contract needs to stay machine readable regardless of
whether the operator reaches it via Claude Code or Codex.

## What Changes

- Add structured `data` to `gpu-fix` checks
- Reuse the existing fix-action and manual-action arrays
- Keep the current detail string unchanged
- Add focused regression coverage for a safe-fix application path
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `gpu-fix-structured-doctor-output`: Keep GPU fix-summary diagnostics machine
  readable for shared dual-CLI doctor flows.

### Modified Capabilities

- None.

## Impact

- Affected runtime code:
  - `gitnexus/src/cli/doctor.ts`
- Affected tests:
  - `gitnexus/test/unit/doctor.test.ts`
- Affected docs:
  - `docs/audits/2026-04-07-gpu-fix-structured-doctor-output.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
