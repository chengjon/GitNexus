## Why

The historical
`docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md` page
already has top-level status-sync notes, but once readers enter the preserved
`Summary` / `Current State` / `Findings` sections there is still no explicit
boundary note that those sections remain the 2026-04-06 audit-capture
baseline.

That still leaves room for the preserved baseline body to be mistaken for the
current repository blocking-debt board.

## What Changes

- Add an explicit historical-baseline note before the preserved summary/body
  content
- Add an explicit note before the findings block that later status-sync notes
  control current-state reading
- Record the boundary sync in audit and roadmap docs

## Capabilities

### New Capabilities

- `repo-technical-debt-audit-body-boundary-sync`: Keep the preserved lower-body
  content in the 2026-04-06 repository technical-debt audit clearly marked as
  audit-capture baseline context.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md`
  - `docs/audits/2026-04-15-repo-technical-debt-audit-body-boundary-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
  - `openspec/changes/2026-04-15-repo-technical-debt-audit-body-boundary-sync/**`
- Reused truth sources:
  - current 2026-04-06 baseline audit
  - later repo-technical-debt status-sync records
