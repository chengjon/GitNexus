# GitNexus Architecture Deepening Review

> Framework: Matt Pocock's module-depth analysis (deep modules = small interface, large implementation; shallow = interface ≈ implementation)
>
> Date: 2026-05-28
> Scope: `gitnexus/src/` (162 TS files, 30,214 LOC)
> Baseline: 1648 passing / 3 failing unit tests

## Project Summary

GitNexus is a local code-intelligence tool that indexes a repository into a KuzuDB knowledge graph (via tree-sitter AST parsing, community detection, and optional embeddings), then exposes 7 MCP tools (query, context, impact, detect_changes, rename, cypher, overview) for AI agents to navigate code safely.

The architecture has five main layers:

```
CLI (Commander) → Core Pipeline (ingestion, embeddings, search) → KuzuDB (graph storage) → MCP Server (tools/resources) → AI Agent
```

## Key Terms (from the deepening framework)

| Term | Definition |
|------|-----------|
| **Module** | Anything with an interface and an implementation (function, class, package, file) |
| **Depth** | Leverage at the interface — lots of behavior behind a small interface. Deep = high leverage |
| **Shallow** | Interface nearly as complex as the implementation — callers learn almost as much as the module hides |
| **Seam** | Where an interface lives; a place behavior can be altered without editing in place |
| **Adapter** | A concrete thing satisfying an interface at a seam |
| **Locality** | Change, bugs, and knowledge concentrated in one place (what maintainers get) |
| **Leverage** | What callers get from depth — doing more with less knowledge |
| **Deletion test** | If deleting the module makes complexity vanish, it was pass-through; if complexity reappears across N callers, it was earning its keep |

---

## Candidate 1: Parse Worker Monolith — Language Strategy Missing Seam

**Files:**
- `core/ingestion/workers/parse-worker.ts` (571 lines)
- `core/ingestion/tree-sitter-queries.ts` (all language queries in one file)
- `core/ingestion/call-form.ts`, `core/ingestion/type-env.ts`, `core/ingestion/utils.ts`

**Problem:**

The parse worker is the deepest single module in the system — it handles AST traversal for 15+ languages, call-form inference, receiver type resolution, heritage extraction, route detection, and framework annotation detection. All in one 571-line file with no language-level seams.

Adding a new language or fixing a language-specific extraction bug requires understanding the entire monolith. The `LANGUAGE_QUERIES` map provides a data seam (different tree-sitter queries per language), but the *logic* that interprets query results — especially call-form inference, member-call resolution, and heritage chains — is shared code with language-specific `if`/`switch` branches scattered throughout.

The interface of this module is effectively the entire extraction result shape (`ParsedNode[]`, `ParsedRelationship[]`, etc.), which is broad but necessary. The problem is that the implementation has no internal seams — changing Go call extraction requires understanding how PHP heritage works, because they share the same function scope.

**Deletion test:** If you delete parse-worker.ts, the entire indexing pipeline stops. Complexity does NOT vanish — it would need to be reimplemented for every language. The module is earning its keep, but it lacks internal locality.

**Solution:**

Introduce a **LanguageStrategy** seam — an interface that encapsulates per-language extraction logic:

```typescript
interface LanguageStrategy {
  language: SupportedLanguages;
  extractCalls(node: SyntaxNode, filePath: string): ParsedCall[];
  extractHeritage(node: SyntaxNode, filePath: string): ParsedHeritage[];
  extractRouteDefinitions?(node: SyntaxNode, filePath: string): ExtractedRoute[];
  resolveReceiverType?(call: ParsedCall, typeEnv: TypeEnv): string | null;
}
```

The parse worker would dispatch to the appropriate strategy based on file language, keeping the shared orchestration (chunking, batching, message protocol) but moving language-specific logic into separate files (`strategies/typescript.ts`, `strategies/go.ts`, etc.).

**Benefits:**
- **Locality:** A Go extraction bug lives entirely in `strategies/go.ts`. No need to read PHP code to fix it.
- **Leverage:** The parse worker's interface stays the same (sub-batch in, results out). Callers see no change.
- **Testability:** Each language strategy can be unit-tested in isolation with a single AST fixture, without spinning up the worker pool.
- **Extensibility:** Adding Kotlin/Swift/Ruby means adding one file that implements `LanguageStrategy`, not editing a 571-line monolith.

