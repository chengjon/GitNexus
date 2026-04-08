## Why

The repository already converged `gitnexus-pr-review` guidance around
multi-repo `repo` and worktree `cwd` usage, but the package skill copy drifted
from the source skill. Specifically, it no longer requires checking
`path_resolution` in the worktree checklist and no longer includes the `Path
verification` review dimension.

That leaves the same skill with two different documentation surfaces and a
weaker package-side review workflow.

## What Changes

- Update the package `gitnexus-pr-review` skill so its worktree checklist again
  requires checking `path_resolution`
- Restore the `Path verification` review dimension in the package skill
- Record the source/package convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `gitnexus-pr-review-skill-path-verification-convergence`: Keep the package
  `gitnexus-pr-review` skill aligned with the source skill's current worktree
  path-verification guidance.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `gitnexus/skills/gitnexus-pr-review.md`
  - `docs/audits/2026-04-08-gitnexus-pr-review-skill-path-verification-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - source `gitnexus-pr-review` skill
  - prior pr-review detect-changes convergence audit
