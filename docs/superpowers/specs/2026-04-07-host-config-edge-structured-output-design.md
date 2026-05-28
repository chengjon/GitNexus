# Host Config Edge Structured Output Design

Date: 2026-04-07
Status: Approved in conversation
Scope: `gitnexus/src/cli/doctor.ts`, targeted tests, audit/OpenSpec/roadmap docs

## Goal

Expose machine-readable edge-state diagnostics for `host-config` in
`doctor --json`, specifically for the unknown-host and no-host-requested paths.

## Design Decision

Use the same additive `DoctorCheck.data` pattern:

- keep the current `detail` text
- attach structured edge-state data to the two `host-config` early-return branches
- encode requested host, match result, skip state, and reason code in one payload

## Why This Design

The prior `host-config` slice covered only evaluated host plans. The remaining
early-return branches still forced automation to parse prose.

This slice stays low risk because it changes only the JSON transport for two
already-existing edge paths, and it preserves Claude Code / Codex support
without changing host resolution behavior.

## Rejected Alternatives

### Leave edge branches prose-only

Rejected because the main `host-config` contract is already structured; leaving
the early-return branches unstructured would keep the transport inconsistent.

### Fold these edge states into the evaluated host schema

Rejected because these branches do not describe an evaluated host plan. They
describe a skipped or rejected request and need their own minimal edge payload.

### Limit the edge payload to `reasonCode` only

Rejected because downstream automation also needs to know the originally
requested host value and whether host evaluation was skipped.

## Success Criteria

- `host-config` emits structured `data` for unknown-host and no-host-requested paths
- focused regression tests lock both edge branches
- existing detail text remains unchanged