---

## Candidate 2: KuzuDB Global Singleton — Implicit Shared State

**Files:**
- `core/kuzu/kuzu-adapter.ts` (591 lines)
- All 7 MCP tool handlers in `mcp/local/tools/handlers/`
- `cli/analyze.ts`, `runtime/native-runtime-manager.ts`

**Problem:**

The KuzuDB adapter uses module-level globals (`db`, `conn`, `currentDbPath`, `sessionLock`) with a manual promise-chain lock. Every consumer calls `executeQuery(cypher)` or `executeParameterized(...)`, which implicitly depends on the correct global DB being active.

For the single-repo CLI, this works. For the multi-repo MCP server, the `RouterBackend` works around it by spawning separate worker processes — each worker gets its own globals. But the `LocalBackend` (used for eval server and single-repo mode) still uses the shared globals directly.

The seam is invisible. There is no `KuzuSession` or `KuzuConnection` object that a caller holds — instead, the caller trusts that the invisible global state is correct. This makes it impossible to reason about which DB a query targets without tracing the entire call chain back to the last `withKuzuDb()` call.

**Deletion test:** If you delete kuzu-adapter.ts, the entire system breaks — it is the sole data access layer. The module is deep and earns its keep. But its interface leaks implementation details (global state, session locks) to callers.

**Solution:**

Introduce a **KuzuSession** class that encapsulates a single DB connection:

```typescript
class KuzuSession {
  private db: kuzu.Database;
  private conn: kuzu.Connection;

  constructor(dbPath: string) { /* init DB, run schema, load FTS */ }

  async query(cypher: string): Promise<QueryResult> { ... }
  async parameterizedQuery(cypher: string, params: Record<string, any>): Promise<QueryResult> { ... }
  async loadGraph(graph: KnowledgeGraph, progress?: KuzuProgressCallback): Promise<void> { ... }
  async close(): Promise<void> { ... }
}
```

Each `RepoHandle` would hold its own `KuzuSession`. The session lock disappears because each session is independent. Multi-repo support becomes holding multiple sessions rather than switching a global.

The adapter module stays as a factory (`createKuzuSession(dbPath)`) but no longer owns global state.

**Benefits:**
- **Locality:** DB lifecycle bugs live in `KuzuSession`. No more tracking global state across 10 files.
- **Leverage:** Callers receive a session object with a clean interface. They don't need to know about session locks or DB switching.
- **Testability:** Tests create an in-memory session, run queries against it, and close it. No global state to reset between tests.
- **Multi-repo safety:** Each repo gets its own session. No more process-per-repo workaround needed for LocalBackend.

---

## Candidate 3: Tool Handlers → Raw Cypher Coupling

**Files:**
- `mcp/local/tools/handlers/query-handler.ts` (~340 lines)
- `mcp/local/tools/handlers/impact-handler.ts`
- `mcp/local/tools/handlers/context-handler.ts`
- `mcp/local/tools/handlers/detect-changes-handler.ts`
- `mcp/local/tools/handlers/rename-handler.ts`
- `mcp/local/tools/handlers/cypher-handler.ts`
- `core/kuzu/schema.ts`

**Problem:**

Every tool handler directly constructs Cypher query strings and passes them to `executeQuery()`. The schema defined in `schema.ts` is implicitly coupled to all these query strings — there is no query builder, no repository layer, and no central place that knows "these are the valid queries against this schema."

Consequences:
1. A schema change (e.g., renaming `CodeRelation` or adding a node type) requires grep-and-pray across all handler files.
2. Query logic is intermixed with presentation logic (formatting results for MCP responses).
3. The `context` handler, `impact` handler, and `query` handler all construct slightly different versions of the same "find symbol by name" query — duplicated knowledge.

The interface of each handler is `(ctx: ToolContext, params) => Promise<McpResponse>`, which is good. But the implementation has no seam between "what to query" and "how to present the result."

**Deletion test:** If you delete the handlers, MCP tools stop working — they earn their keep. But the query knowledge they contain would need to be reconstructed from scratch, scattered across the MCP layer rather than concentrated in a data access layer.

**Solution:**

Introduce a **GraphRepository** that encapsulates all Cypher query construction:

