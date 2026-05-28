# GPU Device Node Structured Doctor Output Design

Date: 2026-04-07
Status: Approved in conversation
Scope: `gitnexus/src/cli/doctor.ts`, targeted tests, audit/OpenSpec/roadmap docs

## Goal

Expose machine-readable GPU device-node diagnostics in `doctor --json`.

## Design Decision

Use the same additive `DoctorCheck.data` pattern:

- keep the current `detail` text
- attach structured data to `gpu-device-node`
- encode platform, checked paths, visible nodes, and skipped state in one payload

## Why This Design

`runGpuDoctorChecks()` already computes exactly these values. Keeping them only
in prose makes downstream automation brittle for a check that both Claude Code
and Codex flows may rely on.

The slice stays low risk because it changes only the JSON transport, not the
GPU detection behavior.

## Rejected Alternatives

### Structure all GPU checks together

Rejected because the GPU branch has several heavier subpaths; `gpu-device-node`
is the cleanest low-risk first slice.

### Only expose visible nodes

Rejected because callers would still need to infer whether the result was a
Linux check or a non-Linux skip.

### Rework WSL guidance while structuring output

Rejected because operator guidance text is a separate concern from transport.

## Success Criteria

- `gpu-device-node` emits structured `data`
- Linux visible-node and missing-node paths are covered by focused tests
- existing detail text remains unchanged
