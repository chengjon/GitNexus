## Why

The `detect_changes` worktree review doc still reported already-closed test debt
as open.

Specifically, it still said explicit `cwd` priority coverage and
`fallback_reason` direct assertion coverage were missing even though both now
exist in the unit and native integration suites.

## What Changes

- Truth-sync the worktree review doc with the current test reality
- Verify the cited unit and native integration tests
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `detect-changes-worktree-review-truth-sync`: Keep the worktree review doc
  aligned with the current `detect_changes` test reality.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`
  - `docs/audits/2026-04-07-detect-changes-worktree-review-truth-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Verified tests:
  - `gitnexus/test/unit/calltool-dispatch.test.ts`
  - `gitnexus/test/integration/local-backend.test.ts`
