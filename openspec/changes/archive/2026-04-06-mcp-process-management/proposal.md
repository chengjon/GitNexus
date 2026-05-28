## Why

GitNexus currently treats MCP process management as an inference problem: it
scans holders of `.gitnexus/kuzu`, guesses which ones are GitNexus-owned, and
terminates them with limited visibility into ownership or health. That is good
enough for emergency lock release, but not good enough for day-to-day operator
debugging or predictable cleanup of stale router and repo-worker processes.

Now that MCP moved to a router plus per-repo worker architecture, GitNexus
needs a lightweight control plane that lets it identify its own MCP processes,
report their lifecycle state, and clean up orphaned or stale workers without
falling back to ad hoc `ps`/`kill` workflows.

## What Changes

- Add a global runtime registry for GitNexus-owned MCP router and repo-worker
  processes under `~/.gitnexus/runtime/`.
- Add router session IDs, worker ownership metadata, and periodic worker
  heartbeats.
- Add worker orphan detection so repo workers self-terminate when the owning
  router dies.
- Add `gitnexus mcp ps` for process inspection and `gitnexus mcp gc` for
  cleanup of stale registry entries and orphaned workers.
- Make `gitnexus analyze` registry-aware when quiescing GitNexus-owned MCP
  holders.

## Capabilities

### New Capabilities
- `mcp-process-management`: Manage GitNexus-owned MCP router and repo-worker
  processes through a runtime registry, health reporting, and cleanup tooling.

### Modified Capabilities
- None.

## Impact

- Affected code:
  - `gitnexus/src/cli/index.ts`
  - `gitnexus/src/cli/mcp.ts`
  - `gitnexus/src/cli/analyze.ts`
  - `gitnexus/src/cli/platform-process-scan.ts`
  - `gitnexus/src/mcp/repo-worker-manager.ts`
  - `gitnexus/src/mcp/repo-worker.ts`
  - `gitnexus/src/mcp/repo-worker-protocol.ts`
  - `gitnexus/src/runtime/*`
- New internal runtime files under `~/.gitnexus/runtime/`
- New CLI surface: `gitnexus mcp ps`, `gitnexus mcp gc`
