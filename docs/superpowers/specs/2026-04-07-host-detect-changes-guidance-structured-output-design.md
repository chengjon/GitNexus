# Host Detect Changes Guidance Structured Output Design

Date: 2026-04-07  
Status: Approved in conversation  
Scope: `gitnexus/src/cli/doctor.ts`, targeted tests, audit/OpenSpec/roadmap docs

## Goal

Expose machine-readable host-specific `gitnexus_detect_changes` guidance in `doctor --json`.

## Design Decision

Use the same additive `DoctorCheck.data` pattern:

- keep the current `detail` text
- attach structured guidance data to `host-detect-changes-guidance`
- encode host id, target command, parameter recommendations, and reason code in one payload

## Why This Design

The repository explicitly needs to support both Claude Code and Codex. The
existing detail strings already carry host-specific operational guidance, but
prose-only output makes automation brittle.

This slice stays low risk because it changes only the JSON transport, not the
host guidance semantics.

## Rejected Alternatives

### Leave guidance prose-only

Rejected because this is the last host-facing dual-CLI guidance contract that
automation still cannot consume directly.

### Move guidance into `host-config.data`

Rejected because configuration status and detect-changes guidance are separate
contracts with different consumers.

### Collapse Claude Code and Codex into one generic schema without reason codes

Rejected because the guidance triggers differ, and the consumer needs to know
which host-specific rule is active.

## Success Criteria

- `host-detect-changes-guidance` emits structured `data`
- Codex and Claude Code paths are both covered by focused tests
- existing detail text remains unchanged
