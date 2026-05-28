## Why

The `gpu-container-runtime-structured-doctor-output` slice is already
complete, but its historical implementation plan still lacks the
execution-status sync treatment used elsewhere in this governance cleanup wave.

That leaves a small false-open governance residual even though the OpenSpec
ledger, audit note, and roadmap all already show completion.

## What Changes

- Add an execution-status sync note to the historical implementation plan
- Record the truth-sync in audit and roadmap docs
- Register the plan-state convergence in OpenSpec

## Capabilities

### New Capabilities

- `gpu-container-runtime-structured-doctor-output-implementation-plan-truth-sync`:
  Keep the historical implementation plan aligned with the completed OpenSpec
  task ledger.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/plans/2026-04-07-gpu-container-runtime-structured-doctor-output-implementation-plan.md`
  - `docs/audits/2026-04-08-gpu-container-runtime-structured-doctor-output-implementation-plan-truth-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - `openspec/changes/2026-04-07-gpu-container-runtime-structured-doctor-output/tasks.md`
  - existing structured-output audit
  - current remediation roadmap
