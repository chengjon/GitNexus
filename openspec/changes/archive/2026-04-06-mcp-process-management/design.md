## Context

GitNexus already isolates repo-scoped MCP runtime work into per-repo worker
processes, but lifecycle management remains mostly implicit. `gitnexus analyze`
can terminate holders of a repo's `.gitnexus/kuzu` path, yet there is no
durable ownership model for answering:

- which router session spawned this worker?
- is this worker stale, orphaned, or merely idle?
- can GitNexus clean up its own processes without operator shell work?

The approved design in
`docs/superpowers/specs/2026-04-05-mcp-process-management-design.md`
establishes the target architecture. This OpenSpec design narrows that into an
implementation sequence that fits the existing CLI and runtime layout.

## Goals / Non-Goals

**Goals:**
- Publish GitNexus-owned MCP router and worker processes into a global runtime
  registry.
- Attach stable session identity and router ownership metadata to workers.
- Report process lifecycle and health through `gitnexus mcp ps`.
- Clean stale registry entries and orphaned workers through `gitnexus mcp gc`.
- Make `gitnexus analyze` aware of registry-classified GitNexus-owned MCP
  holders.
- Preserve per-repo reindex lock ownership so MCP stale-lock cleanup does not
  delete a newer live analyze lock or misreport stale-lock failures as active
  rebuilds.

**Non-Goals:**
- Build a daemon supervisor outside the current stdio router model.
- Manage arbitrary non-GitNexus processes such as shell jobs or package
  manager installs.
- Deliver the full cooperative drain protocol in the first implementation
  slice.
- Add Windows-specific process-management behavior in this change.
- Keep serving a read-only "last-good" Kuzu index while `analyze` is rebuilding
  the active index in place. That would require a shadow-index plus atomic swap
  design.

## Decisions

### 1. Use a global per-process runtime registry

Use `~/.gitnexus/runtime/mcp-processes/<pid>.json` rather than a repo-local
registry or a single shared JSON file.

Rationale:
- the router is multi-repo and has no single repo-local home
- per-process files avoid a single multi-writer hot file
- stale-file cleanup is simpler than concurrent shared-file writes

Alternative considered:
- Single shared registry file. Rejected because concurrent router/worker writes
  would require more locking and recovery logic than this change needs.

### 2. Persist raw facts, derive health at read time

Registry records will store raw facts such as PID, role, session ID,
timestamps, and router ownership. Health classification such as `healthy`,
`suspect`, `orphaned`, and `stale` will be computed by readers like
`gitnexus mcp ps`.

Rationale:
- avoids conflicting health writes from multiple processes
- keeps records append/replace friendly
- centralizes health policy in one place

### 3. Add session identity and router ownership to worker bootstrap

The router will generate a unique session ID and pass `sessionId` and
`routerPid` into the worker bootstrap payload.

Rationale:
- enables grouping by session in CLI inspection
- lets workers detect dead routers without relying solely on IPC disconnect

Alternative considered:
- Infer session only from PPID. Rejected because PPID alone is too weak for
  operator-facing identity and can be misleading across wrappers.

### 4. Implement worker heartbeat and orphan self-exit before idle reaping

Workers will register themselves, refresh heartbeats, and periodically verify
their `routerPid` still exists. If the router is gone, the worker shuts down.

Rationale:
- orphan detection gives immediate value for stale-process cleanup
- it is lower risk than introducing router-driven idle reaping first

### 5. Add CLI inspection and cleanup before deeper coordination

The first CLI commands will be:
- `gitnexus mcp ps`
- `gitnexus mcp gc`

Rationale:
- visibility first
- cleanup second
- keeps the first implementation slice coherent and testable

### 6. Keep analyze signal-based, but make it registry-aware

This change will not implement the full cooperative drain protocol yet.
Instead, `gitnexus analyze` will:
- clean stale registry records first
- classify holder PIDs against the registry
- prefer terminating clearly GitNexus-owned orphaned/stale holders
- report registry-backed holder details in timeout/error paths

Rationale:
- fits this implementation slice
- reduces risk versus introducing a new cross-process drain channel

### 7. Reindex lock ownership must stay separate from MCP registry state

The `2026-04-06` stale-lock incident showed that MCP registry visibility and
reindex lock correctness are related but distinct concerns. The false
"GitNexus is rebuilding the index" failures were caused primarily by broken
reindex-lock ownership semantics, not by the absence of registry metadata.

This implementation slice therefore keeps one explicit rule:
- runtime registry improves process visibility and cleanup decisions
- reindex lock acquisition and release still enforce per-repo ownership
- stale-lock cleanup must revalidate ownership before deletion
- read-path errors must distinguish live rebuild, stale undeletable lock,
  unreadable lock, and invalid payload

Rationale:
- prevents one analyze session from deleting another session's live lock
- keeps permission failures diagnosable instead of collapsing them into a
  generic rebuild message
- avoids reintroducing false-positive MCP read failures while registry work
  continues

## Risks / Trade-offs

- [Registry write overhead] -> Use per-process files, conservative heartbeat
  defaults, and atomic replace writes without per-heartbeat fsync.
- [False positive cleanup] -> Require PID liveness and GitNexus command
  signature checks before signaling.
- [False positive stale-lock cleanup] -> Require PID-bound reindex lock removal
  and revalidate the lock before deletion on MCP read paths.
- [Old sessions without registry records] -> Fall back to existing holder scan
  behavior; registry absence must not block startup or analyze.
- [CLI scope creep] -> Keep `mcp ps` and `mcp gc` focused on GitNexus-owned
  MCP processes only.

## Migration Plan

1. Add runtime registry and reader/writer utilities.
2. Register router and worker processes with heartbeat support.
3. Expose `gitnexus mcp ps` and `gitnexus mcp gc`.
4. Make analyze registry-aware while preserving the existing holder-scan path.
5. Keep older GitNexus processes manageable through command-signature checks
   until all sessions run a registry-aware build.

Rollback:
- disable new CLI commands
- stop publishing registry records
- retain existing holder-scan cleanup logic

## Open Questions

- Whether `mcp gc --force` should be included in the first public CLI surface
  or deferred until enough health telemetry exists.
- Whether idle worker reaping should land in this change or a follow-up once
  heartbeat/orphan detection is stable.