```typescript
class GraphRepository {
  constructor(private session: KuzuSession) {}

  findSymbolByName(name: string, opts?: { filePath?: string; limit?: number }): Promise<GraphNode[]>
  findSymbolCallers(symbolId: string, maxDepth: number): Promise<ImpactResult>
  findSymbolContext(symbolId: string): Promise<ContextResult>
  findChangedSymbols(diffHunks: DiffHunk[]): Promise<ChangedSymbolResult>
  // ... one method per query pattern
}
```

Handlers become thin: parse params → call repository method → format result. The repository concentrates all Cypher knowledge in one place.

**Benefits:**
- **Locality:** A schema change requires updating `schema.ts` + `GraphRepository`. Not 7 handler files.
- **Leverage:** Handlers become thin adapters. Adding a new MCP tool means calling existing repository methods.
- **Testability:** The repository can be tested against a real KuzuDB with known graph fixtures, independent of MCP protocol concerns.
- **Deduplication:** The "find symbol by name" pattern exists once, not three times.

---

## Candidate 4: Pipeline Orchestration Without Encapsulated State

**Files:**
- `core/ingestion/pipeline.ts` (441 lines)
- `core/ingestion/import-processor.ts`, `call-processor.ts`, `heritage-processor.ts`
- `core/ingestion/community-processor.ts`, `process-processor.ts`

**Problem:**

The pipeline function touches 6+ mutable data structures (`graph`, `symbolTable`, `astCache`, `importMap`, `packageMap`, `workerPool`) and passes subsets of them to each phase. There is no object that encapsulates "the state of an in-progress indexing run."

Each phase function has a different signature — some take `(graph, files)`, some take `(graph, symbolTable, astCache)`, some take `(graph, importMap, packageMap)`. The calling convention is ad-hoc, requiring readers to understand which phase needs which pieces of state.

The pipeline also mixes orchestration concerns (what order phases run, how errors propagate) with data-flow concerns (how data moves between phases).

**Deletion test:** If you delete pipeline.ts, the indexing system stops. The module earns its keep. But the state management would need to be reconstructed for each phase.

**Solution:**

Introduce a **PipelineContext** that holds all mutable state for an indexing run:

```typescript
class PipelineContext {
  readonly graph: KnowledgeGraph;
  readonly symbolTable: Map<string, SymbolEntry>;
  readonly astCache: Map<string, ASTCacheEntry>;
  readonly importMap: Map<string, ImportEntry[]>;
  readonly packageMap: Map<string, string>;

  // Derived accessors that phases need
  get nodesByFile(filePath: string): GraphNode[] { ... }
  get importsForFile(filePath: string): ImportEntry[] { ... }
}
```

Phase functions become `(ctx: PipelineContext) => Promise<void>` — uniform signatures. The pipeline itself becomes a list of phases executed in order, with the context flowing through.

**Benefits:**
- **Locality:** Pipeline state management lives in `PipelineContext`. Adding a new state variable means editing one class, not 10 function signatures.
- **Leverage:** Phase functions receive a single object with everything they need. Callers don't need to know which subset of state to pass.
- **Testability:** Tests create a `PipelineContext` with known state, run one phase, and inspect the result. No need to wire up the entire pipeline.
- **Readability:** The pipeline function becomes a phase list, not a 441-line orchestration script.

---

## Candidate 5: Node ID Convention — Implicit Protocol

**Files:**
- `lib/utils.ts` (1 line: `generateId`)
- Every file that creates or consumes node IDs (40+ files)
- `core/kuzu/schema.ts` (ID format determines table lookups)

**Problem:**

The node ID format `Label:filePath:name` is a convention used everywhere — KuzuDB queries, tool handlers, embedding lookups, parse worker output, rename operations, and impact analysis. But there is no central parser, validator, or type for these IDs.

Consumers extract the label with `nodeId.split(':')[0]` or `nodeId.indexOf(':')`. The filePath can contain colons (e.g., Windows paths `C:\Users\...`), making naive splitting incorrect. The `generateId` function doesn't validate that the label is a valid `NodeLabel` or that the name doesn't contain unexpected characters.

This is an **implicit protocol** — a contract with no enforcement. Any code that constructs or parses IDs independently is coupled to the convention by convention, not by type.

**Deletion test:** If you delete `generateId`, every consumer would need to invent its own format — but they'd all choose differently. The convention is load-bearing despite being one line.

