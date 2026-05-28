# Dual CLI Post-Mutation Freshness Guidance Design

Date: 2026-04-07
Status: Approved in conversation
Scope: generated AI context text, quick-start docs, focused tests, audit/OpenSpec/roadmap docs

## Goal

Make shared GitNexus guidance explicitly distinguish Claude Code automatic
post-mutation freshness handling from Codex manual freshness handling.

## Design Decision

Use the existing "Keeping the Index Fresh" section and make the host difference
explicit:

- keep the current Claude Code PostToolUse note
- add a Codex note stating that no equivalent automatic hook is installed
- tell Codex users to rerun `gitnexus analyze` manually after `git commit` and
  `git merge` when they need a fresh index

## Why This Design

The underlying behavior is already true today. The residual is documentation
asymmetry, not missing runtime support.

This slice stays low risk because it changes only shared guidance text and its
tests while preserving Claude Code / Codex runtime behavior.

## Rejected Alternatives

### Leave the shared docs Claude-only

Rejected because the repository now treats both Claude Code and Codex as
first-class CLI hosts.

### Add a Codex hook implementation in the same slice

Rejected because the residual here is inaccurate shared guidance, not missing
runtime hook support.

### Remove the Claude Code auto-hook note to avoid asymmetry

Rejected because that would hide real behavior instead of documenting it
correctly.

## Success Criteria

- generated AI context explicitly documents both Claude Code and Codex post-mutation behavior
- the focused `ai-context` regression test locks the dual-CLI wording
- quick-start guidance matches the generated context direction
