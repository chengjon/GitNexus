# GPU Docker Config Structured Doctor Output Design

Date: 2026-04-07
Status: Approved in conversation
Scope: `gitnexus/src/cli/doctor.ts`, targeted tests, audit/OpenSpec/roadmap docs

## Goal

Expose machine-readable GPU Docker-config diagnostics in `doctor --json`.

## Design Decision

Use the same additive `DoctorCheck.data` pattern:

- keep the current `detail` text
- attach structured data to `gpu-docker-config`
- encode container presence, inspect status, runtime/config values, and missing items in one payload

## Why This Design

`runGpuDoctorChecks()` already computes these Docker facts. Keeping them only in
prose makes downstream automation brittle for a shared GPU diagnostic surface.

The slice stays low risk because it changes only the JSON transport, not Docker
inspection or fix behavior.

## Rejected Alternatives

### Structure Docker config and container runtime together

Rejected because `gpu-container-runtime` is a separate command-backed check with
its own branching and transport needs.

### Only expose `missingConfig`

Rejected because callers still need to know whether the check was skipped due
to missing container or failed after a real inspect.

### Rework Docker fix behavior while structuring output

Rejected because automatic fix policy is separate from transport.

## Success Criteria

- `gpu-docker-config` emits structured `data`
- healthy-container and missing-container paths are covered by focused tests
- existing detail text remains unchanged
