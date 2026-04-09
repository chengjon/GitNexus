# GPU Fix Structured Doctor Output Design

Date: 2026-04-07  
Status: Approved in conversation  
Scope: `gitnexus/src/cli/doctor.ts`, targeted tests, audit/OpenSpec/roadmap docs

## Goal

Expose machine-readable GPU fix-summary diagnostics in `doctor --json`.

## Design Decision

Use the same additive `DoctorCheck.data` pattern:

- keep the current `detail` text
- attach structured data to `gpu-fix`
- expose applied safe fixes and manual follow-ups as arrays

## Why This Design

`runGpuDoctorChecks()` already tracks `fixActions` and `manualActions`
separately. Keeping them only in prose makes downstream automation brittle.

The slice stays low risk because it changes only the JSON transport, not fix
behavior.

## Rejected Alternatives

### Leave gpu-fix as prose-only summary

Rejected because it is the only remaining GPU summary check without a machine
contract.

### Structure fix behavior and execution policy together

Rejected because execution policy is a separate concern from transport.

## Success Criteria

- `gpu-fix` emits structured `data`
- focused tests cover at least one safe-fix application path
- existing detail text remains unchanged
