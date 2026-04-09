# GPU Container Runtime Structured Doctor Output Design

Date: 2026-04-07
Status: Approved in conversation
Scope: `gitnexus/src/cli/doctor.ts`, targeted tests, audit/OpenSpec/roadmap docs

## Goal

Expose machine-readable GPU container-runtime diagnostics in `doctor --json`.

## Design Decision

Use the same additive `DoctorCheck.data` pattern:

- keep the current `detail` text
- attach structured data to `gpu-container-runtime`
- encode command, attempted flag, success flag, exit metadata, summary, and skipped state in one payload

## Why This Design

`runGpuDoctorChecks()` already computes exactly these values around the container
probe. Keeping them only in prose makes downstream automation brittle for a
shared GPU diagnostic surface.

The slice stays low risk because it changes only the JSON transport, not the
container probe behavior.

## Rejected Alternatives

### Structure container runtime together with Ollama runtime

Rejected because `gpu-ollama-runtime` depends on a later `/api/ps` branch and
is a separate behavioral surface.

### Only expose `attempted` and `ok`

Rejected because callers still need the summary and exit metadata to make good
automation decisions.

### Rework skip logic while structuring output

Rejected because skip policy is separate from transport.

## Success Criteria

- `gpu-container-runtime` emits structured `data`
- successful probe and missing-container skip paths are covered by focused tests
- existing detail text remains unchanged
