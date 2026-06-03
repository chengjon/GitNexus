## Why

After a successful local `gitnexus analyze`, the MCP `detect_changes` tool
still reports `stale: true` with `stale_reason: current_commit_differs_from_indexed_commit`.
This creates a trust gap: every report carries a caveat that local analyze
succeeded but MCP metadata disagrees.

The stale flag does not distinguish between:
- "graph index is genuinely outdated for the files being analyzed"
- "HEAD moved because staged changes are uncommitted"
- "MCP is reading a different index path than the local CLI wrote to"

Source: `/opt/claude/mystocks_spec/docs/reports/tasks/2026-06-02-gitnexus-usage-feedback.md`

## What Changes

- After local `gitnexus analyze` writes a fresh index, MCP tools must detect
  the updated index on next call
- Stale metadata must distinguish "uncommitted staged diff" from "stale graph"
- Both CLI and MCP must expose their index path and generation metadata so
  mismatches are diagnosable
- Add a `fresh_for_staged_diff` field: true when the graph covers all files
  in the staged diff, even if HEAD differs from indexed_commit

## Capabilities

### Modified Capabilities

- `mcp-index-freshness`: MCP tools report accurate freshness that reflects
  local CLI analyze results, with actionable stale reasons and index path
  transparency.

## Impact

- Affected modules:
  - `gitnexus/src/cli/commands/analyze.ts` (index write path)
  - `gitnexus/src/mcp/tools/detect-changes.ts` (stale check logic)
  - `gitnexus/src/mcp/tools/impact.ts` (metadata reporting)
  - `gitnexus/src/core/index-freshness.ts` or equivalent (freshness evaluation)
- Risk: LOW — metadata-only change, no graph schema mutation
