## Why

The repository already has a convergence baseline for `upstream/main`, and the
first safe local replay slices have already landed.

After another same-day `git fetch upstream`, however, the upstream baseline
moved again. The next operator now needs a narrow answer to a specific question:

"Do the latest upstream changes introduce any new shared-file wording that is
safe to replay now?"

Without a dedicated follow-up review, maintainers are likely to either:

- treat the earlier baseline as still current even though upstream moved again
- or over-merge shared docs that now advertise capabilities this fork still
  does not have

## What Changes

- Add a dedicated follow-up OpenSpec change for the latest shared-doc replay
  review after the refreshed upstream fetch.
- Record the new divergence baseline and shared replay hotspots.
- Cross-check the latest upstream shared-doc claims against current local code
  and governance files.
- Document whether any new shared replay is safe now.
- Do not replay upstream wording in this change.

## Capabilities

### New Capabilities

- `upstream-shared-doc-replay-review`: Keep latest upstream shared-doc replay
  decisions explicit, refreshed, and evidence-backed after the baseline changes.

### Modified Capabilities

- None.

## Impact

- Affected audits:
  - `docs/audits/2026-04-06-upstream-shared-doc-replay-review.md`
  - `docs/audits/2026-04-06-upstream-doc-governance-convergence-baseline.md`
- Affected roadmap:
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