**Solution:**

Introduce a **NodeId** value type with parsing and formatting:

```typescript
class NodeId {
  readonly label: NodeLabel;
  readonly filePath: string;
  readonly name: string;
  readonly raw: string;

  static parse(raw: string): NodeId { /* safe parsing, handles colons in paths */ }
  static create(label: NodeLabel, filePath: string, name: string): NodeId { ... }

  isContainer(): boolean { return this.label === 'File' || this.label === 'Folder'; }
  isDefinition(): boolean { return DEFINITION_LABELS.has(this.label); }
}
```

Replace all `string` node IDs with `NodeId` at the seams (graph construction, KuzuDB load, MCP handlers). Internal hot paths can still use the raw string for performance.

**Benefits:**
- **Locality:** ID parsing logic lives in one place. Windows path bugs get fixed once.
- **Leverage:** Callers get type-safe ID handling. `nodeId.label` is a `NodeLabel`, not a `string`.
- **Safety:** Invalid IDs are caught at construction time, not 10 levels deep in a Cypher query.

---

## Candidate 6: LocalBackend Dual Query Paths

**Files:**
- `mcp/local/local-backend.ts` (311 lines)
- `mcp/local/tools/tool-registry.ts` (~30 lines)
- `mcp/resources.ts` (resource handlers)

**Problem:**

`LocalBackend` has two query paths:
1. **Tool path:** `callTool()` → `toolRegistry.dispatch()` → handler function → KuzuDB
2. **Direct path:** `queryClusters()`, `queryProcesses()`, `queryClusterDetail()`, `queryProcessDetail()` — methods that bypass the registry and query KuzuDB directly

The direct methods exist because the MCP resource system (`ListResources`, `ReadResource`) needs cluster/process data but doesn't go through the tool system. This means cluster/process query logic is duplicated: once in the tool handlers and once in `LocalBackend`.

`RouterBackend` has the same duplication — it delegates tools to workers but implements resource methods locally.

**Deletion test:** If you delete the direct methods, MCP resources stop working. If you delete the tool handlers, MCP tools stop working. Both paths earn their keep, but the knowledge is duplicated.

**Solution:**

Route resource queries through the same data access layer (the `GraphRepository` from Candidate 3). Resources become thin adapters that call repository methods and format the result differently:

```typescript
// Resource handler
async listClusters(repoId: string) {
  const repo = await this.resolveRepo(repoId);
  const clusters = await repo.graphRepo.listClusters();
  return formatClusterList(clusters);
}
```

`LocalBackend` no longer has direct query methods. The `backend-contract.ts` interface shrinks.

**Benefits:**
- **Locality:** Cluster/process query logic exists once (in GraphRepository), not twice.
- **Leverage:** Both tools and resources use the same data access layer. Adding a new resource is a formatting concern, not a query concern.
- **Interface simplicity:** `McpBackendLike` shrinks from 8 methods to ~4.

---

## Candidate 7: Analyze CLI Command — God Function

**Files:**
- `cli/analyze.ts` (544 lines)
- `cli/analyze-session.ts`, `analyze-embeddings.ts`, `analyze-kuzu.ts`, `analyze-finalization.ts`, `analyze-summary.ts`

**Problem:**

The `analyze` command manages: heap re-execution, MCP process quiescing, reindex locking, progress bar lifecycle, interrupt handling, embedding orchestration, KuzuDB finalization, and summary generation. The helper modules exist but the main file still orchestrates all of them in one function.

The interface is "run analyze on a repo with options" — which is appropriate. The problem is that the implementation has no internal phase boundaries. The heap re-execution logic, for instance, is a self-modifying control flow (the process re-execs itself with different memory limits) that's interleaved with the normal flow.

**Deletion test:** If you delete analyze.ts, `gitnexus analyze` stops working. The module earns its keep.

**Solution:**

Model the analyze lifecycle as explicit phases with a `PhaseRunner`:

