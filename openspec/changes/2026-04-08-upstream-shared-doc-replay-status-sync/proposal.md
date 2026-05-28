## Why

The repository already has upstream doc/governance replay baseline records, but
their live fetch state stopped at 2026-04-06. After a fresh `git fetch
upstream`, `upstream/main` moved again, so the current replay baseline should
be refreshed instead of leaving readers on older divergence numbers.

## What Changes

- Add a latest-status pointer to the historical 2026-04-06 upstream baseline
  and replay-review audits
- Record a new 2026-04-08 status-sync audit with the refreshed upstream commit,
  divergence count, and shared hotspot file set
- Update the remediation roadmap so the newest upstream replay baseline is easy
  to find

## Capabilities

### New Capabilities

- `upstream-shared-doc-replay-status-sync`: Keep the repository's shared-doc
  replay baseline aligned with the latest fetched `upstream/main` state.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/audits/2026-04-06-upstream-doc-governance-convergence-baseline.md`
  - `docs/audits/2026-04-06-upstream-shared-doc-replay-review.md`
  - `docs/audits/2026-04-08-upstream-shared-doc-replay-status-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - latest `git fetch upstream` output
  - latest divergence count and shared hotspot diff
  - current local shared-doc truth source
