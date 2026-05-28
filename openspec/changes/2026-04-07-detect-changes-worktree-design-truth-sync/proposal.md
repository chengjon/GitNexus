## Why

The `detect_changes` worktree review is now mostly accurate, but the original
design doc still describes an older proposal state instead of the current
implemented contract and test coverage.

This leaves a stale design-doc residual even after the review truth-sync slice
closed the outdated testing claims.

## What Changes

- Truth-sync the worktree design doc to the current implemented contract
- Clarify git command semantics and metadata / fallback boundaries
- Narrow the review doc so the only remaining open item is external host
  compatibility research

## Capabilities

### New Capabilities

- `detect-changes-worktree-design-truth-sync`: Keep the detect_changes worktree
  design and review docs aligned with the current implementation and test
  reality.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-design.md`
  - `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`
  - `docs/audits/2026-04-07-detect-changes-worktree-design-truth-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Referenced implementation and evidence:
  - `gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts`
  - `gitnexus/src/storage/git.ts`
  - `gitnexus/test/unit/calltool-dispatch.test.ts`
  - `gitnexus/test/integration/local-backend.test.ts`
