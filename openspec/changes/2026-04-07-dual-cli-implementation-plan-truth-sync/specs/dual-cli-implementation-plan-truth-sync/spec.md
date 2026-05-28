# dual-cli-implementation-plan-truth-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep completed dual-CLI implementation plans aligned with recorded execution

GitNexus SHALL keep completed dual-CLI implementation plan documents aligned
with the execution state recorded in their corresponding OpenSpec task ledgers.

#### Scenario: A maintainer reads one of the completed dual-CLI implementation plans

- **WHEN** a maintainer reads one of these plans:
  - `2026-04-06-dual-cli-doctor-doc-convergence-implementation-plan.md`
  - `2026-04-06-dual-cli-doctor-worktree-guidance-implementation-plan.md`
  - `2026-04-06-dual-cli-manual-mcp-command-convergence-implementation-plan.md`
  - `2026-04-06-dual-cli-setup-context-convergence-implementation-plan.md`
- **THEN** the plan does not incorrectly show the executed steps as still unchecked
- **AND** the plan points readers to the corresponding OpenSpec task ledger as the execution-truth source
- **AND** it does not reopen already-completed Claude Code or Codex behavior work
