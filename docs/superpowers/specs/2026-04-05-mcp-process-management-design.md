# MCP Process Management Design

Date: 2026-04-05  
Status: Draft for review  
Scope: `gitnexus/src/cli/mcp.ts`, `gitnexus/src/cli/analyze.ts`, `gitnexus/src/cli/platform-process-scan.ts`, `gitnexus/src/mcp/repo-worker-manager.ts`, `gitnexus/src/mcp/repo-worker.ts`, `gitnexus/src/runtime/*`

## 1. Goal

Improve GitNexus' ability to manage its own MCP-related processes so that:

- stale MCP router and repo-worker processes are visible
- repo workers exit when their owning session dies
- `gitnexus analyze` can quiesce live repo holders predictably
- operators can inspect and clean up GitNexus-owned processes without using ad hoc `ps` and `kill`

The target outcome is not general terminal-process management. The target is a
reliable control plane for GitNexus-owned MCP router and repo-worker processes.

## 2. Current Problem

The current architecture already improved repo isolation by moving repo-scoped
runtime work into child workers, but process lifecycle management is still
shallow.

Today:

- `gitnexus analyze` scans for processes holding a repo's `.gitnexus/kuzu`
  path and sends `SIGTERM`
- `RepoWorkerManager` only tracks worker PIDs in memory inside the current
  router process
- workers only react to parent `disconnect` or termination signals
- there is no persisted registry of GitNexus-owned MCP processes
- there is no heartbeat, stale lease, idle reaping, or operator-facing process
  inspection command

This leaves several operational gaps:

- stale child processes from dead sessions can survive
- old MCP processes are hard to distinguish from current ones
- `analyze` only has a coarse “scan holders and kill them” path
- users have to debug process state with OS tools

## 3. Recommendation

Keep the current architecture:

- one stdio-facing MCP router process
- one child worker per active repo
- router process does not hold repo-scoped Kuzu handles

Add a lightweight MCP process control plane around it:

1. process registry
2. heartbeat and lease expiry
3. explicit drain protocol
4. idle worker reaping
5. operator-facing inspection and cleanup commands

This keeps the current correctness boundary, where process exit remains the
trusted native-runtime teardown mechanism, while making that process model
observable and manageable.

## 4. Non-Goals

This design does not attempt to:

- manage arbitrary non-GitNexus background terminals such as stray `npm install`
- replace stdio MCP with a long-lived daemon-first architecture
- make in-process native Kuzu teardown the primary correctness boundary
- solve every host editor's external process lifecycle behavior

## 5. Alternatives Considered

### 5.1 Stronger holder scan only

Rejected as insufficient.

Examples:

- scan `/proc` more aggressively
- add `SIGKILL` fallback only
- expose only `kill-stale`

Pros:

- small change set
- keeps current mental model

Cons:

- still infers intent from OS state
- no durable ownership model
- no answer to “which session owns this worker?”

### 5.2 Dedicated supervisor daemon

Rejected for now.

Pros:

- strongest control model
- central place for all lifecycle decisions

Cons:

- adds a second operational architecture
- more bootstrapping complexity for stdio MCP usage
- too heavy for the current problem

### 5.3 Lightweight runtime control plane

Recommended.

Pros:

- fits the current router/worker structure
- incremental migration path
- improves operator visibility and cleanup without inventing a new daemon

Cons:

- still requires careful cross-process coordination
- adds some runtime metadata files and background heartbeat activity

## 6. Proposed Architecture

### 6.1 Runtime Registry

Add a small persisted registry under global GitNexus runtime storage, not
inside any single repo's `.gitnexus/` directory. For example:

- `~/.gitnexus/runtime/mcp-processes/<pid>.json`

Reason:

- the router process is multi-repo and has no natural per-repo home
- operators need one place to inspect GitNexus-owned MCP processes across repos
- per-process files avoid a shared multi-writer registry bottleneck

This design intentionally keeps one file per process instead of a single shared
JSON file. The registry is written by many independent processes. Per-process
files reduce write contention, localize corruption, and avoid introducing a
single hot file that every router, worker, and cleanup command must serialize
through.

Each GitNexus-owned router or worker process writes one record containing:

- `pid`
- `ppid`
- `role`
  - `router`
  - `repo-worker`
