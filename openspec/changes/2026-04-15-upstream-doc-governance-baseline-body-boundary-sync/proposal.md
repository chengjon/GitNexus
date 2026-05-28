## Why

The historical `docs/audits/2026-04-06-upstream-doc-governance-convergence-baseline.md`
page already points at later shared replay follow-up records near the top, but
once readers enter the preserved `Refresh Summary`, hotspot inventories, and
`Recommended Replay Order` sections there is no extra local boundary note
explaining that those counts, inventories, and operator steps remain the first
2026-04-06 refreshed-fetch baseline rather than the current live replay
checklist.

That still leaves room for the preserved first-pass convergence body to be
mistaken for the current replay cut line and sequencing.

## What Changes

- Add an explicit historical-baseline note before the preserved baseline body
- Add an explicit note before `Recommended Replay Order` clarifying later
  replay follow-up precedence
- Record the boundary sync in audit and roadmap docs

## Capabilities

### New Capabilities

- `upstream-doc-governance-baseline-body-boundary-sync`: Keep the preserved
  body of the 2026-04-06 upstream doc/governance convergence baseline clearly
  marked as first-pass refreshed-fetch context.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/audits/2026-04-06-upstream-doc-governance-convergence-baseline.md`
  - `docs/audits/2026-04-15-upstream-doc-governance-baseline-body-boundary-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
  - `openspec/changes/2026-04-15-upstream-doc-governance-baseline-body-boundary-sync/**`
- Reused truth sources:
  - current 2026-04-06 upstream doc/governance convergence baseline
  - current 2026-04-06 upstream shared replay review
  - current 2026-04-08 upstream shared replay status-sync record
