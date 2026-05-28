## Why

The historical `mcp-process-management` implementation plan still implies open
execution state even though the archived OpenSpec change and current repository
state show the feature landed already.

The drift is not in the archived OpenSpec ledger. The drift is between the
historical implementation/design docs and the repository's current merged-state
records.

## What Changes

- Truth-sync the historical `mcp-process-management` implementation plan to
  archived OpenSpec and current merged-state evidence
- Update the historical design record so it no longer reads as an active draft
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `mcp-process-management-implementation-plan-truth-sync`: Keep the historical
  `mcp-process-management` implementation plan aligned with the repository's
  current merged-state records.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/plans/2026-04-05-mcp-process-management-implementation-plan.md`
  - `docs/superpowers/specs/2026-04-05-mcp-process-management-design.md`
  - `docs/audits/2026-04-08-mcp-process-management-implementation-plan-truth-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - `openspec/changes/archive/2026-04-06-mcp-process-management/`
  - current runtime / CLI / test anchors
