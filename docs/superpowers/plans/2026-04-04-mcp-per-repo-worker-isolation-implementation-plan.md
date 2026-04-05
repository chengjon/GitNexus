# MCP Per-Repo Worker Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Isolate repo-scoped MCP Kuzu runtimes into child processes so `gitnexus analyze` can reclaim one repo without disconnecting MCP for unrelated repos.

**Architecture:** Keep one stdio-facing MCP router process, but move repo-scoped execution behind a `RepoWorkerManager` that spawns hidden `gitnexus mcp --repo-worker` children. Reuse the existing `LocalBackend` handler stack inside each worker via a pinned single-repo runtime, and switch the top-level `mcp` command to a `RouterBackend` only after repo-scoped tools and resource helpers are forwarded over IPC.

**Tech Stack:** TypeScript, Node `child_process` IPC, Commander, Vitest, MCP server tooling, Kuzu, filesystem APIs, `child_process.execFileSync`

---

## Planned File Structure

**Create:**
- `gitnexus/src/mcp/backend-contract.ts`
- `gitnexus/src/mcp/router-backend.ts`
- `gitnexus/src/mcp/repo-worker-protocol.ts`
- `gitnexus/src/mcp/repo-worker-manager.ts`
- `gitnexus/src/mcp/repo-worker.ts`
- `gitnexus/src/mcp/local/runtime/pinned-repo-runtime.ts`
- `gitnexus/test/unit/router-backend.test.ts`
- `gitnexus/test/unit/repo-worker-manager.test.ts`
- `gitnexus/test/integration/repo-worker.test.ts`
- `gitnexus/test/integration/router-backend-worker.test.ts`
- `gitnexus/test/integration/mcp-worker-isolation.test.ts`

**Modify:**
- `gitnexus/src/cli/index.ts`
- `gitnexus/src/cli/mcp.ts`
- `gitnexus/src/mcp/server.ts`
- `gitnexus/src/mcp/resources.ts`
- `gitnexus/test/unit/server.test.ts`
- `gitnexus/test/unit/resources.test.ts`

**Intentionally unchanged until the final cutover:**
- `gitnexus/src/mcp/local/local-backend.ts`
- `gitnexus/src/mcp/local/tools/handlers/*`
- `gitnexus/src/cli/analyze.ts`
- `gitnexus/src/cli/platform-process-scan.ts`

Reason:

- `LocalBackend` and the existing handlers already express the repo-scoped work we want.
- `analyze` and `platform-process-scan` should continue using the current holder-polling logic.
- The worker command should intentionally keep `mcp` in its argv (`gitnexus mcp --repo-worker`) so the current process-scan predicate keeps working without redesign.

### Task 1: Add a Router/Backend Contract Seam

**Files:**
- Create: `gitnexus/src/mcp/backend-contract.ts`
- Create: `gitnexus/src/mcp/router-backend.ts`
- Modify: `gitnexus/src/mcp/server.ts`
- Modify: `gitnexus/src/mcp/resources.ts`
- Test: `gitnexus/test/unit/router-backend.test.ts`
- Test: `gitnexus/test/unit/server.test.ts`
- Test: `gitnexus/test/unit/resources.test.ts`

- [ ] **Step 1: Write the failing seam tests**

Create `gitnexus/test/unit/router-backend.test.ts` with metadata-only tests that do not require Kuzu:

