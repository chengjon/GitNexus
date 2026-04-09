# GPU Host Runtime Structured Doctor Output Design

Date: 2026-04-07
Status: Approved in conversation
Scope: `gitnexus/src/cli/doctor.ts`, targeted tests, audit/OpenSpec/roadmap docs

## Goal

Expose machine-readable GPU host-runtime diagnostics in `doctor --json`.

## Design Decision

Use the same additive `DoctorCheck.data` pattern:

- keep the current `detail` text
- attach structured data to `gpu-host-runtime`
- encode command, success flag, exit code, error code, and summary in one payload

## Why This Design

`runGpuDoctorChecks()` already computes exactly these values from the
`nvidia-smi` probe. Keeping them only in prose makes downstream automation
brittle for a shared GPU diagnostic surface.

The slice stays low risk because it changes only the JSON transport, not the
host runtime detection behavior.

## Rejected Alternatives

### Structure all command-backed GPU checks together

Rejected because `gpu-host-runtime` is the cleanest next slice after
`gpu-device-node`; the other command-backed checks add Docker/Ollama branching.

### Only expose `ok` and `errorCode`

Rejected because callers would still need to parse detail text to recover the
important summary string.

### Rework `nvidia-smi` guidance while structuring output

Rejected because operator guidance text is separate from transport.

## Success Criteria

- `gpu-host-runtime` emits structured `data`
- pass and `ENOENT` warn paths are covered by focused tests
- existing detail text remains unchanged
