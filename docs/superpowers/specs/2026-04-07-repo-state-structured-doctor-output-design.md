# Repo State Structured Doctor Output Design

Date: 2026-04-07
Status: Approved in conversation
Scope: `gitnexus/src/cli/doctor.ts`, targeted tests, audit/OpenSpec/roadmap docs

## Goal

Expose machine-readable repo-state diagnostics in `doctor --json`.

## Design Decision

Use the same additive `DoctorCheck.data` pattern:

- keep the current `detail` text
- attach structured data to `git-repo`
- attach structured data to `repo-indexed`

## Why This Design

`runDoctor()` already computes the requested path, resolved repo root, and
index presence. Keeping that state only in prose makes shared CLI automation
more brittle than necessary for both Claude Code and Codex entrypoints.

The slice stays low risk because it changes only the JSON transport, not repo
or index detection behavior.

## Rejected Alternatives

### Structure only `repo-indexed`

Rejected because callers would still need to infer repo-root resolution from
the `git-repo` detail string.

### Collapse repo state into one new check

Rejected because the existing check names already express the operator-facing
stages cleanly, and additive `data` preserves backward compatibility.

### Rework repo detection and transport together

Rejected because behavior changes belong in a separate slice.

## Success Criteria

- `git-repo` emits structured `data` for pass and fail states
- `repo-indexed` emits structured `data` for indexed and non-indexed states
- focused tests cover the shared repo-state paths
- existing detail text remains unchanged
