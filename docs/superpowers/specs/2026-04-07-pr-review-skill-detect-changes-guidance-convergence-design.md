# PR Review Skill Detect Changes Guidance Convergence Design

Date: 2026-04-07  
Status: Approved in conversation  
Scope: PR review skill docs, focused skill-doc regression test, audit/OpenSpec/roadmap docs

## Goal

Keep the PR review skill aligned with the current `detect_changes` contract for
multi-repo and worktree scenarios.

## Design Decision

Use a bounded skill-doc convergence slice:

- add one focused regression test that locks the current guidance contract
- update both the source skill and the checked-in installed skill copy
- leave runtime behavior untouched

## Why This Design

The residual is documentation drift, not missing functionality. The
`detect_changes` contract already expects `repo` in multi-repo sessions and
`cwd` in relevant worktree/server-cwd mismatch scenarios.

This slice stays low risk because it changes only skill docs and one focused
test.

## Rejected Alternatives

### Update only the source skill

Rejected because the checked-in installed copy would remain stale.

### Update only the installed copy

Rejected because the source-of-truth skill would continue teaching the old
workflow.

### Leave the skill generic and omit `repo`

Rejected because the current contract is no longer safe to teach that way in
multi-repo sessions.

## Success Criteria

- both PR review skill copies explicitly document `repo` guidance
- both skill copies explicitly document worktree `cwd` guidance
- a focused test locks the shared contract
