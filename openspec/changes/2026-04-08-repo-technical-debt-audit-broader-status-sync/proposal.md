## Why

The historical `2026-04-06-repo-technical-debt-and-residual-audit.md` already
has a focused status sync for the `detect_changes` host-validation finding, but
it still lacks broader follow-up entrypoints for Finding 2 and the original
repair-order/output-mapping guidance.

Without that broader framing, maintainers can still misread the old repair
order as if none of the stale-doc convergence work has happened since.

## What Changes

- Add broader stale-doc / repair-order follow-up entrypoints to the historical
  2026-04-06 repo audit
- Preserve the original baseline findings instead of rewriting them
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `repo-technical-debt-audit-broader-status-sync`: Keep the historical
  2026-04-06 repository technical-debt audit readable after later stale-doc
  convergence work has partially executed.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md`
  - `docs/audits/2026-04-08-repo-technical-debt-audit-broader-status-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - current remediation roadmap
  - existing host-validation status sync
  - later 2026-04-08 truth-sync records
