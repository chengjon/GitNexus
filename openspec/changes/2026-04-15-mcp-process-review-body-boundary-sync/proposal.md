## Why

The historical `docs/superpowers/specs/2026-04-05-mcp-process-management-review.md`
page already has top-level status-sync framing, but once readers enter the
preserved `Overall Assessment` and `Summary` sections there is still no extra
local boundary note explaining that those review-gate structures remain the
2026-04-05 pre-implementation review baseline.

That still leaves room for the preserved `Approve with revisions`
recommendation to be mistaken for a current gate on the landed slice.

## What Changes

- Add an explicit historical-review note before the preserved review body
- Add an explicit note before `Summary` clarifying that the recommendation is
  review-time only
- Record the boundary sync in audit and roadmap docs

## Capabilities

### New Capabilities

- `mcp-process-review-body-boundary-sync`: Keep the preserved body of the
  2026-04-05 MCP process-management review clearly marked as
  pre-implementation review context.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/superpowers/specs/2026-04-05-mcp-process-management-review.md`
  - `docs/audits/2026-04-15-mcp-process-review-body-boundary-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
  - `openspec/changes/2026-04-15-mcp-process-review-body-boundary-sync/**`
- Reused truth sources:
  - current historical MCP review
  - current 2026-04-08 truth-sync record
