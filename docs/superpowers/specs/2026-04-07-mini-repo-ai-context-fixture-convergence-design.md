# Mini Repo AI Context Fixture Convergence Design

Date: 2026-04-07  
Status: Approved in conversation  
Scope: mini-repo fixture docs, focused `ai-context` regression test, audit/OpenSpec/roadmap docs

## Goal

Keep the checked-in `mini-repo` AI context fixtures aligned with the current
`ai-context` generator contract.

## Design Decision

Use a bounded fixture-convergence slice:

- add a focused regression test that locks the current fixture invariants
- update the fixture docs to match the current generated-context direction
- avoid changing the generator itself

## Why This Design

The generator output is already correct. The residual is that the checked-in
fixture docs drifted behind it.

This slice stays low risk because it touches only tests and fixture docs while
making future drift visible.

## Rejected Alternatives

### Ignore the fixture drift because the generator is already correct

Rejected because stale fixture docs still mislead readers and can silently
diverge further.

### Regenerate all fixture content without adding a regression test

Rejected because that would repair the current drift but would not stop it from
reappearing.

### Change the generator to match the old fixture format

Rejected because the old fixture format is the stale side of the divergence.

## Success Criteria

- `mini-repo` fixture docs no longer embed dynamic counts
- fixture docs include the current `detect_changes` `repo` guidance
- fixture docs retain the current Claude Code / Codex freshness split
- focused `ai-context` tests lock the fixture contract
