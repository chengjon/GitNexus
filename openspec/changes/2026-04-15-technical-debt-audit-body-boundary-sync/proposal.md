## Why

The historical `docs/superpowers/specs/2026-03-28-technical-debt-audit.md`
page already has top-level status-sync framing, but the preserved
`Design Documents Status` and `Tech Debt Roadmap Progress` tables still begin
without an extra local boundary note at the table entry points.

That still leaves room for readers to mistake the preserved `Document Status`
and `Status` columns for the current mainline state board.

## What Changes

- Add a clear historical-baseline note near the top of the preserved body
- Add explicit boundary notes before the two preserved status tables
- Record the boundary sync in audit and roadmap docs

## Capabilities

### New Capabilities

- `technical-debt-audit-body-boundary-sync`: Keep the preserved status tables in
  `2026-03-28-technical-debt-audit.md` clearly marked as worktree-era baseline
  context rather than current-state guidance.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/specs/2026-03-28-technical-debt-audit.md`
  - `docs/audits/2026-04-15-technical-debt-audit-body-boundary-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
  - `openspec/changes/2026-04-15-technical-debt-audit-body-boundary-sync/**`
- Reused truth sources:
  - current historical technical-debt audit
  - current 2026-04-08 historical status sync
  - remediation roadmap