```ts
import { describe, expect, it, vi } from 'vitest';
import { RouterBackend } from '../../src/mcp/router-backend.js';

describe('RouterBackend', () => {
  it('lists repos from the injected runtime without opening Kuzu', async () => {
    const runtime = {
      init: vi.fn().mockResolvedValue(true),
      refreshRepos: vi.fn().mockResolvedValue(undefined),
      getRepos: vi.fn().mockReturnValue([{ name: 'repo-a', repoPath: '/tmp/repo-a', storagePath: '/tmp/.gitnexus/repo-a', kuzuPath: '/tmp/.gitnexus/repo-a/kuzu', indexedAt: 'x', lastCommit: 'abc' }]),
      resolveRepo: vi.fn(),
      getContext: vi.fn().mockReturnValue(null),
      disconnect: vi.fn().mockResolvedValue(undefined),
    } as any;

    const backend = new RouterBackend({ runtime, workerManager: {} as any });
    const repos = await backend.listRepos();
    expect(repos).toHaveLength(1);
    expect(runtime.refreshRepos).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the seam-focused tests to verify failure**

Run:

```bash
cd gitnexus
npx vitest run test/unit/router-backend.test.ts test/unit/server.test.ts test/unit/resources.test.ts
```

Expected:
- `router-backend.test.ts` fails because `router-backend.ts` does not exist yet

- [ ] **Step 3: Introduce a structural backend contract**

Create `gitnexus/src/mcp/backend-contract.ts` and move the server/resources dependency to an interface, not the `LocalBackend` class:

```ts
export interface McpBackendLike {
  callTool(method: string, params: any): Promise<any>;
  listRepos(): Promise<any[]>;
  resolveRepo(repoParam?: string): Promise<any>;
  getContext(repoId?: string): any;
  queryClusters(repoName?: string, limit?: number): Promise<{ clusters: any[] }>;
  queryProcesses(repoName?: string, limit?: number): Promise<{ processes: any[] }>;
  queryClusterDetail(name: string, repoName?: string): Promise<any>;
  queryProcessDetail(name: string, repoName?: string): Promise<any>;
  disconnect(): Promise<void>;
}
```

Update `server.ts` and `resources.ts` to depend on `McpBackendLike`.

- [ ] **Step 4: Create the initial `RouterBackend` facade**

Implement a minimal `RouterBackend` that:

- accepts injected `BackendRuntime` and `RepoWorkerManager`
- supports `init()`, `listRepos()`, `resolveRepo()`, `getContext()`, `disconnect()`
- throws explicit `Not implemented` errors for repo-scoped forwarded methods for now

Do not wire it into `cli/mcp.ts` yet.

- [ ] **Step 5: Re-run seam tests and build**

Run:

```bash
cd gitnexus
npx vitest run test/unit/router-backend.test.ts test/unit/server.test.ts test/unit/resources.test.ts
npm run build
```

Expected:
- seam/unit tests pass
- TypeScript build passes with `server.ts` / `resources.ts` no longer tied to the `LocalBackend` class type

- [ ] **Step 6: Commit**

```bash
git add gitnexus/src/mcp/backend-contract.ts gitnexus/src/mcp/router-backend.ts gitnexus/src/mcp/server.ts gitnexus/src/mcp/resources.ts gitnexus/test/unit/router-backend.test.ts gitnexus/test/unit/server.test.ts gitnexus/test/unit/resources.test.ts
git commit -m "refactor: add mcp backend contract and router seam"
```

### Task 2: Add Repo Worker Protocol and Manager

**Files:**
- Create: `gitnexus/src/mcp/repo-worker-protocol.ts`
- Create: `gitnexus/src/mcp/repo-worker-manager.ts`
- Modify: `gitnexus/src/mcp/router-backend.ts`
- Test: `gitnexus/test/unit/repo-worker-manager.test.ts`

- [ ] **Step 1: Write the failing manager tests**

Create `gitnexus/test/unit/repo-worker-manager.test.ts` with an injected fake `forkWorker`:

```ts
it('spawns gitnexus mcp --repo-worker only once per repo id', async () => {
  const forkWorker = vi.fn().mockReturnValue(createFakeChild());
  const manager = new RepoWorkerManager({ forkWorker, requestTimeoutMs: 1000 });

  await manager.ensureWorker(REPO);
  await manager.ensureWorker(REPO);

  expect(forkWorker).toHaveBeenCalledTimes(1);
  expect(forkWorker.mock.calls[0][1]).toEqual(['mcp', '--repo-worker']);
});
```

Also cover:

- request/response correlation by `requestId`
- timeout rejection
- in-flight request rejection on worker exit

- [ ] **Step 2: Run the new manager tests to verify failure**

Run:

```bash
cd gitnexus
npx vitest run test/unit/repo-worker-manager.test.ts
```

Expected:
- failure because the manager/protocol modules do not exist yet

- [ ] **Step 3: Define the IPC message types**

Create `repo-worker-protocol.ts` with explicit message unions:

```ts
export type WorkerBootstrapMessage = {
  kind: 'init';
  repo: RepoHandle;
};

