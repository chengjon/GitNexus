# GPU Ollama Runtime Structured Doctor Output Design

Date: 2026-04-07  
Status: Approved in conversation  
Scope: `gitnexus/src/cli/doctor.ts`, targeted tests, audit/OpenSpec/roadmap docs

## Goal

Expose machine-readable GPU Ollama-runtime diagnostics in `doctor --json`.

## Design Decision

Use the same additive `DoctorCheck.data` pattern:

- keep the current `detail` text
- attach structured data to `gpu-ollama-runtime`
- encode provider, probe status, query status, model, `size_vram`, skip state, and branch reason in one payload

## Why This Design

`runGpuDoctorChecks()` already computes these values around the Ollama runtime
probe. Keeping them only in prose makes downstream automation brittle for a
shared GPU diagnostic surface.

The slice stays low risk because it changes only the JSON transport, not the
Ollama runtime detection behavior.

## Rejected Alternatives

### Structure only pass/fail cases

Rejected because the warn branches are exactly where machine-readable reasons
matter most.

### Expose only model and `size_vram`

Rejected because callers still need to know whether `/api/ps` was queried or
whether the check was skipped before that point.

### Rework probe sequencing while structuring output

Rejected because sequencing is separate from transport.

## Success Criteria

- `gpu-ollama-runtime` emits structured `data`
- GPU-offload pass and CPU-fallback fail paths are covered by focused tests
- existing detail text remains unchanged
