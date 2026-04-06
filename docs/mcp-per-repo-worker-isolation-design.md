# MCP Per-Repo Worker Isolation Design

## Status

Proposed replacement for the blocked single-process SIGUSR1 design in
[`docs/sigusr1-cooperative-release-design.md`](./sigusr1-cooperative-release-design.md).

See also:

- [`docs/superpowers/plans/2026-04-04-mcp-per-repo-worker-isolation-implementation-plan.md`](./superpowers/plans/2026-04-04-mcp-per-repo-worker-isolation-implementation-plan.md)

## Problem

`gitnexus analyze` must rebuild one repo's Kuzu index without disconnecting MCP
for unrelated repos.

The single-process SIGUSR1 design is blocked because Linux-safe per-repo native
Kuzu close is not currently considered reliable. In this codebase, process exit
is the only teardown path treated as safe enough to guarantee release of native
Kuzu resources.

## Recommendation

Keep one top-level MCP router process on stdio, but move every repo-scoped Kuzu
runtime into its own child process.

When `analyze` needs to rebuild repo `B`, it terminates only repo `B`'s worker
process. Repo `A`'s worker keeps serving requests, so unrelated projects stay
online.

## Alternatives Considered

### 1. Router process + one long-lived worker per repo

Recommended.

Pros:

- matches the current repo-scoped runtime model
- process exit gives a reliable Kuzu teardown boundary
- keeps unaffected repos online during `analyze`
- preserves lazy reconnect by respawning only the worker that died

Cons:

- adds IPC and worker lifecycle management
- requires moving repo-scoped execution behind a process boundary

### 2. Spawn a fresh repo process for every tool call

Rejected for now.

Pros:

- simplest correctness model
- no long-lived worker state to manage

Cons:

- high latency on every tool/resource request
- repeated Kuzu open cost
- wasteful for agent workflows that call many tools back-to-back

### 3. Keep one process and add better signaling

Rejected.

This is the blocked SIGUSR1 path. Better signaling does not solve the core
problem: there is no proven Linux-safe, per-repo native close path inside the
long-lived MCP process.

## Current Architecture

Today the request path is:

1. `gitnexus/src/cli/mcp.ts` starts one stdio MCP server.
2. `gitnexus/src/mcp/server.ts` receives tool/resource requests.
3. `LocalBackend` resolves the repo and dispatches handlers.
4. Handlers call `ctx.runtime.ensureInitialized(repo.id)`.
5. Handlers then call `executeQuery()` / `executeParameterized()` from the
   in-process MCP Kuzu adapter.

Important constraint:

The handlers are not abstracted over a query transport. They import the
in-process Kuzu adapter directly, for example:

- `gitnexus/src/mcp/local/tools/handlers/query-handler.ts`
- `gitnexus/src/mcp/local/tools/handlers/impact-handler.ts`
- `gitnexus/src/mcp/local/tools/handlers/context-handler.ts`

That means this redesign cannot stop at "move connection management elsewhere."
Repo-scoped handler execution itself needs to move into the worker process, or
the handler/query boundary must be refactored first.

## Proposed Architecture

### Router Process

The existing stdio MCP process remains the only process visible to Claude Code.
Its responsibilities become:

- MCP transport and protocol handling
- repo registry refresh and repo resolution
- global resources that do not need Kuzu
- worker lifecycle management
- request forwarding and response shaping

The router must not open repo Kuzu handles.

### Repo Worker Process

Each repo worker owns exactly one repo-scoped execution environment:

- one pinned `RepoHandle`
- one repo-scoped backend/runtime
- the existing MCP-local Kuzu adapter for that repo
- repo-scoped tool handlers
- repo-scoped resource readers

Each worker is a normal OS child process, not a worker thread.

Reason:

`worker_threads` do not help with native Kuzu teardown because they still share
one process. We need process exit as the isolation boundary.

## Request Routing

### Requests that stay in the router

- `list_repos`
- `gitnexus://repos`
- `gitnexus://setup`
- metadata-only repo resolution and staleness checks that do not require Kuzu

### Requests that go to a repo worker

All repo-scoped tools:

- `query`
- `context`
- `impact`
- `detect_changes`
- `rename`
- `cypher`
- `overview` if still supported

All repo-scoped resources:

- `gitnexus://repo/{name}/context`
- `gitnexus://repo/{name}/clusters`
- `gitnexus://repo/{name}/processes`
- `gitnexus://repo/{name}/cluster/{clusterName}`
- `gitnexus://repo/{name}/process/{processName}`
- `gitnexus://repo/{name}/schema` if implemented through repo-side helpers

## IPC Contract

Use Node child-process IPC via `child_process.fork()`.

Each request from router to worker should include typed RPC, not low-level Kuzu
query forwarding. Two acceptable shapes are:

- user-facing `tool` / `resource` requests
- backend-method RPC for the existing `LocalBackend` public surface

The implementation plan uses backend-method RPC because `resources.ts` already
depends on `queryClusters()` / `queryProcesses()` / `queryClusterDetail()` /
`queryProcessDetail()`.

