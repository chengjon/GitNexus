## Why

`doctor --json` still emits `gpu-ollama-runtime` mostly as prose even though
the GPU doctor path already knows the provider, embed-probe status, whether
`/api/ps` was queried, and what model / `size_vram` result was observed.

This shared doctor contract needs to stay machine readable regardless of
whether the operator reaches it via Claude Code or Codex.

## What Changes

- Add structured `data` to `gpu-ollama-runtime` checks
- Reuse the existing provider/probe/runtime results
- Keep the current detail string unchanged
- Add focused regression coverage for GPU-offload pass and CPU-fallback fail paths
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `gpu-ollama-runtime-structured-doctor-output`: Keep Ollama GPU runtime
  diagnostics machine readable for shared dual-CLI doctor flows.

### Modified Capabilities

- None.

## Impact

- Affected runtime code:
  - `gitnexus/src/cli/doctor.ts`
- Affected tests:
  - `gitnexus/test/unit/doctor.test.ts`
- Affected docs:
  - `docs/audits/2026-04-07-gpu-ollama-runtime-structured-doctor-output.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
