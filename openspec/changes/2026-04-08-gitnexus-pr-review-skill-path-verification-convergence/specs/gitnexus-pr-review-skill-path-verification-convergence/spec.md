# gitnexus-pr-review-skill-path-verification-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep package `gitnexus-pr-review` skill path verification aligned with the source skill

GitNexus SHALL keep the package `gitnexus-pr-review` skill aligned with the
source skill's current worktree path-verification guidance.

#### Scenario: A maintainer reads the package `gitnexus-pr-review` skill

- **WHEN** they read `gitnexus/skills/gitnexus-pr-review.md`
- **THEN** the worktree checklist requires passing `cwd` when needed and
  checking `path_resolution`
- **AND** the review dimensions include `Path verification`
- **AND** the package skill stays semantically aligned with the source skill's
  `detect_changes` path-validation guidance
