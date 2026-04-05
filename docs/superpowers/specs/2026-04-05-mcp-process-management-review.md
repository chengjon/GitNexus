# MCP Process Management Design — Review

Reviewer: Claude Code
Date: 2026-04-05
Document: `2026-04-05-mcp-process-management-design.md`

---

## Overall Assessment

The design is well-scoped, pragmatic, and correctly targets the real operational gaps. The "lightweight control plane" approach is the right call — it preserves the existing router/worker boundary without introducing a daemon dependency. The incremental rollout plan is sound.

Below are specific concerns and suggestions organized by severity.

---

## Critical Concerns

### C1. Registry file-per-process creates I/O and cleanup friction

The proposal uses `.gitnexus/runtime/mcp-processes/<process-id>.json` — one file per process. This means:

- A long-running session with N repos spawns N files, each rewritten every 5-10 seconds for heartbeats.
- On systems with slow disk (network mounts, WSL2 cross-filesystem), this is significant I/O.
- Cleanup requires scanning and unlinking individual files, with race conditions during concurrent writes.

**Suggestion:** Consider a single registry file (e.g., `mcp-registry.jsonl` with append-only entries, or a single JSON file with atomic writes via rename). This reduces fsync pressure and makes cleanup a single unlink. If per-file isolation is needed for crash safety, document the tradeoff explicitly.

### C2. Heartbeat interval of 5-10 seconds may be too aggressive

Refreshing registry files every 5-10 seconds per process means:

- Each router + N workers = (N+1) file writes every 5-10 seconds.
- On battery-powered laptops or constrained CI runners, this is noticeable.
- The stale detection window depends on this interval — a 5-second heartbeat with a 15-second stale threshold gives only one missed heartbeat before triggering action.

**Suggestion:** Start with 15-30 second heartbeats and a 60-second stale threshold (3 missed beats). Document the configurable range. The `mcp ps` command can always show "last heartbeat X seconds ago" for real-time diagnostics.

### C3. No specification for session ID generation or collision handling

Section 6.2 says the router "generates a router session ID" but does not specify:

- Format (UUID? PID+timestamp? Random hex?)
- Collision probability and handling
- Whether it persists across router restarts or changes each spawn
- How to distinguish two routers for the same repo started in quick succession

**Suggestion:** Specify `session-${pid}-${crypto.randomBytes(8).toString('hex')}` or similar. Document that collisions are acceptable-risk (registry is advisory) but should be astronomically unlikely.

---

## Important Concerns

### I1. Status model conflates lifecycle states with health assessments

Section 9 mixes two orthogonal dimensions:

- **Lifecycle states** (starting, ready, draining, stopping) — transitions the process controls
- **Health assessments** (healthy, idle, suspect, orphaned, stale) — external observations about the process

For example, a process can be `ready` (lifecycle) and `suspect` (health) simultaneously. The current flat list forces choosing one.

**Suggestion:** Separate into two fields:
- `state`: `starting | ready | draining | stopping`
- `health`: `healthy | idle | suspect | orphaned | stale | dead`

This is clearer for `mcp ps` output and makes state transitions unambiguous.

### I2. Drain protocol lacks concrete timeout values and retry behavior

Section 6.4 describes the drain protocol but does not specify:

- How long `analyze` waits for drain acknowledgement before escalating
- Whether drain is retried
- What happens if a worker acknowledges drain but never completes it
- Whether drain is per-repo or per-worker (a worker serves one repo today, but the API says `drainRepo`)

**Suggestion:** Add concrete parameters:
- Drain acknowledgement timeout: 5 seconds
- Drain completion timeout: 15 seconds
- No retry — escalate on timeout
- Document that drain is currently per-worker since workers are 1:1 with repos

### I3. `mcp gc` vs `mcp terminate --stale` boundary is unclear

Section 7 defines both commands but their overlap is confusing:

- `gc`: "removes stale registry entries and optionally terminates clearly orphaned workers"
- `terminate --stale`: "terminates stale GitNexus-owned MCP processes after registry and PID checks"

When should an operator use which? What does `gc` do that `terminate --stale` doesn't?

