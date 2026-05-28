## Why

The historical `docs/superpowers/specs/2026-03-28-wiki-generator-full-generation-review.md`
page already has top-level status-sync framing, but once readers enter the
preserved `Verdict` and `Summary` sections there is still no extra local
boundary note explaining that those blocker/severity structures remain the
2026-03-28 design-review baseline.

That still leaves room for the preserved blocker wording to be mistaken for a
current implementation gate on the landed slice.

## What Changes

- Add an explicit historical-review note before the preserved review body
- Add an explicit note before `Summary` clarifying that blocker/severity
  language is review-time only
- Record the boundary sync in audit and roadmap docs

## Capabilities

### New Capabilities

- `full-generation-review-body-boundary-sync`: Keep the preserved body of the
  2026-03-28 full-generation review clearly marked as design-review baseline
  context.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/specs/2026-03-28-wiki-generator-full-generation-review.md`
  - `docs/audits/2026-04-15-full-generation-review-body-boundary-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
  - `openspec/changes/2026-04-15-full-generation-review-body-boundary-sync/**`
- Reused truth sources:
  - current historical full-generation review
  - current 2026-04-08 truth-sync record
  - current technical-debt audit note