export type WorkerRequestMessage = {
  kind: 'request';
  requestId: string;
  method: 'callTool' | 'queryClusters' | 'queryProcesses' | 'queryClusterDetail' | 'queryProcessDetail';
  args: unknown[];
};
```

Use backend-method RPC, not raw query forwarding. This matches the current `resources.ts` / `LocalBackend` public shape and avoids inventing a second routing model.

- [ ] **Step 4: Implement `RepoWorkerManager` with injectable spawning**

The manager should:

- lazily spawn by `repo.id`
- call `fork(cliEntry, ['mcp', '--repo-worker'], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] })`
- send one bootstrap `init` message containing the `RepoHandle`
- keep `Map<string, WorkerState>`
- expose:

```ts
call(repo: RepoHandle, method: WorkerRequestMessage['method'], ...args: unknown[]): Promise<unknown>
disconnect(): Promise<void>
```

Important:

- keep `mcp` in argv so the existing holder scan continues to recognize worker processes
- do not import the Kuzu adapter here

- [ ] **Step 5: Re-run manager tests**

Run:

```bash
cd gitnexus
npx vitest run test/unit/repo-worker-manager.test.ts
```

Expected:
- manager tests pass

- [ ] **Step 6: Commit**

```bash
git add gitnexus/src/mcp/repo-worker-protocol.ts gitnexus/src/mcp/repo-worker-manager.ts gitnexus/src/mcp/router-backend.ts gitnexus/test/unit/repo-worker-manager.test.ts
git commit -m "feat: add mcp repo worker protocol and manager"
```

### Task 3: Add Hidden Repo Worker Mode and Pinned Runtime

**Files:**
- Create: `gitnexus/src/mcp/local/runtime/pinned-repo-runtime.ts`
- Create: `gitnexus/src/mcp/repo-worker.ts`
- Modify: `gitnexus/src/cli/index.ts`
- Modify: `gitnexus/src/cli/mcp.ts`
- Test: `gitnexus/test/integration/repo-worker.test.ts`

- [ ] **Step 1: Write the failing worker integration test**

Create `gitnexus/test/integration/repo-worker.test.ts` that:

1. provisions a seeded indexed repo with `withTestKuzuDB`
2. forks the hidden worker command
3. sends `{ kind: 'init', repo }`
4. sends a `callTool` request for `context` or `cypher`
5. asserts a structured success response comes back

Sketch:

```ts
const child = fork(cliEntry, ['mcp', '--repo-worker'], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });
child.send({ kind: 'init', repo });
child.send({ kind: 'request', requestId: '1', method: 'callTool', args: ['context', { name: 'login' }] });
```

- [ ] **Step 2: Run the worker integration test to verify failure**

Run:

```bash
cd gitnexus
npx vitest run test/integration/repo-worker.test.ts
```

Expected:
- failure because `--repo-worker` mode and worker bootstrap do not exist yet

- [ ] **Step 3: Implement `PinnedRepoRuntime`**

Create a runtime that satisfies `LocalBackendRuntimeLike` but is bound to one `RepoHandle`.

Rules:

- `refreshRepos()` is a no-op
- `getRepos()` returns `[repo]`
- `resolveRepo()` only accepts the pinned repo
- `ensureInitialized()` calls `initKuzu(repo.id, repo.kuzuPath)` only for that repo
- `disconnect()` calls `closeKuzu(repo.id)`

This lets the worker reuse the existing `LocalBackend` unchanged.

- [ ] **Step 4: Implement `repo-worker.ts`**

The worker should:

- wait for one bootstrap `init` message
- construct `new LocalBackend(new PinnedRepoRuntime(repo))`
- answer `callTool`, `queryClusters`, `queryProcesses`, `queryClusterDetail`, `queryProcessDetail`
- return `{ requestId, ok: true, result }` or `{ requestId, ok: false, error }`
- clean up on `disconnect`, `SIGTERM`, and `SIGINT`

- [ ] **Step 5: Add hidden `--repo-worker` mode to the CLI**

Modify `cli/index.ts` and `cli/mcp.ts` so:

- normal `gitnexus mcp` still starts the stdio router
- hidden `gitnexus mcp --repo-worker` starts `repo-worker.ts`

Keep this option out of normal docs/help output.

- [ ] **Step 6: Re-run worker integration test and build**

Run:

```bash
cd gitnexus
npx vitest run test/integration/repo-worker.test.ts
npm run build
```

Expected:
- worker integration test passes against a real seeded repo
- build passes

- [ ] **Step 7: Commit**

```bash
git add gitnexus/src/mcp/local/runtime/pinned-repo-runtime.ts gitnexus/src/mcp/repo-worker.ts gitnexus/src/cli/index.ts gitnexus/src/cli/mcp.ts gitnexus/test/integration/repo-worker.test.ts
git commit -m "feat: add hidden repo worker mode for mcp"
```

### Task 4: Forward Repo-Scoped Tool Calls Through the Router

**Files:**
- Modify: `gitnexus/src/mcp/router-backend.ts`
- Modify: `gitnexus/src/mcp/repo-worker-manager.ts`
- Test: `gitnexus/test/integration/router-backend-worker.test.ts`
- Test: `gitnexus/test/unit/router-backend.test.ts`

- [ ] **Step 1: Write the failing router-to-worker tool integration test**

Create `gitnexus/test/integration/router-backend-worker.test.ts` that:

1. mocks `listRegisteredRepos()` with a seeded repo entry
2. creates a real `RepoWorkerManager`
3. creates `RouterBackend`
4. calls `backend.callTool('context', { name: 'login' })`
5. asserts the result matches the existing `LocalBackend` shape

Also add one multi-request assertion:

- `query` then `context` on the same repo should reuse the same worker process

- [ ] **Step 2: Run the router-to-worker tool test to verify failure**

Run:

```bash
cd gitnexus
npx vitest run test/integration/router-backend-worker.test.ts test/unit/router-backend.test.ts
```

Expected:
- failure because `RouterBackend.callTool()` does not forward anything yet

- [ ] **Step 3: Implement `RouterBackend.callTool()` via `RepoWorkerManager`**

Use the existing repo resolution flow:

```ts
async callTool(method: string, params: any): Promise<any> {
  if (method === 'list_repos') return this.listRepos();
  const repo = await this.runtime.resolveRepo(params?.repo);
  return this.workerManager.call(repo, 'callTool', method, params);
}
```

Do not switch `cli/mcp.ts` to `RouterBackend` yet. Finish the forwarding and tests first.

- [ ] **Step 4: Add worker reuse assertions**

Extend the unit tests so the manager exposes enough introspection for tests to prove:

- repeated calls for the same `repo.id` reuse one worker
- different repos create different workers

- [ ] **Step 5: Re-run tool-forwarding tests**

Run:

```bash
cd gitnexus
npx vitest run test/integration/router-backend-worker.test.ts test/unit/router-backend.test.ts test/integration/local-backend-calltool.test.ts
```

Expected:
- router/worker tool tests pass
- existing `LocalBackend` callTool integration still passes unchanged

- [ ] **Step 6: Commit**

```bash
git add gitnexus/src/mcp/router-backend.ts gitnexus/src/mcp/repo-worker-manager.ts gitnexus/test/integration/router-backend-worker.test.ts gitnexus/test/unit/router-backend.test.ts
git commit -m "feat: forward repo-scoped mcp tools through workers"
```

### Task 5: Forward Repo-Scoped Resource Helpers and Cut Over `gitnexus mcp`

**Files:**
- Modify: `gitnexus/src/mcp/router-backend.ts`
- Modify: `gitnexus/src/cli/mcp.ts`
- Modify: `gitnexus/test/unit/resources.test.ts`
- Modify: `gitnexus/test/unit/server.test.ts`
- Modify: `gitnexus/test/integration/router-backend-worker.test.ts`

- [ ] **Step 1: Write failing resource-forwarding tests**

Add tests proving the router backend serves repo-scoped resource helpers without opening Kuzu in the router:

- `queryClusters('repo-a', 100)` forwards to worker
- `queryProcesses('repo-a', 50)` forwards to worker
- `queryClusterDetail('Auth', 'repo-a')` forwards to worker
- `queryProcessDetail('User Login', 'repo-a')` forwards to worker

Use worker-backed integration coverage for result shapes and unit coverage for method routing.

- [ ] **Step 2: Run resource tests to verify failure**

Run:

```bash
cd gitnexus
npx vitest run test/unit/resources.test.ts test/unit/server.test.ts test/integration/router-backend-worker.test.ts
```

Expected:
- repo-scoped resource helper tests fail because `RouterBackend` still throws `Not implemented`

- [ ] **Step 3: Implement the forwarded resource helper methods**

In `RouterBackend`, forward only the Kuzu-dependent methods:

```ts
async queryClusters(repoName?: string, limit = 100) {
  const repo = await this.runtime.resolveRepo(repoName);
  return this.workerManager.call(repo, 'queryClusters', repoName, limit);
}
```

Keep these methods local to the router:

- `listRepos()`
- `resolveRepo()`
- `getContext()`

Reason:

- `context` resource currently uses cached repo stats plus staleness checks, not graph queries

- [ ] **Step 4: Switch `mcpCommand` to `RouterBackend`**

Once both tool and resource helper forwarding pass, update normal `gitnexus mcp` startup:

```ts
const backend = new RouterBackend();
await backend.init();
await startMCPServer(backend);
```

Do not leave a mixed mode where the router still instantiates `LocalBackend`, because that would reopen Kuzu in the router and defeat the isolation design.

- [ ] **Step 5: Re-run router-facing tests and build**

Run:

```bash
cd gitnexus
npx vitest run test/unit/server.test.ts test/unit/resources.test.ts test/integration/router-backend-worker.test.ts test/integration/repo-worker.test.ts
npm run build
```

Expected:
- server/resources tests pass against `RouterBackend`
- build passes

- [ ] **Step 6: Commit**

```bash
git add gitnexus/src/mcp/router-backend.ts gitnexus/src/cli/mcp.ts gitnexus/test/unit/resources.test.ts gitnexus/test/unit/server.test.ts gitnexus/test/integration/router-backend-worker.test.ts
git commit -m "feat: route repo-scoped mcp resources through workers"
```

### Task 6: Add Isolation and Analyze-Regressions Coverage

**Files:**
- Create: `gitnexus/test/integration/mcp-worker-isolation.test.ts`
- Modify: `gitnexus/src/mcp/repo-worker-manager.ts`
- Modify: `gitnexus/test/integration/router-backend-worker.test.ts`

- [ ] **Step 1: Write the failing isolation test**

Create an integration test that provisions two repos, starts two workers through one `RouterBackend`, then proves:

1. repo A and repo B create distinct worker pids
2. killing worker B does not break repo A
3. the next repo-B request respawns worker B

Use a manager test hook like:

```ts
const pidA = backend.__testOnlyGetWorkerPid(repoA.id);
const pidB = backend.__testOnlyGetWorkerPid(repoB.id);
process.kill(pidB, 'SIGTERM');
```

- [ ] **Step 2: Add a holder-scan regression assertion**

In the same integration file, on Linux only, assert:

```ts
const holders = await listGitNexusMcpPidsHoldingPath(repoA.kuzuPath);
expect(holders).toContain(String(pidA));
expect(holders).not.toContain(String(routerPid));
```

This is the core proof that `analyze` can keep its existing holder-disappearance semantics.

- [ ] **Step 3: Run the isolation regression test to verify failure**

Run:

```bash
cd gitnexus
npx vitest run test/integration/mcp-worker-isolation.test.ts
```

Expected:
- failure because worker pid introspection and/or respawn behavior is not exposed yet

- [ ] **Step 4: Implement minimal lifecycle hooks needed for the test**

Add only test-facing hooks that are safe to keep:

- worker exit cleanup from the manager map
- respawn-on-next-request after intentional or unexpected worker exit
- `__testOnlyGetWorkerPid(repoId)` for integration coverage

Do not add production-only idle reaping in this task.

- [ ] **Step 5: Re-run the isolation regression test**

Run:

```bash
cd gitnexus
npx vitest run test/integration/mcp-worker-isolation.test.ts test/integration/router-backend-worker.test.ts
```

Expected:
- repo-isolation regression passes
- router/worker integration remains green

- [ ] **Step 6: Run the final focused verification sweep**

Run:

```bash
cd gitnexus
npx vitest run test/unit/router-backend.test.ts test/unit/repo-worker-manager.test.ts test/unit/server.test.ts test/unit/resources.test.ts test/integration/repo-worker.test.ts test/integration/router-backend-worker.test.ts test/integration/mcp-worker-isolation.test.ts test/integration/local-backend-calltool.test.ts
npm run build
```

Expected:
- all targeted tests pass
- TypeScript build passes

- [ ] **Step 7: Commit**

```bash
git add gitnexus/src/mcp/repo-worker-manager.ts gitnexus/test/integration/mcp-worker-isolation.test.ts gitnexus/test/integration/router-backend-worker.test.ts
git commit -m "test: cover mcp per-repo worker isolation"
```

## Notes for the Implementer

- Keep `LocalBackend` worker-side. Do not try to invent a second repo-scoped handler layer unless the pinned runtime approach fails.
- Do not forward raw Cypher or low-level `executeQuery()` over IPC. Forward backend methods and let the worker keep repo-local behavior.
- Do not switch the default `mcp` command to `RouterBackend` until both tools and repo-scoped resources are forwarded.
- Preserve the existing `gitnexus analyze` quiesce path. This project only works if holder disappearance remains the source of truth.
- Reuse the existing worker path resolution pattern from `src/core/ingestion/pipeline.ts` when locating the worker entry in source-vs-dist environments.