**Suggestion:** Merge into a single `mcp gc` with flags:
- `mcp gc --dry-run`: show what would be cleaned (registry entries + orphaned processes)
- `mcp gc`: clean stale entries and terminate orphaned workers
- `mcp gc --force`: also terminate `suspect` processes (not just confirmed orphans)

Or keep separate but document the decision tree: `gc` for metadata cleanup, `terminate` for process signaling.

### I4. Missing consideration for concurrent registry access

Multiple processes (router, workers, CLI commands) read and write the registry simultaneously. The design does not address:

- Atomic writes (write-to-temp + rename)
- Read skew (seeing partially written records)
- Concurrent cleanup races (two `gc` commands running simultaneously)

**Suggestion:** Specify write protocol:
- Writes use atomic rename (`write tmp file → rename to target`)
- Reads tolerate missing/corrupt files (advisory registry)
- Add a lock file or use O_EXCL for the rare multi-router scenario

### I5. No discussion of Windows support

The current `platform-process-scan.ts` has platform-specific paths (`/proc` on Linux, `lsof` on macOS). The design adds registry-based process management but does not mention:

- Whether `.gitnexus/runtime/` paths work on Windows
- PID liveness checks on Windows (`process.kill(pid, 0)` works cross-platform, but `/proc` scans don't)
- Whether `SIGTERM`/`SIGKILL` semantics differ

**Suggestion:** Add a brief note. Even if Windows is not a target, stating "registry-based approach is platform-independent; signal escalation uses platform-specific paths as today" clarifies scope.

---

## Minor Suggestions

### M1. `ownerPid` field should be `routerPid` for clarity

Section 6.1 uses `ownerPid` but the only ownership relationship is worker→router. Using `routerPid` makes the semantics explicit and avoids confusion if other ownership types are added later.

### M2. Rollout step ordering could be more explicit about dependencies

Section 12 lists 6 rollout steps but does not call out dependencies:

- Step 4 (drain protocol) requires step 2 (heartbeat) for timeout detection
- Step 5 (drain-first analyze) requires step 4 (drain protocol)
- Step 6 (gc/terminate) benefits from step 2 (heartbeat) for stale classification

**Suggestion:** Add a simple dependency diagram or annotate each step with prerequisites.

### M3. Consider adding a `mcp ps --watch` mode

For active debugging, polling `mcp ps` is tedious. A watch mode (like `kubectl get pods -w`) that streams status changes would help operators catch intermittent issues.

### M4. Testing strategy could specify test infrastructure

Section 11 describes test categories well but does not mention:

- How to simulate orphaned workers in CI (kill parent without cleanup)
- Whether integration tests need a real MCP client or can use mock stdio
- Timeout-dependent tests need configurable clocks or generous CI timeouts

### M5. Registry path should respect repo isolation

The proposal uses `.gitnexus/runtime/mcp-processes/` under the repo's `.gitnexus/` directory. But router processes are repo-agnostic — they manage workers for multiple repos. A router's registry entry should probably live in a global location (e.g., `~/.gitnexus/runtime/`), while worker entries live in their respective repo directories.

**Suggestion:** Clarify whether the registry is per-repo or global. If per-repo, the router has no natural home. If global, workers for different repos share a namespace.

---

## Missing Topics

| Topic | Why it matters |
|-------|---------------|
| **Security** | Can a malicious process fake a registry entry to cause GitNexus to kill unrelated processes? Registry writes should at minimum verify PID ownership. |
| **Migration** | How does the system behave when upgrading from a version without registry to one with it? First run should be seamless. |
| **Observability** | Should heartbeat metrics be exported (structured logs, metrics endpoint) for monitoring? |
| **Configurable thresholds** | All timeouts (heartbeat interval, stale threshold, drain timeout, idle reap) should be documented as configurable with sensible defaults. |

---

## Summary

| Category | Count |
|----------|-------|
| Critical | 3 |
| Important | 5 |
| Minor | 5 |
| Missing topics | 4 |

The design is directionally correct and well-written. The critical concerns are about concrete operational details (I/O patterns, timing, ID generation) that should be resolved before implementation begins. None of them require rethinking the core approach — they refine the "how" rather than the "what."

**Recommendation:** Approve with revisions. Address C1-C3 and I1-I2 before implementation starts. The rest can be resolved during implementation of the relevant rollout steps.
