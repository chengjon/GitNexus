## Why

The historical `docs/gitnexus-skills-review.md` page already has status-sync
framing, but its top-level follow-up snapshot still treats
`gitnexus-exploring` as an optional remaining follow-up even though the later
`gitnexus-exploring` convergence slice has now closed that drift.

That leaves the historical review page one step behind the current governance
truth source.

## What Changes

- Update the status-sync note so `gitnexus-exploring` is included in the
  closed-drift list
- Update the follow-up snapshot row for `gitnexus-exploring`
- Record the follow-up sync in audit and roadmap docs

## Capabilities

### New Capabilities

- `gitnexus-skills-review-exploring-follow-up-sync`: Keep the historical
  skills-review page's top follow-up snapshot aligned with the newly closed
  `gitnexus-exploring` convergence.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/gitnexus-skills-review.md`
  - `docs/audits/2026-04-15-gitnexus-skills-review-exploring-follow-up-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - historical skills-review page
  - current exploring convergence record
  - remediation roadmap
