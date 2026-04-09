## Why

After refreshing `upstream/main`, the branch divergence baseline for this fork is
now `276` commits unique to `upstream/main` and `208` commits unique to local
`main`.

Within doc and governance paths alone, the fork already has:

- `53` locally divergent paths
- `13` upstream-divergent paths
- shared hotspots in `README.md`, `AGENTS.md`, and `CLAUDE.md`

Those differences are not all the same kind of work. Some local files are
fork-only governance records, some upstream files describe code that has not
landed locally, and a few shared files now need manual reconcile.

Without an explicit convergence review change, the next operator is likely to
either over-merge upstream docs that do not match local code, or overwrite
locally authoritative instructions with stale upstream wording.

## What Changes

- Record a refreshed doc/governance convergence baseline after `git fetch upstream`.
- Classify local-only doc/governance files into retain-local versus possible
  future upstream candidates.
- Classify upstream-only doc/governance files into defer-with-code versus shared
  hotspot review.
- Define the replay order for shared top-level docs and governance files.
- Do not perform a full upstream integration in this change.

## Capabilities

### New Capabilities

- `upstream-doc-governance-convergence`: Keep doc/governance replay toward
  `upstream/main` explicit, classified, and bounded to files that match local
  reality.

### Modified Capabilities

- None.

## Impact

- Affected baseline report:
  - `docs/audits/2026-04-06-upstream-doc-governance-convergence-baseline.md`
- Affected governance docs:
  - `README.md`
  - `gitnexus/README.md`
  - `AGENTS.md`
  - `CLAUDE.md`
  - `gitnexus/AGENTS.md`
  - `gitnexus/CLAUDE.md`
- Affected doc inventories:
  - `docs/**`
  - `openspec/**`
