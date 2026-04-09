# Host Config Structured Doctor Output Design

Date: 2026-04-07  
Status: Approved in conversation  
Scope: `gitnexus/src/cli/doctor.ts`, targeted tests, audit/OpenSpec/roadmap docs

## Goal

Expose machine-readable host configuration diagnostics in `doctor --json`,
especially for the Claude Code and Codex host paths.

## Design Decision

Use the same additive `DoctorCheck.data` pattern:

- keep the current `detail` text
- attach structured data for evaluated `host-config` results
- capture detection, configuration, and manual-setup state in one payload

## Why This Design

`runDoctor()` already computes these booleans and identifiers. Keeping them only
in prose makes dual-CLI automation more fragile than necessary.

The slice stays low risk because it changes only the JSON transport, not host
setup behavior.

## Rejected Alternatives

### Structure both `host-config` and `host-detect-changes-guidance` together

Rejected because the guidance check is documentation-oriented; `host-config` is
the higher-value machine contract.

### Add host-specific nested schemas outside `DoctorCheck`

Rejected because the additive `data` pattern is already established.

### Limit the slice to Codex only

Rejected because the repository explicitly requires continued support for both
Claude Code and Codex.

## Success Criteria

- `host-config` emits structured `data` for evaluated hosts
- Codex and Claude Code both remain covered by focused tests
- existing detail text remains unchanged
