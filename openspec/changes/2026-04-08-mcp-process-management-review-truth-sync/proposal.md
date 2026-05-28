## Why

The historical `mcp-process-management` review doc still frames the slice as if
the critical design concerns must be resolved before implementation starts even
though the repository already contains the archived OpenSpec change, the
truth-synced design record, and the landed runtime/CLI/test anchors.

The drift is between stale review wording and the repository's current
merged-state records.

## What Changes

- Truth-sync the historical `mcp-process-management` review doc to current
  merged-state evidence
- Reframe the review as a historical record instead of a current implementation
  gate
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `mcp-process-management-review-truth-sync`: Keep the historical
  `mcp-process-management` review doc aligned with the repository's current
  merged-state records.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/specs/2026-04-05-mcp-process-management-review.md`
  - `docs/audits/2026-04-08-mcp-process-management-review-truth-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - truth-synced historical design record
  - archived `2026-04-06-mcp-process-management` OpenSpec change
  - current runtime/CLI/test anchors