- `sessionId`
- `startedAt`
- `lastHeartbeatAt`
- `repoId` and `repoName` for workers
- `repoPath`
- `storagePath`
- `cwd`
- `command`
- `state`
  - `starting`
  - `ready`
  - `draining`
  - `stopping`
- `routerPid`
  - router PID for workers

The registry is advisory metadata, not the source of truth for correctness.
Process existence and file holders still matter. The registry exists to make
lifecycle decisions understandable and inspectable.

Write protocol:

- each process writes only its own record
- updates use `write tmp file -> rename` for atomic replacement
- reads must tolerate missing or corrupt files
- heartbeat writes are best-effort advisory writes, not durability-critical
- `gc` may delete stale records at any time after PID revalidation

The registry should persist raw process facts. Derived health assessments such
as `healthy`, `suspect`, or `orphaned` should be computed by readers like
`gitnexus mcp ps`, not written independently by multiple processes.

### 6.2 Session Identity

When `gitnexus mcp` starts, it generates a router session ID and passes it to
all workers. The session ID should be unique per router start and should not be
reused across restarts.

Recommended format:

- `session-${process.pid}-${crypto.randomBytes(8).toString('hex')}`

This gives the session a human-readable PID anchor and an effectively unique
random suffix. The registry is advisory, so collision handling does not need a
distributed coordination mechanism; the combination of PID and random suffix is
already sufficient for practical uniqueness.

That session ID becomes the grouping boundary for:

- `mcp ps`
- stale cleanup
- analyze-time drain
- operator debugging

This is the missing ownership signal in the current implementation.

### 6.3 Heartbeat

Routers and workers refresh their registry records periodically with
conservative defaults.

Recommended defaults:

- heartbeat interval: `20s`
- supported configuration range: `15s` to `30s`
- stale threshold: `60s`

This gives a three-heartbeat window before a process is considered stale or
suspect.

Heartbeat expiry rules:

- if the registry record exists but the PID no longer exists, the record is
  stale and may be removed
- if the heartbeat is old and the PID no longer exists, cleanup is automatic
- if the PID exists but heartbeat is old, status becomes `suspect`

`gitnexus mcp ps` should always show the last heartbeat age directly, so
operators do not need short intervals to understand liveness.

This gives GitNexus a stable stale-process heuristic that is better than
matching argv strings alone.

### 6.4 Drain Protocol

Before `analyze` escalates to signals, it should ask GitNexus-owned MCP
processes to release the targeted repo cleanly.

Today workers are 1:1 with repos, so the drain boundary is per worker. The
router identifies the target worker by repo, then sends a worker-local drain
message:

- `drain(reason)`

Expected behavior:

- router marks affected worker `draining`
- worker stops accepting new repo calls
- worker disconnects repo runtime and acknowledges completion
- router reports success or timeout

Recommended defaults:

- drain acknowledgement timeout: `5s`
- drain completion timeout: `15s`
- no retry before escalation

If a worker acknowledges drain but does not complete within the completion
timeout, GitNexus should treat that as a failed cooperative shutdown and
escalate.

Only after drain timeout should `analyze` fall back to `SIGTERM`, then
optionally `SIGKILL` for confirmed GitNexus-owned stale holders.

### 6.5 Idle Worker Reaping

Add worker idle tracking in `RepoWorkerManager`:

- `lastUsedAt`
- configurable `maxIdleMs`

Behavior:

- if a worker is idle for the configured duration and has no in-flight
  requests, the router drains and terminates it
- a future repo request respawns a fresh worker

This reduces long-lived stale workers and shrinks the steady-state process set.

### 6.6 Orphan Detection

Workers should not rely only on parent IPC disconnect. They should also detect
when the owning router PID has died.

Recommended rule:

- each worker stores `routerPid`
- worker periodically verifies `routerPid` is alive
- if not, worker begins self-shutdown

This addresses orphaned worker processes after editor crashes or session loss.

### 6.7 Trust Boundary

This registry is a same-user local control plane, not a hardened security
boundary.

GitNexus should only signal a process when all of the following hold:

- the registry identifies it as GitNexus-owned
- the PID is still alive
- the command signature still matches GitNexus ownership at action time

This reduces accidental termination of unrelated processes, but it does not aim
to defend against a malicious local process running under the same OS user.

### 6.8 Platform Scope

This slice targets the current Linux/macOS operational model.

- registry metadata itself is platform-neutral
- PID liveness checks remain cross-platform
- holder scanning and signal escalation continue to follow the existing
  platform-specific code paths

