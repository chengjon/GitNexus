# LocalBackend Handler-First Refactor Design

Date: 2026-03-24  
Status: Draft for review  
Scope: `gitnexus/src/mcp/local/local-backend.ts`

## 1. Goal

Reduce the risk and maintenance cost of `LocalBackend` by splitting tool-specific behavior out of the current 1713-line class while preserving the existing external API and runtime behavior.

This is the first `P1` technical debt slice after the native runtime and test-foundation `P0` work. The target is not a full architecture rewrite. The target is to turn `LocalBackend` from a do-everything class into a stable facade with explicit internal seams.

## 2. Current Problem

`LocalBackend` currently mixes four categories of responsibility in one file:

- repo registry refresh and repo resolution
- repo initialization and Kuzu readiness checks
- MCP tool dispatch and backward-compatible aliases
- concrete tool implementations for:
  - `query`
  - `cypher`
  - `context`
  - `overview`
  - `impact`
  - `detect_changes`
  - `rename`
  - resource-oriented helpers such as clusters/processes detail methods

This creates three operational problems:

1. Changes to one tool increase review and regression risk for unrelated tools.
2. Shared runtime state is tightly coupled to tool logic, making later runtime cleanup harder.
3. The file is too large to reason about confidently when changing MCP behavior.

## 3. Chosen Approach

Adopt a handler-first internal refactor.

Keep `LocalBackend` as the external facade used by:

- `src/server/api.ts:createServer`
- `src/cli/tool.ts:getBackend`
- `src/cli/mcp.ts:mcpCommand`
- `src/cli/eval-server.ts:evalServerCommand`

Move concrete tool behavior into dedicated handler modules behind a registry and shared tool context.

This is preferred over a runtime-first rewrite because:

- external callers can remain unchanged
- tool behavior can be migrated incrementally
- each migration step is easier to validate with existing tests
- runtime extraction can happen in a second pass once handler boundaries are real

## 4. Non-Goals

This phase will not:

- remove `LocalBackend`
- redesign the MCP tool API
- rewrite query logic or change result shapes
- introduce a DI framework
- combine this work with a `BackendRuntime` service rewrite
- expand into unrelated MCP resource refactors

## 5. Target Architecture

### 5.1 `LocalBackend`

`LocalBackend` remains the only externally constructed class.

Its steady-state responsibilities should be:

- `init()`
- `listRepos()`
- `callTool()`
- `disconnect()`

Internally it should delegate to:

- `BackendRuntime` for repo and initialization state
- `ToolRegistry` for method-to-handler dispatch

### 5.2 `BackendRuntime`

`BackendRuntime` owns repo state and initialization flow only.

Expected responsibilities:

- hold `repos`, `contextCache`, `initializedRepos`
- refresh registry data
- resolve repo from name/path/current selection
- ensure Kuzu is initialized for a repo
- provide lightweight repo metadata and cached context
- disconnect active Kuzu handles on shutdown

It must not know anything about specific MCP tools such as `rename` or `impact`.

### 5.3 `ToolRegistry`

`ToolRegistry` maps MCP methods to handler implementations.

Initial supported methods:

- `query`
- `cypher`
- `context`
- `overview`
- `impact`
- `detect_changes`
- `rename`
- aliases:
  - `search -> query`
  - `explore -> context`

This gives one place to see which tools exist and how they are routed.

### 5.4 `ToolContext`

`ToolContext` is the dependency bundle shared by handlers.

It should expose:

- the resolved `RepoHandle`
- runtime accessors
- query executors
- structured error logging
- minimal helper utilities shared across handlers

It should not become a second copy of `LocalBackend`.

### 5.5 Handler Modules

Each handler module owns one tool family and its local helper logic.

Planned first-wave handlers:

- `tools/handlers/query-handler.ts`
- `tools/handlers/cypher-handler.ts`
- `tools/handlers/context-handler.ts`
- `tools/handlers/overview-handler.ts`
- `tools/handlers/impact-handler.ts`
- `tools/handlers/detect-changes-handler.ts`
- `tools/handlers/rename-handler.ts`

## 6. File Layout

Recommended first-pass layout:

```text
gitnexus/src/mcp/local/
  local-backend.ts
  runtime/
    backend-runtime.ts
    types.ts
  tools/
    tool-context.ts
    tool-registry.ts
    shared/
      cluster-aggregation.ts
      cypher-format.ts
      query-safety.ts
    handlers/
      context-handler.ts
      cypher-handler.ts
      detect-changes-handler.ts
      impact-handler.ts
      overview-handler.ts
      query-handler.ts
      rename-handler.ts
```

