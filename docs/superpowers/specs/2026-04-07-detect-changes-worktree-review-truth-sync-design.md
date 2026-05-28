# Detect Changes Worktree Review Truth Sync Design

Date: 2026-04-07
Status: Approved in conversation
Scope: worktree review doc truth-sync, cited test verification, audit/OpenSpec/roadmap docs

## Goal

Keep the `detect_changes` worktree review doc aligned with the current test
reality.

## Design Decision

Use a bounded review-doc truth-sync slice:

- update only the stale review document
- verify the cited unit and native integration tests still pass
- do not reopen implementation work that is already complete

## Why This Design

The residual is stale review text, not missing implementation.

This slice stays low risk because it changes only documentation and reuses
already-existing tests as evidence.

## Rejected Alternatives

### Leave the stale review text in place

Rejected because it keeps reporting already-closed test debt as if it were open.

### Reopen the implementation or add duplicate tests

Rejected because the existing unit and native integration tests already cover
the behavior in question.

### Delete the old review doc entirely

Rejected because the review still contains useful host-integration boundary
analysis.

## Success Criteria

- the review doc no longer claims explicit `cwd` priority coverage is missing
- the review doc no longer claims `fallback_reason` direct assertions are missing
- cited unit and native integration tests remain green
