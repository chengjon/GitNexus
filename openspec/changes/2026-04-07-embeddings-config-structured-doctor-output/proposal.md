## Why

`doctor --json` still emits `embeddings-config` as a human-readable detail
string even though `runDoctor()` already has the exact structured config snapshot
and Ollama probe result in memory.

That leaves a determinism-critical check on a brittle string contract.

## What Changes

- Add structured `data` to the `embeddings-config` check
- Reuse `EmbeddingsConfigSnapshot` for effective config, sources, and precedence
- Include the Ollama probe result in `data.probe`
- Keep the current detail string unchanged
- Add focused regression coverage for success and warning probe cases
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `embeddings-config-structured-doctor-output`: Keep the embeddings doctor check
  machine readable without changing the current text summary.

### Modified Capabilities

- None.

## Impact

- Affected runtime code:
  - `gitnexus/src/cli/doctor.ts`
- Affected tests:
  - `gitnexus/test/unit/doctor.test.ts`
- Affected docs:
  - `docs/audits/2026-04-07-embeddings-config-structured-doctor-output.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