Windows-specific process-management behavior is out of scope for this design
slice.

### 6.9 Migration

The first version of this control plane must coexist with older GitNexus
processes that do not publish registry records.

Expected migration behavior:

- if no registry entry exists, GitNexus falls back to the current
  holder-scan-based behavior
- old router and worker processes remain manageable through existing
  command-signature heuristics
- stale registry absence must never block normal MCP startup or `analyze`

## 7. CLI Surface

Add operator-facing commands under `gitnexus mcp`:

- `gitnexus mcp ps`
  Lists GitNexus-owned router and worker processes with status, session, repo,
  PID, age, and heartbeat freshness.
- `gitnexus mcp gc`
  Cleans stale registry entries and terminates clearly orphaned GitNexus-owned
  workers after PID and ownership verification.
- `gitnexus mcp gc --dry-run`
  Shows which registry entries or orphaned workers would be cleaned without
  changing system state.
- `gitnexus mcp gc --force`
  Extends cleanup to `suspect` GitNexus-owned processes, not only confirmed
  orphans and stale records.
- `gitnexus mcp drain --repo <name>`
  Requests cooperative repo drain for the named repo.

The commands should be diagnostic-first. Operators should be able to see what
GitNexus thinks is happening before destructive cleanup.

There is intentionally no separate `terminate --stale` command in v1. That
behavior belongs under `gc`, where operators can preview and then execute the
same cleanup decision tree.

### 7.1 Runtime Configuration

The following defaults are normative for the first implementation and should be
configurable in a later implementation slice via normal GitNexus runtime
configuration:

- heartbeat interval: `20s`
- stale threshold: `60s`
- drain acknowledgement timeout: `5s`
- drain completion timeout: `15s`
- idle worker reap threshold: `120s`

The design requires these thresholds to be configurable, but the exact config
surface can be finalized in the implementation plan.

## 8. Analyze Integration

`gitnexus analyze` should move from:

1. scan holders
2. `SIGTERM`
3. wait

to:

1. consult registry for GitNexus-owned routers and workers related to the repo
2. send cooperative drain request to matching owners
3. wait up to `5s` for drain acknowledgement and up to `15s` for completion
4. if holders remain, send `SIGTERM` to confirmed GitNexus-owned holders
5. wait for the existing signal-based grace period to expire
6. if they still remain, optionally escalate to `SIGKILL`, but only for
   freshly revalidated GitNexus-owned orphaned or stale holders
7. report exactly which path was taken

Fallback remains necessary because the registry can be stale or missing.
Holder scan is still the last-resort truth source.

### 8.1 Reindex Lock Discipline

The `2026-04-06` stale-lock incident clarified that MCP process management and
reindex-lock discipline solve adjacent problems, not the same problem.

The observed false "GitNexus is rebuilding the index" blocks were caused
primarily by broken lock ownership semantics:

- one `analyze` process could overwrite another process's `reindexing.lock`
- a later cleanup path could remove a different process's live lock
- MCP stale-lock cleanup needed to distinguish a dead pid from a newly written
  live lock before deleting anything

The incident also showed that mixed filesystem ownership is a secondary risk,
not the main root cause for this specific failure. Ownership mismatches can
still prevent stale-lock cleanup, but that must surface as an explicit
stale-lock / permission problem, not be collapsed into a misleading
"rebuilding" message.

This design therefore needs one explicit constraint:

- process registry, drain, and `mcp gc` complement reindex locks but do not
  replace per-repo lock ownership guarantees
- reindex-lock writes must remain atomic and refuse live owners
- reindex-lock cleanup must remain pid-bound and revalidate before delete
- read-path errors must distinguish:
  - active rebuild with live pid
  - stale lock for dead pid but deletion blocked
  - unreadable or invalid lock payload

One related non-goal should remain explicit: `detect_changes` and other MCP
read tools cannot safely keep serving a "last-good" index during a true rebuild
while `analyze` replaces Kuzu in place. Supporting that would require a shadow
index plus atomic swap design, which is out of scope for this slice.

## 9. Status Model

`gitnexus mcp ps` should report two dimensions, not one flattened status.

Lifecycle `state`:

- `starting`
- `ready`
- `draining`
- `stopping`

Derived `health`:

- `healthy`
  PID alive, heartbeat fresh, ownership chain intact
- `idle`
  worker alive but unused, eligible for reaping
