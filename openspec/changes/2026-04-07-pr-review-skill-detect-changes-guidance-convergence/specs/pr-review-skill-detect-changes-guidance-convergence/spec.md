# pr-review-skill-detect-changes-guidance-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the PR review skill aligned with current detect_changes guidance

GitNexus SHALL keep the PR review skill aligned with the current `detect_changes`
contract for multi-repo and worktree scenarios.

#### Scenario: A maintainer reads the PR review skill

- **WHEN** a maintainer follows the PR review skill guidance
- **THEN** the skill explicitly teaches `repo` in multi-repo MCP sessions
- **AND** the skill explicitly teaches `cwd` in relevant worktree scenarios
- **AND** both the source skill and checked-in installed copy stay aligned