```typescript
type AnalyzePhase = {
  name: string;
  run(ctx: AnalyzeContext): Promise<void>;
  rollback?(ctx: AnalyzeContext): Promise<void>;
};

const ANALYZE_PHASES: AnalyzePhase[] = [
  { name: 'heap-setup', run: setupHeap },
  { name: 'quiesce', run: quiesceMcpProcesses },
  { name: 'lock', run: acquireReindexLock },
  { name: 'extract', run: runExtraction },
  { name: 'parse', run: runParsing },
  { name: 'mro', run: computeMRO },
  { name: 'communities', run: detectCommunities },
  { name: 'processes', run: detectProcesses },
  { name: 'kuzu', run: loadIntoKuzu },
  { name: 'embeddings', run: generateEmbeddings },
  { name: 'finalize', run: finalizeIndex },
  { name: 'summary', run: printSummary },
];
```

The main function becomes: parse args → create context → run phases (with interrupt handling and rollback). Each phase is a focused function with a clear contract.

**Benefits:**
- **Locality:** Adding a new phase (e.g., "generate wiki after indexing") is one object in the array, not editing a 544-line function.
- **Leverage:** The phase runner handles interrupt/rollback generically. Each phase only knows its own work.
- **Testability:** Each phase can be tested in isolation with a mock `AnalyzeContext`.
- **Readability:** The analyze flow is visible as a flat list of phases, not nested in control flow.

---

## Candidate 8: `strict: false` — Type Safety Gap

**Files:**
- `gitnexus/tsconfig.json`

**Problem:**

The project has 162 TS source files, 30K+ LOC, 146 test files, and an elaborate governance framework (DEVELOPMENT_RULES.md, AGENTS.md, PR templates with scope/metric/validation fields). But `tsconfig.json` has `"strict": false`.

This means:
- No `strictNullChecks` — `null`/`undefined` are silently assignable to any type
- No `strictFunctionTypes` — function parameter bivariance
- No `noImplicitAny` — untyped parameters default to `any`
- No `strictPropertyInitialization` — class properties can be declared but never assigned

For a project that enforces "single source of truth" and "reachability must be verified through the feature tree" at the governance level, the type system is not being used to its full capability. The `null`/`undefined` gap alone accounts for a class of runtime bugs that the type checker should catch.

**Solution:**

Enable strict mode incrementally:
1. Add `"strict": true` to tsconfig
2. Fix the resulting type errors (likely 200-500 across the codebase)
3. Most fixes will be adding null checks and explicit type annotations — mechanical work that improves safety

This is not a "deepening" refactor in the module sense, but it is the highest-leverage safety improvement available. It creates a **seam** between "code the type checker has verified" and "code that relies on runtime assumptions."

**Benefits:**
- **Leverage:** The type checker catches null/undefined bugs at compile time, not runtime. Every future change gets this safety net automatically.
- **Locality:** Type errors are reported at the exact line where the unsafe access occurs, not at the customer-visible failure point.
- **Governance alignment:** The governance rigor in DEVELOPMENT_RULES is enforced by humans during PR review. Strict mode enforces some of it automatically.

---

## Candidate 9: Worker Pool Protocol — Ad-Hoc IPC Contract

**Files:**
- `core/ingestion/workers/worker-pool.ts` (~200 lines)
- `core/ingestion/workers/parse-worker.ts` (571 lines)

**Problem:**

The worker pool communicates with parse workers via an ad-hoc `postMessage` protocol with message types `sub-batch`, `flush`, `result`, and `error`. The protocol is defined implicitly — the pool sends certain message shapes and the worker expects certain message shapes, but there is no shared type definition or protocol module.

Changes to the protocol (e.g., adding a `cancel` message, changing the sub-batch format) require coordinated edits to both files with no compile-time verification that they agree.

**Solution:**

Extract a **WorkerProtocol** module with shared type definitions:

```typescript
// worker-protocol.ts
interface SubBatchMessage { type: 'sub-batch'; batchId: number; files: FileEntry[]; }
interface FlushMessage { type: 'flush'; batchId: number; }
interface ResultMessage { type: 'result'; batchId: number; nodes: ParsedNode[]; relationships: ParsedRelationship[]; }
type PoolToWorker = SubBatchMessage | FlushMessage;
type WorkerToPool = ResultMessage | ErrorMessage;
```

Both `worker-pool.ts` and `parse-worker.ts` import from this shared module. Protocol changes are type-checked.

**Benefits:**
- **Locality:** Protocol definition lives in one file. Changes are verified by the compiler.
- **Leverage:** Adding a new message type is one type addition, not a coordinated two-file edit.
- **Safety:** Mismatched message handling is caught at compile time.

---

