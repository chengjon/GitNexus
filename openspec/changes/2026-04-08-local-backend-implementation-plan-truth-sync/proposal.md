## Why

The historical LocalBackend handler-first implementation plan still shows every
step as unchecked even though later repository records show the refactor landed
on current `main` long ago.

Because this slice predates the current OpenSpec workflow, the drift is not in
an old task ledger. The drift is between a stale historical implementation plan
and the repository's current merged-state records.

## What Changes

- Truth-sync the historical LocalBackend handler-first implementation plan to
  current merged-state evidence
- Add an execution-status sync note that explains the pre-OpenSpec truth source
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `local-backend-implementation-plan-truth-sync`: Keep the historical
  LocalBackend handler-first implementation plan aligned with the repository's
  current merged-state records.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/plans/2026-03-24-local-backend-handler-first-implementation-plan.md`
  - `docs/audits/2026-04-08-local-backend-implementation-plan-truth-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - `docs/superpowers/specs/2026-03-24-local-backend-handler-first-design.md`
  - current LocalBackend runtime/tool/handler file presence
