# SIGUSR1 Cooperative Per-Repo Release Design

## Status

Blocked in the current single-process MCP architecture.

This document records why the original SIGUSR1 design is attractive, why it is
not safe to implement today, and what must be proven before revisiting it.

## Problem

Running `gitnexus analyze` in one project can disconnect MCP for other projects
served by the same `gitnexus mcp` process.

Today this happens because `analyze` looks for GitNexus MCP processes holding
the target Kuzu path and terminates those processes before rebuilding the index.

## Current Behavior

GitNexus MCP uses a single-process, multi-repo model:

1. One `gitnexus mcp` process serves multiple repos.
2. The MCP-side Kuzu adapter keeps a per-repo pool of read-only
   `Database`/`Connection` objects.
3. `gitnexus analyze` calls `quiesceGitNexusMcpHolders()` before rebuild.
4. `quiesceGitNexusMcpHolders()` sends `SIGTERM` to each MCP holder PID.

Relevant code:

- `gitnexus/src/cli/platform-process-scan.ts:141-179`
- `gitnexus/src/cli/analyze.ts:235-248`

This is disruptive but safe: once the MCP process exits, all native Kuzu
handles owned by that process disappear.

## Original Idea

The original proposal was:

1. `analyze` writes a coordination file under `/tmp`.
2. `analyze` sends `SIGUSR1` to the MCP process.
3. MCP reads the request, releases only the target repo's Kuzu pool entry, and
   writes an acknowledgment file.
4. The target repo reconnects lazily on the next tool call via
   `BackendRuntime.ensureInitialized()` and `initKuzu()`.
5. Other repos remain online because the MCP process stays alive.

The lazy reconnect part is real:

- `gitnexus/src/mcp/local/runtime/backend-runtime.ts:189-201`
- `gitnexus/src/mcp/core/kuzu-adapter.ts:142-199`

If per-repo release were reliable, this would be the right UX.

## Why This Is Blocked

The blocker is not the signal protocol. The blocker is native Kuzu teardown.

### 1. The MCP adapter does not have a safe per-repo close path on Linux

The MCP Kuzu pool currently removes repos from an in-memory `Map` without
closing the native Kuzu objects:

- `gitnexus/src/mcp/core/kuzu-adapter.ts:88-99`

`closeOne(repoId)` only:

1. deletes the pool entry
2. marks the repo inactive in `nativeRuntimeManager`

It does not call `conn.close()` or `db.close()`.

### 2. That is intentional, not an omission

The MCP adapter explicitly documents why it avoids native close:

- `gitnexus/src/mcp/core/kuzu-adapter.ts:89-95`

The comment states that native close/destructor paths can segfault on
Linux/macOS, so the adapter relies on GC or process exit instead of explicit
teardown.

### 3. Tests encode the same policy

The test helpers make the platform policy explicit:

- `gitnexus/test/helpers/native-teardown-policy.ts:1-4`
- `gitnexus/test/unit/native-teardown-policy.test.ts:4-11`
- `gitnexus/test/helpers/test-indexed-db.ts:125-144`

Current policy:

- Windows: explicit native close is allowed
- Linux/macOS: explicit native close is intentionally skipped

This means the SIGUSR1 design is blocked specifically on the platform we care
about for this issue.

### 4. Draining the pool is still not enough without a proven close

Even if MCP added a repo-level "drain" state so no new checkouts are allowed and
all checked-out queries finish naturally, the design would still lack the one
property `analyze` needs:

`analyze` must know that the target process no longer holds the Kuzu file.

Without a safe, bounded, explicit close operation for the repo's native
`Database` and `Connection` objects, draining only proves "no new logical work
is using this pool entry." It does not prove that the OS-level file handle or
database lock is gone in time for reindexing.

### 5. Ack files cannot be the source of truth

In the rejected version of this design, an ack file could be treated as success.
That is not sufficient.

The source of truth must remain "holder PID no longer has the target Kuzu path
open", which is what `analyze` effectively verifies today by polling
`listGitNexusMcpPidsHoldingPath()`.

If the native handle remains open after ack, `analyze` still loses.

## Decision

Do not implement SIGUSR1 cooperative per-repo release in the current
single-process MCP architecture.

The protocol is not the hard part. The missing prerequisite is a reliable,
Linux-safe, bounded native close path for one repo's Kuzu objects inside a
long-lived MCP process.

## Required Preconditions Before Revisiting

This design should only be reopened after all of the following are true:

1. A read-only per-repo Kuzu `Database`/`Connection` pair can be explicitly
   closed on Linux without deadlock, segfault, or leaked file handles.
2. The MCP pool supports a real repo-level drain state:
   no new checkout, queued waiters rejected, in-flight queries allowed to
   finish, then explicit native close.
3. `analyze` treats holder disappearance as the success condition, not merely
   receipt of an acknowledgment file.
4. Coordination files are request-scoped, not just pid-scoped, so concurrent
   analyze runs cannot overwrite each other.
5. The new behavior is covered by tests that prove:
   active queries complete, the target repo disconnects and lazily reconnects,
   unrelated repos stay available, and the target Kuzu holder PID actually
   releases the file before rebuild starts.

## What To Do Instead

For now, keep the current `SIGTERM`-based quiesce behavior for correctness.

If the multi-project disconnect problem becomes urgent, the next serious design
to evaluate is not "better signaling inside one process." It is process
isolation:

- keep one top-level MCP router process
- move each repo's Kuzu runtime into a dedicated worker process
- let `analyze` terminate only the worker that owns the target repo

See also:

- [`docs/mcp-per-repo-worker-isolation-design.md`](./mcp-per-repo-worker-isolation-design.md)

That approach avoids the current blocker because OS process exit is already the
only teardown path this codebase treats as reliably safe on Linux.

## Non-Goals

This document does not propose:

- a partial SIGUSR1 implementation with best-effort release
- an ack-only protocol
- a Linux-only drain mechanism that still relies on GC timing

Those variants still fail the core requirement: proving the target Kuzu holder
is actually gone before reindexing begins.
