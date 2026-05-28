## Why

The historical `mcp-per-repo-worker-isolation` implementation plan and related
status docs still describe router/worker isolation as proposed work even though
the current repository and later archived docs show that architecture is already
landed.

## What Changes

- Truth-sync the historical router/worker isolation implementation plan to
  current merged-state evidence
- Update the related architecture status docs so they no longer describe the
  current MCP architecture as merely proposed
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `mcp-per-repo-worker-isolation-implementation-plan-truth-sync`: Keep the
  historical router/worker isolation implementation and status docs aligned
  with the repository's current merged-state records.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/plans/2026-04-04-mcp-per-repo-worker-isolation-implementation-plan.md`
  - `docs/mcp-per-repo-worker-isolation-design.md`
  - `docs/sigusr1-cooperative-release-design.md`
  - `docs/audits/2026-04-08-mcp-per-repo-worker-isolation-implementation-plan-truth-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - current router/worker source and test anchors
  - archived `mcp-process-management` docs that treat router/worker isolation
    as already landed
