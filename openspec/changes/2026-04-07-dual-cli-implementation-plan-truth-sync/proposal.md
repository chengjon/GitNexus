## Why

Several completed dual-CLI slices still have historical implementation plans
that show every step as unchecked even though the corresponding OpenSpec task
ledgers are complete and still validate.

This creates false-open plan debt and makes later audits look like execution
never happened.

## What Changes

- Truth-sync four completed dual-CLI implementation plans to their OpenSpec
  task ledgers
- Add execution-status sync notes that point readers at the task-truth source
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `dual-cli-implementation-plan-truth-sync`: Keep completed dual-CLI
  implementation plans aligned with their corresponding OpenSpec task ledgers.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/plans/2026-04-06-dual-cli-doctor-doc-convergence-implementation-plan.md`
  - `docs/superpowers/plans/2026-04-06-dual-cli-doctor-worktree-guidance-implementation-plan.md`
  - `docs/superpowers/plans/2026-04-06-dual-cli-manual-mcp-command-convergence-implementation-plan.md`
  - `docs/superpowers/plans/2026-04-06-dual-cli-setup-context-convergence-implementation-plan.md`
  - `docs/audits/2026-04-07-dual-cli-implementation-plan-truth-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Verified prior changes:
  - `2026-04-06-dual-cli-doctor-doc-convergence`
  - `2026-04-06-dual-cli-doctor-worktree-guidance`
  - `2026-04-06-dual-cli-manual-mcp-command-convergence`
  - `2026-04-06-dual-cli-setup-context-convergence`
