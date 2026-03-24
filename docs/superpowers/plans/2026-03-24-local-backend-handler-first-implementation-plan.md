# LocalBackend Handler-First Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `LocalBackend` into a stable facade plus internal runtime/handler seams without changing the external MCP and CLI behavior.

**Architecture:** Keep `LocalBackend` as the only public entry point, but move repo/runtime state into `BackendRuntime` and move tool-specific behavior into handler modules behind a `ToolRegistry`. Deliver the change incrementally: establish seams first, migrate read-only handlers, then analysis handlers, then `rename`, while keeping existing call sites and response shapes stable.

**Tech Stack:** TypeScript, Vitest, Kuzu, MCP server tooling, CLI commands, filesystem APIs, `child_process`, ripgrep

---

## Planned File Structure

**Create:**
- `gitnexus/src/mcp/local/runtime/backend-runtime.ts`
- `gitnexus/src/mcp/local/runtime/types.ts`
- `gitnexus/src/mcp/local/tools/tool-context.ts`
- `gitnexus/src/mcp/local/tools/tool-registry.ts`
- `gitnexus/src/mcp/local/tools/shared/query-safety.ts`
- `gitnexus/src/mcp/local/tools/shared/cypher-format.ts`
- `gitnexus/src/mcp/local/tools/shared/cluster-aggregation.ts`
- `gitnexus/src/mcp/local/tools/handlers/query-handler.ts`
- `gitnexus/src/mcp/local/tools/handlers/cypher-handler.ts`
- `gitnexus/src/mcp/local/tools/handlers/context-handler.ts`
- `gitnexus/src/mcp/local/tools/handlers/overview-handler.ts`
- `gitnexus/src/mcp/local/tools/handlers/impact-handler.ts`
- `gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts`
- `gitnexus/src/mcp/local/tools/handlers/rename-handler.ts`
- `gitnexus/test/unit/tool-registry.test.ts`

**Modify:**
- `gitnexus/src/mcp/local/local-backend.ts`
- `gitnexus/test/unit/calltool-dispatch.test.ts`
- `gitnexus/test/integration/local-backend-calltool.test.ts`
- `gitnexus/test/integration/local-backend.test.ts`
- `gitnexus/test/unit/server.test.ts`

**Intentionally unchanged in this phase:**
- `gitnexus/src/cli/tool.ts`
- `gitnexus/src/server/api.ts`
- `gitnexus/src/mcp/server.ts`

Those files are part of the blast radius and must be validated, but they should not need behavior changes if the facade contract is preserved.

### Task 1: Establish Runtime and Registry Seams

**Files:**
- Create: `gitnexus/src/mcp/local/runtime/types.ts`
- Create: `gitnexus/src/mcp/local/runtime/backend-runtime.ts`
- Create: `gitnexus/src/mcp/local/tools/tool-context.ts`
- Create: `gitnexus/src/mcp/local/tools/tool-registry.ts`
- Modify: `gitnexus/src/mcp/local/local-backend.ts`
- Test: `gitnexus/test/unit/calltool-dispatch.test.ts`
- Test: `gitnexus/test/unit/tool-registry.test.ts`

- [ ] **Step 1: Write the failing seam tests**

Add a new unit test file that proves the registry can:

- register handlers by tool name
- resolve aliases like `search -> query` and `explore -> context`
- throw a stable unknown-tool error

Use a minimal shape like:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createToolRegistry } from '../../src/mcp/local/tools/tool-registry.js';