## Candidate 10: CodeRelation Schema — Brittle Manual Enumerations

**Files:**
- `core/kuzu/schema.ts` (200+ FROM/TO pairs)

**Problem:**

The `CodeRelation` relationship table definition enumerates every valid source-target node type pair. With 27 node tables, this produces hundreds of FROM/TO pairs that must be manually maintained. Adding a new node type requires adding ~20 new pairs.

The schema is deep — it correctly uses a single relationship table with a `type` property string, which simplifies Cypher queries for LLMs. But the FROM/TO enumeration is a maintenance burden that could be derived from a declarative definition.

**Solution:**

Replace manual enumeration with a **schema generator** that derives the FROM/TO pairs from a declarative map:

```typescript
const VALID_RELATIONSHIPS: Record<RelationshipType, [NodeLabel[], NodeLabel[]]> = {
  CALLS: [['Function', 'Method', 'Class'], ['Function', 'Method', 'Class']],
  IMPORTS: [['Function', 'Method', 'Class', 'File'], ['Function', 'Method', 'Class', 'File', 'Module']],
  // ...
};

// Generator produces the CREATE REL TABLE statement
function generateSchemaQueries(): string[] { ... }
```

**Benefits:**
- **Locality:** Adding a node type means editing the map, not copy-pasting 20 FROM/TO pairs.
- **Leverage:** The map is also useful for query validation in tool handlers and the rename tool.
- **Safety:** Impossible to forget a valid pair — the generator covers all combinations.

---

## Priority Matrix

| # | Candidate | Impact | Effort | Recommended Priority |
|---|-----------|--------|--------|---------------------|
| 8 | `strict: false` | Safety | Medium (mechanical) | **P0** — enables all other improvements |
| 5 | Node ID convention | Safety + Locality | Low | **P1** — small, high-leverage |
| 3 | Tool handlers → raw Cypher | Locality + Leverage | Medium | **P1** — enables Candidate 6 |
| 2 | KuzuDB global singleton | Locality + Safety | High | **P2** — highest impact but requires care |
| 1 | Parse worker language strategies | Locality + Extensibility | Medium | **P2** — payback grows with language count |
| 4 | Pipeline context encapsulation | Readability + Testability | Medium | **P2** — improves all phase development |
| 9 | Worker pool typed protocol | Safety | Low | **P3** — small win, good first PR |
| 6 | LocalBackend dual query paths | Locality | Low (after #3) | **P3** — depends on Candidate 3 |
| 7 | Analyze command phase runner | Readability | Medium | **P3** — readability improvement |
| 10 | Schema generator | Maintainability | Low | **P3** — nice to have |

---

## Metrics Summary

| Metric | Value |
|--------|-------|
| Source files | 162 `.ts` files |
| Source lines | 30,214 |
| Test files | 146 `.test.ts` files |
| Test pass rate | 1648 / 1651 (99.8%) |
| Top-5 largest files | parse-worker (571), kuzu-adapter (591), pipeline (441), analyze (544), local-backend (311) |
| tsconfig strict | `false` |
| Test coverage threshold | ~26-28% |
| Language support | 11 builtin + 2 optional (Kotlin, Swift) |
| KuzuDB node tables | 27 |
| MCP tools | 7 |
| MCP resources | 6 |

---

## Appendix: Not Candidates

The following were considered but rejected as not worth deepening:

| Module | Why not a candidate |
|--------|-------------------|
| `lib/utils.ts` (`generateId`) | Covered by Candidate 5 — the function is trivial but the *convention* it represents is load-bearing |
| `mcp/tools/tool-registry.ts` | Intentionally shallow — a dispatch map. The depth is in the handlers |
| `mcp/router-backend.ts` | Intentionally thin delegation. The multi-process architecture is the right seam |
| `core/graph/graph.ts` | Simple Map wrapper, ~80 lines. Appropriate depth for its role |
| `types/pipeline.ts` | Type definitions + serialize/deserialize. Appropriate depth |
| `core/embeddings/runtime-config.ts` | Config resolution, intentionally thin |

---

*This analysis was generated using the Matt Pocock module-depth framework. The vocabulary (module, interface, depth, seam, adapter, leverage, locality, deletion test) follows the skill's LANGUAGE.md definitions. All candidates were validated against the actual codebase — no theoretical refactors.*