- `suspect`
  PID alive but heartbeat old or ownership unclear
- `orphaned`
  worker alive but router PID missing
- `stale`
  registry record exists but PID is gone

This gives a stable vocabulary for status output and future automation.

## 10. Implementation Shape

Recommended internal additions:

- `gitnexus/src/runtime/mcp-process-registry.ts`
  - read/write per-process registry records
  - atomic `tmp -> rename` updates
  - enumerate processes by repo/session
  - remove stale entries
- `gitnexus/src/runtime/mcp-process-config.ts`
  - default timing values
  - parsed runtime configuration for heartbeat, drain, and reap thresholds
- `gitnexus/src/mcp/control-protocol.ts`
  - typed drain and lifecycle messages
- `gitnexus/src/mcp/repo-worker-manager.ts`
  - track `lastUsedAt`
  - idle reap timer
  - drain requests and acknowledgements
- `gitnexus/src/mcp/repo-worker.ts`
  - heartbeat loop
  - owner PID check
  - drain handling
- `gitnexus/src/cli/mcp.ts`
  - process registration for router mode
  - new `mcp ps/gc/drain` subcommands
- `gitnexus/src/cli/analyze.ts`
  - drain-first quiesce flow
- `gitnexus/src/cli/platform-process-scan.ts`
  - keep as fallback truth source, but use registry-aware filtering first

## 11. Testing Strategy

### 11.1 Unit Coverage

Add tests for:

- registry write, heartbeat refresh, stale entry cleanup
- session grouping and repo filtering
- worker idle reaping behavior
- orphan detection when owner PID disappears
- drain request state transitions

### 11.2 Integration Coverage

Add integration tests for:

- router spawns worker, both register successfully
- worker self-exits when router dies
- `analyze` drains a repo worker before signal fallback
- stale registry records do not block new sessions
- `mcp ps` reports mixed healthy and stale states correctly

Test infrastructure notes:

- orphaned-worker tests should explicitly kill or disconnect the router process
  without running normal shutdown
- integration tests can use forked CLI processes and direct IPC instead of a
  real editor MCP client
- timeout-dependent tests should use configurable clocks or widened CI-safe
  thresholds

### 11.3 Failure Coverage

Add focused tests for:

- registry file corruption
- worker fails during drain
- heartbeat timer stops unexpectedly
- drain timeout forces signal escalation
- router crash leaves workers behind

## 12. Rollout Plan

Recommended order:

1. add process registry and `mcp ps`
   Foundation for every later lifecycle feature.
2. add worker heartbeats and orphan detection
   Depends on step 1.
3. add worker idle reaping
   Depends on steps 1 and 2.
4. add drain protocol
   Depends on steps 1 and 2.
5. switch `analyze` to drain-first quiesce
   Depends on step 4.
6. add `mcp gc`
   Depends on steps 1 and 2, and benefits from step 5's clearer health model.

This order gives operator value early while reducing rollback risk.

## 13. Risks

### Risk 1: Registry becomes another stale state source

Mitigation:

- treat registry as advisory
- always verify PID liveness before action
- keep holder scan as fallback truth source

### Risk 2: Drain protocol adds new stuck states

Mitigation:

- state transitions must be time-bounded
- `analyze` must fall back to signals
- `mcp ps` must show why a process is considered draining or suspect

### Risk 3: Idle reaping hurts latency

Mitigation:

- make `maxIdleMs` configurable
- start with conservative defaults
- do not reap workers with in-flight requests

### Risk 4: Overreaching into non-GitNexus processes

Mitigation:

- only act on processes with GitNexus registry identity or high-confidence
  GitNexus command signatures
- do not expand scope into general system process management

### Risk 5: Registry write volume becomes noisy

Mitigation:

- keep per-process files to avoid shared-file contention
- use conservative heartbeat defaults
- avoid explicit fsync on every heartbeat write
- treat registry writes as advisory status updates, not critical durability

## 14. Recommendation Summary

GitNexus should improve MCP process management by adding a lightweight runtime
control plane around the current router/worker design, not by replacing it with
either manual kill heuristics or a heavyweight supervisor daemon.

The minimum meaningful slice is:

- runtime registry
- heartbeat
- `mcp ps`
- orphan detection
- drain-first analyze flow

That closes the biggest operational gap: GitNexus would know which MCP
processes are its own, which session owns them, whether they are healthy, and
how to shut them down predictably.
