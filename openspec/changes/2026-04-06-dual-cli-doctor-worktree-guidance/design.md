# Dual CLI Doctor Worktree Guidance Design

## Goal

Expose the current worktree and `cwd` guidance for Claude Code and Codex
directly in `gitnexus doctor --host ...` output.

## Design Principles

### 1. Put host-specific guidance at the diagnostic entry point

Users checking `gitnexus doctor --host codex` or `--host claude-code` should
not have to cross-reference audit docs to learn how `detect_changes` behaves in
worktree scenarios.

### 2. Keep the new output additive and low-risk

The change should add a new informational doctor check rather than altering
existing readiness semantics.

### 3. Limit noise to explicit host inspections

Only show the new guidance when a user targets `claude-code` or `codex`
specifically. General `gitnexus doctor` runs should remain concise.

### 4. Preserve option-only CLI invocation

`doctor [path]` is an optional-argument command. The CLI must still honor
`--host`, `--repo`, and `--json` when the user omits the positional path and
relies on options alone.

## Out Of Scope

- changing `detect_changes` implementation
- changing host adapter setup behavior
- broad `doctor` UX redesign

## Verification

This change is complete when:

1. targeted doctor runs for Codex and Claude Code include explicit worktree
   guidance
2. the new checks are covered by unit tests
3. general doctor behavior remains unchanged outside targeted host inspection
