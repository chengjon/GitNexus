## Why

`doctor --json` still emits `gpu-docker-config` mostly as prose even though the
GPU doctor path already knows whether the Ollama container exists, whether
Docker inspect succeeded, and which GPU-related config fields are missing.

This shared doctor contract needs to stay machine readable regardless of
whether the operator reaches it via Claude Code or Codex.

## What Changes

- Add structured `data` to `gpu-docker-config` checks
- Reuse the existing Docker inspect results and derived config fields
- Keep the current detail string unchanged
- Add focused regression coverage for healthy-container and missing-container paths
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `gpu-docker-config-structured-doctor-output`: Keep Docker GPU config
  diagnostics machine readable for shared dual-CLI doctor flows.

### Modified Capabilities

- None.

## Impact

- Affected runtime code:
  - `gitnexus/src/cli/doctor.ts`
- Affected tests:
  - `gitnexus/test/unit/doctor.test.ts`
- Affected docs:
  - `docs/audits/2026-04-07-gpu-docker-config-structured-doctor-output.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
