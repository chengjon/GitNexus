## Why

The historical `2026-03-28-technical-debt-audit.md` still reads like a current
status board in places even though it is actually a worktree-era audit
baseline. Without explicit reader guidance, maintainers can misread old
`pending merge`, `in progress`, and `local slice committed` wording as the
current state of `main`.

## What Changes

- Truth-sync the historical 2026-03-28 technical-debt audit with bounded
  current-state reader guidance
- Preserve the original historical observations instead of rewriting them
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `technical-debt-audit-historical-status-sync`: Keep the 2026-03-28
  technical-debt audit readable as a historical worktree baseline without it
  being mistaken for the current mainline status board.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/specs/2026-03-28-technical-debt-audit.md`
  - `docs/audits/2026-04-08-technical-debt-audit-historical-status-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - current remediation roadmap
  - repository-level audit status sync
  - 2026-04-08 wiki-generator truth-sync records
