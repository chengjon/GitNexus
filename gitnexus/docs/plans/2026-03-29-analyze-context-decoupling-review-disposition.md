# Analyze / Context Decoupling Review Disposition

Date: 2026-03-29

## Decision

Keep the `analyze/status` decoupling work.

Cancel the two unrelated ingestion refactors that landed in the same batch.

## Kept

These changes are part of the actual product fix and stay:

- `a704af8` `decouple analyze from context refresh by default`
- `0c2e8c8` `keep analyze from dirtying git worktrees by default`
- `cbe8557` `test: cover analyze context refresh modes`

Why they stay:

- they fix the GitNexus dirty-worktree loop caused by default `analyze` side effects
- they clarify the CLI contract for `analyze`, `refresh-context`, and tracked `.gitignore` updates
- they keep dirty-worktree suppression limited to `.gitnexus/`
- they are covered by direct unit and integration tests

## Canceled

These changes were not required for the analyze/context problem and were reverted:

- `9dc834b` `refactor(ingestion): extract builtin filters`
- `fe864b8` `refactor: extract import resolution dispatch`

Why they were canceled:

- they do not contribute to the `analyze/status` behavior fix
- they increase review scope for no product gain on this issue
- they can be proposed later as independent ingestion cleanups if still wanted

## Verification

The post-revert verification for this disposition passed:

- unit:
  - `test/unit/ingestion-refactor-boundary.test.ts`
  - `test/unit/ingestion-utils.test.ts`
  - `test/unit/import-processor.test.ts`
  - `test/unit/analyze-scope.test.ts`
  - `test/unit/analyze-finalization.test.ts`
  - `test/unit/index-health.test.ts`
  - `test/unit/repo-manager.test.ts`
- integration:
  - `test/integration/cli-e2e.test.ts`
  - `test/integration/resolvers/kotlin.test.ts`
  - `test/integration/resolvers/go.test.ts`
  - `test/integration/resolvers/php.test.ts`

## Boundary

Future work on ingestion structure should be reviewed separately from analyze/context behavior changes.
