# Registry Entry Structured Doctor Output Design

Date: 2026-04-07
Status: Approved in conversation
Scope: `gitnexus/src/cli/doctor.ts`, targeted tests, audit/OpenSpec/roadmap docs

## Goal

Expose machine-readable registry entry diagnostics in `doctor --json`.

## Design Decision

Use the same additive `DoctorCheck.data` pattern:

- keep the current `detail` text
- attach structured data for `registry-entry` results
- encode both matched and unmatched states in one payload

## Why This Design

`runDoctor()` already has the current repo path and the matched registry entry,
if any. Keeping that state only in prose makes automation needlessly brittle
for both Claude Code and Codex entrypoints that share this doctor surface.

The slice stays low risk because it changes only the JSON transport, not the
registry matching behavior.

## Rejected Alternatives

### Only expose a boolean matched flag

Rejected because callers would still need to reopen `registry.json` to obtain
the matched entry metadata.

### Rework registry resolution and structured output together

Rejected because registry resolution is a separate behavioral concern; this
slice is transport-only.

### Add a registry-specific top-level doctor payload

Rejected because the additive `data` pattern is already established and keeps
backward compatibility.

## Success Criteria

- `registry-entry` emits structured `data` for both matched and unmatched cases
- focused tests cover both states
- existing detail text remains unchanged
