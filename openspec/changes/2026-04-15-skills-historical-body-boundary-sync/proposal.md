## Why

The historical `docs/gitnexus-skills-review.md` and
`docs/gitnexus-skills-modification-suggestions.md` pages already have current
follow-up snapshots at the top, but their preserved lower-body sections still
start with old `状态` / `当前状态` judgments from 2026-03-26 without an extra
boundary note right at the old-body entry.

That still leaves room for readers to mistake the preserved historical body for
the current task board.

## What Changes

- Add an explicit historical-baseline note before the preserved old summary and
  detailed review body in `docs/gitnexus-skills-review.md`
- Add an explicit historical-baseline note before the preserved detailed
  suggestions body in `docs/gitnexus-skills-modification-suggestions.md`
- Record the boundary sync in audit and roadmap docs

## Capabilities

### New Capabilities

- `skills-historical-body-boundary-sync`: Keep the preserved lower-body content
  on the two historical skills pages clearly marked as 2026-03-26 baseline
  context rather than current-state guidance.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/gitnexus-skills-review.md`
  - `docs/gitnexus-skills-modification-suggestions.md`
  - `docs/audits/2026-04-15-skills-historical-body-boundary-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - current historical skills pages
  - current follow-up snapshot framing
