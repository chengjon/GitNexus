## Why

The historical `docs/audits/2026-04-06-kuzu-dependency-exit-strategy.md` page
already states that it is a dependency-governance follow-up and does not change
versions, but once readers enter the preserved `Exit Criteria`,
`Current Decision`, and reopen-trigger wording there is no extra local boundary
note explaining that those rules remain the 2026-04-06 tracked-exception
baseline rather than the sole current live package-policy source.

That still leaves room for the preserved exit-strategy body to be mistaken for
the only current dependency-policy authority.

## What Changes

- Add an explicit historical-decision note before the preserved exit-strategy body
- Add an explicit note before `Exit Criteria` clarifying baseline scope
- Add an explicit note before `Current Decision` clarifying current-policy
  precedence
- Record the boundary sync in audit and roadmap docs

## Capabilities

### New Capabilities

- `kuzu-exit-strategy-body-boundary-sync`: Keep the preserved body of the
  2026-04-06 `kuzu` dependency exit strategy clearly marked as historical
  tracked-exception baseline context.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/audits/2026-04-06-kuzu-dependency-exit-strategy.md`
  - `docs/audits/2026-04-15-kuzu-exit-strategy-body-boundary-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
  - `openspec/changes/2026-04-15-kuzu-exit-strategy-body-boundary-sync/**`
- Reused truth sources:
  - current 2026-04-06 `kuzu` dependency exit strategy
  - current remediation roadmap dependency-governance follow-up guidance