Example request shape:

```ts
type WorkerRequest =
  | {
      requestId: string;
      kind: 'request';
      method: 'callTool' | 'queryClusters' | 'queryProcesses' | 'queryClusterDetail' | 'queryProcessDetail';
      args: unknown[];
    }
  | {
      requestId: string;
      kind: 'shutdown';
      reason: 'idle-timeout' | 'router-shutdown';
    };
```

Each response should include:

```ts
type WorkerResponse =
  | {
      requestId: string;
      ok: true;
      result: unknown;
    }
  | {
      requestId: string;
      ok: false;
      error: {
        message: string;
        code?: string;
      };
    };
```

The router owns timeout enforcement and maps worker errors back to MCP tool or
resource responses.

## Runtime Boundaries

### Router-side components

Add a `RepoWorkerManager` responsible for:

- lazily spawning workers by `repo.id`
- tracking `pid`, `startedAt`, and in-flight requests
- forwarding requests and matching `requestId`
- evicting crashed workers from the map
- optional retry-once behavior for unexpected worker exit
- shutting down all workers when the router exits

Add a router backend layer, for example `RouterBackend`, that preserves the
current `LocalBackend` public shape used by `server.ts` and `resources.ts`, but
forwards repo-scoped work to `RepoWorkerManager`.

### Worker-side components

Add a dedicated entry point, for example:

- `gitnexus/src/mcp/repo-worker.ts`

This worker process should:

1. receive one pinned `RepoHandle` from the parent
2. initialize a repo-bound runtime
3. dispatch repo-scoped tools/resources
4. never resolve arbitrary other repos from the global registry

The simplest implementation is not to reuse the current multi-repo
`LocalBackend` as-is, but to create a thin repo-bound variant around the
existing handlers and resource helpers.

That keeps the worker honest: one process, one repo.

## Analyze Interaction

This design fixes the original problem by changing which processes hold Kuzu.

### Before

- one MCP process may hold Kuzu handles for repos A, B, C
- rebuilding repo B requires killing the whole MCP process

### After

- router process holds no Kuzu handles
- worker A holds repo A Kuzu only
- worker B holds repo B Kuzu only
- rebuilding repo B only requires terminating worker B

Operational flow:

1. `gitnexus analyze` calls `listGitNexusMcpPidsHoldingPath(kuzuPath)`.
2. The holder list now contains only repo workers for that path.
3. `analyze` terminates only those worker PIDs.
4. `analyze` waits until holder disappearance exactly as it does today.
5. Rebuild starts.
6. The next repo-B MCP call respawns worker B and reconnects lazily.

This keeps the correctness property of the current implementation:

`analyze` still waits for the actual file holder to disappear before rebuild.

## Failure Model

### Worker crash during a request

Router behavior:

1. fail all in-flight requests for that worker
2. remove the worker from the manager map
3. optionally retry the request once by spawning a fresh worker if the error was
   an unexpected exit rather than an explicit analyze-driven termination

### Worker terminated by analyze

This is not a router error. It is expected lifecycle.

The next request for that repo should lazily spawn a replacement worker.

### Router shutdown

On stdio close or signal:

1. router sends best-effort worker shutdown messages
2. router then terminates remaining workers if they do not exit promptly

## Required Refactors

This design is not a tiny patch. At minimum it requires:

1. introducing a router/worker IPC layer
2. separating global repo discovery from repo-scoped execution
3. moving repo-scoped handler execution into the worker process
4. moving repo-scoped resource reads into the worker process
5. keeping Kuzu adapter imports out of the top-level router

The main architectural insight is:

Do not try to forward only low-level query calls over IPC while leaving handler
logic in the router. The current handlers are tightly coupled to the local Kuzu
adapter and repo runtime. Forward the entire repo-scoped operation instead.

## Incremental Rollout

### Phase 1

- add worker process entrypoint
- add `RepoWorkerManager`
- forward repo-scoped tool calls only
- keep `SIGTERM`-based analyze quiesce unchanged

### Phase 2

- forward repo-scoped resources as well
- ensure router no longer initializes Kuzu at all
- add worker respawn and retry policy

### Phase 3

- optional worker idle timeout and reap
- optional worker health introspection

## Testing

Add coverage for:

1. router forwards repo-scoped tool requests to the correct worker
2. two repos can be queried concurrently through different workers
3. killing worker B does not break requests for worker A
4. after worker B is killed, the next repo-B request respawns it successfully
5. `analyze` still waits for holder disappearance before rebuilding
6. repo-scoped resources read through workers return the same shapes as today
7. router shutdown cleans up child workers

The most important integration test is:

- start one router
- exercise repo A and repo B so both workers are alive
- terminate only repo B's worker
- verify repo A still serves requests
- verify repo B is restored on the next request

## Non-Goals

This design does not attempt to:

- make single-process SIGUSR1 safe
- introduce worker threads for Kuzu teardown
- preserve in-process sharing of Kuzu state across repos

The point is the opposite: repo Kuzu state must become process-isolated so
`analyze` can reclaim one repo without collapsing MCP for all repos.