describe('createToolRegistry', () => {
  it('resolves aliases to the same handler', async () => {
    const queryHandler = vi.fn().mockResolvedValue({ ok: true });
    const registry = createToolRegistry({ query: queryHandler, context: vi.fn() });

    await registry.dispatch('search', {} as any, {} as any);
    expect(queryHandler).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run seam-focused unit tests to verify failure**

Run:

```bash
cd gitnexus
npx vitest run test/unit/tool-registry.test.ts test/unit/calltool-dispatch.test.ts
```

Expected:
- `tool-registry.test.ts` fails because the file/module does not exist yet
- existing `calltool-dispatch` still passes

- [ ] **Step 3: Add runtime type definitions**

Create `runtime/types.ts` with the internal types currently embedded in `local-backend.ts`:

```ts
export interface CodebaseContext {
  projectName: string;
  stats: {
    fileCount: number;
    functionCount: number;
    communityCount: number;
    processCount: number;
  };
}

export interface RepoHandle {
  id: string;
  name: string;
  repoPath: string;
  storagePath: string;
  kuzuPath: string;
  indexState?: string;
  suggestedFix?: string;
  indexedAt: string;
  lastCommit: string;
  stats?: unknown;
}
```

- [ ] **Step 4: Implement `BackendRuntime` with behavior copied, not redesigned**

Move the following responsibilities out of `LocalBackend` and into `BackendRuntime`:

- repo map and caches
- `refreshRepos()`
- `resolveRepo()`
- `ensureInitialized()`
- `getContext()`
- `disconnect()`

Do not redesign the algorithm. Preserve the current behavior and error strings.

- [ ] **Step 5: Implement `ToolContext` and `ToolRegistry`**

Use a narrow context surface:

```ts
export interface ToolContext {
  runtime: BackendRuntime;
  repo: RepoHandle;
  logQueryError: (context: string, err: unknown) => void;
}
```

Registry should expose a single `dispatch(method, ctx, params)` function and own alias resolution.

- [ ] **Step 6: Rewire `LocalBackend` to use runtime + registry, but keep tool bodies inline for now**

`LocalBackend.callTool()` should become:

```ts
async callTool(method: string, params: any): Promise<any> {
  if (method === 'list_repos') return this.listRepos();
  const repo = await this.runtime.resolveRepo(params?.repo);
  return this.registry.dispatch(method, { runtime: this.runtime, repo, logQueryError }, params);
}
```

For this step, registry handlers may still delegate back into private methods on `LocalBackend` if needed. The goal is to establish seams before moving behavior.

- [ ] **Step 7: Run seam-focused tests and commit**

Run:

```bash
cd gitnexus
npx vitest run test/unit/tool-registry.test.ts test/unit/calltool-dispatch.test.ts test/unit/server.test.ts
```

Expected:
- all targeted tests pass

Commit:

```bash
git add gitnexus/src/mcp/local gitnexus/test/unit/tool-registry.test.ts gitnexus/test/unit/calltool-dispatch.test.ts gitnexus/test/unit/server.test.ts
git commit -m "refactor: add local backend runtime and registry seams"
```

### Task 2: Extract Shared Query-Safety and Formatting Helpers

**Files:**
- Create: `gitnexus/src/mcp/local/tools/shared/query-safety.ts`
- Create: `gitnexus/src/mcp/local/tools/shared/cypher-format.ts`
- Create: `gitnexus/src/mcp/local/tools/shared/cluster-aggregation.ts`
- Modify: `gitnexus/src/mcp/local/local-backend.ts`
- Modify: `gitnexus/test/integration/local-backend.test.ts`
- Modify: `gitnexus/test/unit/calltool-dispatch.test.ts`

- [ ] **Step 1: Move read-only shared constants and predicates**

Extract:

- `isTestFilePath`
- `VALID_NODE_LABELS`
- `VALID_RELATION_TYPES`
- `CYPHER_WRITE_RE`
- `isWriteQuery`

into `query-safety.ts`.

- [ ] **Step 2: Move cypher markdown formatting**

Extract `formatCypherAsMarkdown` into `cypher-format.ts` with the same output contract:

```ts
export function formatCypherAsMarkdown(result: any[]): { markdown: string; row_count: number }
```

- [ ] **Step 3: Move community aggregation helper**

Extract `aggregateClusters` into `cluster-aggregation.ts`.

- [ ] **Step 4: Update imports and keep compatibility re-exports if tests rely on them**

If current tests import `isWriteQuery` or `CYPHER_WRITE_RE` from `local-backend.ts`, re-export them from `local-backend.ts` temporarily so test call sites and external imports do not break during the refactor.

Example:

```ts
export {
  isTestFilePath,
  VALID_RELATION_TYPES,
  VALID_NODE_LABELS,
  CYPHER_WRITE_RE,
  isWriteQuery,
} from './tools/shared/query-safety.js';
```

- [ ] **Step 5: Run focused safety tests and commit**

Run:

```bash
cd gitnexus
npx vitest run test/integration/local-backend.test.ts test/unit/calltool-dispatch.test.ts
```

Expected:
- safety-related tests still pass
- exports still resolve from the old `local-backend.ts` import path

Commit:

```bash
git add gitnexus/src/mcp/local/local-backend.ts gitnexus/src/mcp/local/tools/shared gitnexus/test/integration/local-backend.test.ts gitnexus/test/unit/calltool-dispatch.test.ts
git commit -m "refactor: extract local backend query helpers"
```

### Task 3: Migrate Read-Only Handlers

**Files:**
- Create: `gitnexus/src/mcp/local/tools/handlers/query-handler.ts`
- Create: `gitnexus/src/mcp/local/tools/handlers/cypher-handler.ts`
- Create: `gitnexus/src/mcp/local/tools/handlers/context-handler.ts`
- Create: `gitnexus/src/mcp/local/tools/handlers/overview-handler.ts`
- Modify: `gitnexus/src/mcp/local/tools/tool-registry.ts`
- Modify: `gitnexus/src/mcp/local/local-backend.ts`
- Test: `gitnexus/test/unit/calltool-dispatch.test.ts`
- Test: `gitnexus/test/integration/local-backend-calltool.test.ts`

- [ ] **Step 1: Write one regression test proving dispatch still works after extraction**

Add assertions in `calltool-dispatch.test.ts` that exercise:

- `query`
- `cypher`
- `context`
- alias `search`
- alias `explore`

without relying on `LocalBackend` private methods.

- [ ] **Step 2: Run focused dispatch tests to verify the new assertion fails or is incomplete**

Run:

```bash
cd gitnexus
npx vitest run test/unit/calltool-dispatch.test.ts test/integration/local-backend-calltool.test.ts
```

Expected:
- a new or tightened assertion fails before handler extraction is complete

- [ ] **Step 3: Implement `query-handler.ts`**

Move the full query logic, including:

- hybrid search orchestration
- RRF merge
- process grouping
- optional content fetch

Use a function shape like:

```ts
export async function runQueryTool(ctx: ToolContext, params: QueryToolParams): Promise<any> {
  await ctx.runtime.ensureInitialized(ctx.repo.id);
  // existing query logic copied here
}
```

- [ ] **Step 4: Implement `cypher-handler.ts`, `context-handler.ts`, and `overview-handler.ts`**

Preserve:

- error strings
- parameter defaults
- disambiguation shape for `context`
- markdown output shape for `cypher`

- [ ] **Step 5: Register handlers and remove duplicated read-only implementations from `LocalBackend`**

`LocalBackend` should no longer own the internal implementation bodies for these tools after this step.

- [ ] **Step 6: Run read-only regression suites and commit**

Run:

```bash
cd gitnexus
npx vitest run test/unit/calltool-dispatch.test.ts test/integration/local-backend-calltool.test.ts test/unit/server.test.ts
```

Expected:
- all targeted unit/integration dispatch tests pass

Commit:

```bash
git add gitnexus/src/mcp/local/local-backend.ts gitnexus/src/mcp/local/tools/handlers gitnexus/src/mcp/local/tools/tool-registry.ts gitnexus/test/unit/calltool-dispatch.test.ts gitnexus/test/integration/local-backend-calltool.test.ts gitnexus/test/unit/server.test.ts
git commit -m "refactor: extract read-only local backend handlers"
```

### Task 4: Migrate Analysis Handlers

**Files:**
- Create: `gitnexus/src/mcp/local/tools/handlers/impact-handler.ts`
- Create: `gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts`
- Modify: `gitnexus/src/mcp/local/tools/tool-registry.ts`
- Modify: `gitnexus/src/mcp/local/local-backend.ts`
- Modify: `gitnexus/test/unit/calltool-dispatch.test.ts`
- Modify: `gitnexus/test/integration/local-backend-calltool.test.ts`

- [ ] **Step 1: Add regression coverage for `impact` and `detect_changes` through the registry path**

If no direct `detect_changes` call coverage exists in `calltool-dispatch.test.ts`, add it now using mocked git output.

Example stub:

```ts
vi.mock('child_process', () => ({
  execFileSync: vi.fn().mockReturnValue('src/auth.ts\n'),
}));
```

- [ ] **Step 2: Run focused tests and confirm the new branch is covered**

Run:

```bash
cd gitnexus
npx vitest run test/unit/calltool-dispatch.test.ts test/integration/local-backend-calltool.test.ts
```

Expected:
- the new `detect_changes` assertion fails until handler extraction is completed

- [ ] **Step 3: Implement `impact-handler.ts`**

Preserve:

- file-path target fallback
- relation allowlist filtering
- `includeTests`
- depth grouping
- risk level derivation
- enriched affected process/module output

- [ ] **Step 4: Implement `detect-changes-handler.ts`**

Preserve:

- `scope` modes: `unstaged`, `staged`, `all`, `compare`
- `base_ref` validation for `compare`
- summary shape
- git diff error messages

- [ ] **Step 5: Wire handlers into the registry and remove the old implementations**

Delete or inline-forward any stale private methods in `LocalBackend` once registry-backed behavior is passing.

- [ ] **Step 6: Run focused analysis tests and commit**

Run:

```bash
cd gitnexus
npx vitest run test/unit/calltool-dispatch.test.ts test/integration/local-backend-calltool.test.ts test/integration/local-backend.test.ts
```

Expected:
- `impact` and `detect_changes` behavior remains stable

Commit:

```bash
git add gitnexus/src/mcp/local/local-backend.ts gitnexus/src/mcp/local/tools/handlers/impact-handler.ts gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts gitnexus/src/mcp/local/tools/tool-registry.ts gitnexus/test/unit/calltool-dispatch.test.ts gitnexus/test/integration/local-backend-calltool.test.ts gitnexus/test/integration/local-backend.test.ts
git commit -m "refactor: extract local backend analysis handlers"
```

### Task 5: Migrate `rename` and Shrink the Facade

**Files:**
- Create: `gitnexus/src/mcp/local/tools/handlers/rename-handler.ts`
- Modify: `gitnexus/src/mcp/local/tools/tool-registry.ts`
- Modify: `gitnexus/src/mcp/local/local-backend.ts`
- Modify: `gitnexus/test/unit/calltool-dispatch.test.ts`
- Modify: `gitnexus/test/integration/local-backend-calltool.test.ts`

- [ ] **Step 1: Add a dedicated rename regression around dry-run and safe-path behavior**

If needed, extend `calltool-dispatch.test.ts` with assertions for:

- `dry_run` defaulting to `true`
- path traversal still throwing the same error
- graph edits still tagged as `graph`

- [ ] **Step 2: Run rename-focused unit coverage**

Run:

```bash
cd gitnexus
npx vitest run test/unit/calltool-dispatch.test.ts
```

Expected:
- the new rename assertion fails until extraction is complete

- [ ] **Step 3: Implement `rename-handler.ts` by copying behavior exactly**

Preserve:

- `context`-based symbol lookup
- disambiguation passthrough
- safe repo-relative path assertion
- graph-first edits
- ripgrep fallback
- `dry_run` vs apply behavior

- [ ] **Step 4: Remove migrated tool bodies from `LocalBackend`**

After `rename` moves, `LocalBackend` should be reduced to:

- constructor wiring
- `init`
- `listRepos`
- `callTool`
- `disconnect`
- any explicitly deferred resource helper methods that are out of scope for this phase

- [ ] **Step 5: Run the full LocalBackend-focused suite**

Run:

```bash
cd gitnexus
npx vitest run test/unit/tool-registry.test.ts test/unit/calltool-dispatch.test.ts test/unit/server.test.ts test/integration/local-backend.test.ts test/integration/local-backend-calltool.test.ts
```

Expected:
- all targeted suites pass
- no imports still depend on removed private method implementations

- [ ] **Step 6: Build and commit the completed refactor**

Run:

```bash
cd gitnexus
npm run build
```

Expected:
- TypeScript build passes with no unresolved imports

Commit:

```bash
git add gitnexus/src/mcp/local gitnexus/test/unit/tool-registry.test.ts gitnexus/test/unit/calltool-dispatch.test.ts gitnexus/test/unit/server.test.ts gitnexus/test/integration/local-backend.test.ts gitnexus/test/integration/local-backend-calltool.test.ts
git commit -m "refactor: split local backend tool handlers"
```

### Task 6: Final Verification and Documentation Sync

**Files:**
- Modify: `docs/superpowers/specs/2026-03-24-local-backend-handler-first-design.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [ ] **Step 1: Run final verification commands**

Run:

```bash
cd gitnexus
npx vitest run test/unit/tool-registry.test.ts test/unit/calltool-dispatch.test.ts test/unit/server.test.ts test/integration/local-backend.test.ts test/integration/local-backend-calltool.test.ts
npm run build
```

Expected:
- targeted tests pass
- build passes

- [ ] **Step 2: Update the design doc if implementation deviated in bounded ways**

Only adjust the spec for real implementation discoveries, not for incidental naming differences.

- [ ] **Step 3: Update the roadmap status**

Mark the `LocalBackend` hotspot refactor as started or completed, depending on landing scope.

- [ ] **Step 4: Run a final diff review**

Review:

```bash
git diff --stat main...HEAD
git diff -- gitnexus/src/mcp/local
```

Expected:
- changes are concentrated in `gitnexus/src/mcp/local/*`
- callers such as CLI and API remain behavior-stable

- [ ] **Step 5: Commit doc sync**

```bash
git add docs/superpowers/specs/2026-03-24-local-backend-handler-first-design.md docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md
git commit -m "docs: update local backend refactor status"
```

## Execution Notes

- Do not refactor `queryClusters`, `queryProcesses`, `queryClusterDetail`, or `queryProcessDetail` in this phase unless they block handler extraction.
- Do not change public tool names, parameter names, or response shapes.
- Keep error message text stable where current tests or callers rely on it.
- Prefer copying behavior into handlers first and cleaning duplication only after the tests pass.
