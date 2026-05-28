## Why

The historical `detect_changes` worktree resolution implementation plan still
shows every step as unchecked even though the repository's design, review, and
roadmap records already treat the fix as implemented.

Because this slice predates the current OpenSpec workflow, the drift is not in
an old task ledger. The drift is between a stale historical implementation plan
and the repository's current merged-state records.

## What Changes

- Truth-sync the historical `detect_changes` worktree resolution implementation
  plan to current merged-state evidence
- Add an execution-status sync note that explains the pre-OpenSpec truth source
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `detect-changes-worktree-implementation-plan-truth-sync`: Keep the historical
  `detect_changes` worktree resolution implementation plan aligned with the
  repository's current merged-state records.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/plans/2026-03-25-detect-changes-worktree-resolution-implementation-plan.md`
  - `docs/audits/2026-04-08-detect-changes-worktree-implementation-plan-truth-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-design.md`
  - `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`
  - current detect_changes worktree implementation and test presence