`types.ts` is optional but recommended if `RepoHandle` and related internal types start being imported from multiple files.

## 7. Helper Placement Rules

To avoid replacing one giant file with several vague utility buckets, helper placement must be strict.

### 7.1 Belongs in `BackendRuntime`

- `RepoHandle`
- `CodebaseContext`
- `samePath`
- ambiguous repo resolution errors
- repo cache refresh
- repo resolution
- initialization and disconnect logic

### 7.2 Belongs in `tools/shared/*`

- `isTestFilePath`
- `VALID_NODE_LABELS`
- `VALID_RELATION_TYPES`
- `CYPHER_WRITE_RE`
- `isWriteQuery`
- `formatCypherAsMarkdown`
- `aggregateClusters`

### 7.3 Must Stay Handler-Local

Do not over-abstract tool-specific logic. These should stay near the owning handler:

- reciprocal-rank-fusion logic in `query`
- depth traversal and risk grouping in `impact`
- git diff scope handling in `detect_changes`
- file edit preview/apply flow in `rename`

## 8. Migration Order

This refactor should be delivered in small behavior-preserving steps.

### Step 1. Introduce seams without behavior change

Create:

- `BackendRuntime`
- `ToolContext`
- `ToolRegistry`

Keep current tool implementations in `LocalBackend` temporarily. The goal is only to establish stable interfaces.

### Step 2. Migrate read-only handlers first

Move:

- `query`
- `cypher`
- `overview`
- `context`

These are the safest first slice because they are read-heavy and have limited side effects.

### Step 3. Migrate analysis handlers

Move:

- `impact`
- `detect_changes`

These are still read-only from the repo index perspective, but more structurally complex.

### Step 4. Migrate `rename` last

`rename` should move last because it combines:

- symbol lookup via `context`
- file reads and writes
- path safety assertions
- ripgrep fallback behavior
- dry-run and apply modes

### Step 5. Shrink `LocalBackend`

After all handlers are in place, remove migrated logic from `LocalBackend` and leave only facade responsibilities.

## 9. Verification Strategy

Every migration step must pass focused verification before continuing.

### Baseline seam checks

Run at minimum:

- `npx vitest run test/unit/calltool-dispatch.test.ts`
- `npx vitest run test/unit/server.test.ts`
- `npx vitest run test/unit/tools.test.ts`

### After read-only handlers move

Run:

- `npx vitest run test/unit/calltool-dispatch.test.ts`
- `npx vitest run test/integration/local-backend-calltool.test.ts`

### After `impact` / `detect_changes`

Run the above plus targeted tests covering those commands.

### After `rename`

Must verify:

- dry-run output shape is unchanged
- apply mode still writes expected files
- path traversal protection still blocks invalid paths
- Windows path behavior is not weakened

### Final phase check

Run the local-backend focused unit and integration suites again before merge.

## 10. Success Criteria

This phase is successful when:

- `local-backend.ts` is reduced from 1713 lines to roughly facade-sized code
- `LocalBackend` no longer contains full implementations for the major tools
- each tool handler lives in its own bounded file
- runtime state and tool behavior are separated by explicit interfaces
- external callers do not need to change
- existing MCP-local tests continue to pass

## 11. Risks and Controls

### Risk: shared helpers become a second hotspot

Control:
keep shared helpers narrowly named and grouped by responsibility, not by convenience.

### Risk: `ToolContext` grows into a hidden god object

Control:
allow only execution, runtime access, logging, and tiny shared helpers. Tool-specific logic stays in handlers.

### Risk: `rename` migration breaks safety guarantees

Control:
move `rename` last and preserve its current validation and dry-run behavior exactly before any later cleanup.

### Risk: runtime concerns leak back into handlers

Control:
make `BackendRuntime` the only place that owns repo caches and initialization state.

## 12. Follow-On Work

If this phase succeeds, the next refactor can evaluate a runtime-focused second pass:

- further isolate repo/runtime lifecycle from `LocalBackend`
- consider whether clusters/processes resource methods should move beside other resource-oriented handlers
- use the new seams to continue shrinking MCP hotspot complexity without touching public APIs

## 13. Recommendation

Proceed with the handler-first refactor in one feature branch, but land it in incremental commits that follow the migration order above.

The key discipline is:

- preserve the facade
- migrate behavior by tool family
- validate at each slice
- stop after structural cleanup, before broader redesign
