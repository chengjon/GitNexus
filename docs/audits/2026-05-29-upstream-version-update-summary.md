# 2026-05-29 Upstream Version Update Summary

Last reviewed: 2026-05-29

## Purpose

This document summarizes the major functional and architectural changes absorbed
when the local GitNexus fork was refreshed from upstream on 2026-05-29.

It is written for local operators who maintain `/opt/claude/GitNexus` as a
source checkout and use that checkout as the shared GitNexus CLI/MCP runtime for
multiple external projects.

## Scope And Evidence

Review scope:

- Previous local backup baseline: `b18af757`
  (`backup/main-before-upstream-sync-20260529-092439-b18af757`)
- Current reviewed head: `699350e`
- Commit volume in the reviewed range: 826 commits total, 771 non-merge commits
- Integration merge: `e5ef91f9 Merge remote-tracking branch 'upstream/main' into upstream-sync`
- Local post-integration fixes:
  - `1800782b fix: rebuild missing Ladybug graph store`
  - `bba73167 fix: align native abort guidance with local source workflow`
  - `a87c0b83 docs: clarify external project recovery boundaries`
  - `699350ed docs: explain MCP transport reconnect boundary`

Primary evidence used:

- `git log` over `b18af757..HEAD`
- `README.md` current product surface
- `openspec/specs/upstream-main-integration/spec.md`
- `docs/ai-cli-local-quick-start.md`
- current `gitnexus/src` module layout
- current local validation: `gitnexus analyze --index-only` and `gitnexus status`

Current local validation result:

```text
Repository: /opt/claude/GitNexus
Indexed commit: 699350e
Current commit: 699350e
Status: up-to-date
```

## Executive Summary

The update is not a small patch-level refresh. It changes the operating model
in four important ways:

1. GitNexus is now centered on a LadybugDB-backed graph store at
   `.gitnexus/lbug`; the old `.gitnexus/kuzu` path is retired migration state.
2. MCP is now a multi-repository service backed by a global registry under
   `~/.gitnexus/registry.json`, with lazy LadybugDB connections per indexed
   repository.
3. The indexer has moved further toward an incremental, worker-driven,
   scope-resolution architecture with richer language support and more
   framework-aware call/route extraction.
4. The product surface has expanded beyond single-repo symbol lookup into
   API-route impact, response-shape checking, repository groups, cross-repo
   contracts, richer web visualization, and local wiki/search workflows.

For this local fork, the most operationally important effect is that external
projects must be recovered and checked against `.gitnexus/lbug`, not
`.gitnexus/kuzu`. A project with `.gitnexus/meta.json` but no `.gitnexus/lbug`
must be rebuilt, even if the metadata commit appears current.

## New Or Expanded User-Facing Capabilities

### 1. Multi-Repo MCP Runtime

The current README describes GitNexus as a CLI + MCP runtime where one MCP
server can serve multiple indexed repositories. Each `gitnexus analyze` stores
the repository-local graph under `.gitnexus/` and registers the repository in
`~/.gitnexus/registry.json`.

Key user-facing changes:

- one global MCP server can serve many indexed repos
- `repo` is optional only when a single repo is indexed
- multiple host integrations are supported, including Claude Code, Codex,
  Cursor, Windsurf, OpenCode, and Antigravity
- MCP connections open LadybugDB lazily and use a connection pool instead of a
  per-project MCP configuration

Operational implication:

- restarting or reconnecting the MCP host is required after rebuilding the local
  source checkout
- manually launching a detached `gitnexus mcp` process does not reconnect an
  already-closed stdio tool channel in an active agent session

### 2. Larger MCP Tool Surface

The MCP surface has expanded from basic search/context into higher-level
analysis tools.

The current server includes tools for:

- repository discovery: `list_repos`
- process-grouped search: `query`
- symbol context: `context`
- impact/blast-radius analysis: `impact`
- diff-aware scope checking: `detect_changes`
- coordinated renames: `rename`
- graph queries: `cypher`
- API route mapping: `route_map`
- response-shape validation: `shape_check`
- API route pre-change impact: `api_impact`
- MCP/RPC tool implementation mapping: `tool_map`
- group and contract workflows: `group_list`, `group_sync`, and related group
  resources/commands

Important additions:

- `impact` now supports summary and pagination-oriented usage, including
  per-symbol process participation fields.
- `detect_changes` has better cwd/worktree handling, which matters for linked
  worktrees and multi-repo MCP sessions.
- API route tooling uses graph edges such as `HANDLES_ROUTE` and `FETCHES`, plus
  route response keys, to detect consumers and shape mismatches.

### 3. Repository Groups And Cross-Repo Contracts

The updated architecture includes repository groups for multi-repo and
monorepo-service analysis.

User-facing commands include:

```bash
gitnexus group create <name>
gitnexus group add <group> <groupPath> <registryName>
gitnexus group remove <group> <groupPath>
gitnexus group list [name]
gitnexus group sync <name>
gitnexus group contracts <name>
gitnexus group query <name> <q>
gitnexus group status <name>
```

New capabilities include:

- extracting HTTP contracts from indexed graphs
- matching provider/consumer contracts across repos
- applying manifest links
- surfacing stale index or stale contract-registry state
- querying execution flows across group members

Architecture implication:

- cross-repo impact is no longer just a conceptual workflow; it has a contract
  registry and group bridge modules under `gitnexus/src/core/group/`

### 4. API Route And Shape Awareness

The ingestion pipeline now includes route extraction and API consumer mapping.

New graph concepts include:

- `Route` nodes
- `HANDLES_ROUTE` edges
- `FETCHES` edges
- route `responseKeys` and `errorKeys`
- middleware metadata

This powers:

- API route maps
- API consumer maps
- response-shape mismatch checks
- pre-change route impact reports

Recent upstream commits specifically improved:

- FastAPI `include_router(prefix=...)` cross-file route resolution
- indirect FastAPI `Depends()` and frontend HTTP consumer tracing
- Java/Kotlin Spring route extraction and consumer extraction
- Java Spring named annotation argument handling

### 5. Broader Language And Framework Support

The updated indexer has substantially deeper language coverage and static
resolution behavior.

Notable language changes in the reviewed range:

- Java migrated to scope-based registry resolution with parity coverage.
- Rust migrated to scope-based resolution.
- Ruby migrated to scope-based resolution.
- COBOL migrated to scope-based resolution through a regex provider.
- Kotlin moved through multiple resolver fixes and became a migrated language.
- C++ gained multiple ADL, conversion-rank, dependent-base, namespace, and
  overload-resolution improvements.
- TypeScript gained resolver suffix-index reuse and additional call-pattern
  tracing.
- PHP gained safer handling for namespace-less files and Blade templates.

Optional grammar behavior is now more explicit:

- Dart, Proto, Swift, Kotlin, and other optional native grammars may be
  unavailable depending on install/runtime conditions.
- `gitnexus doctor --json` should be used to inspect actual host language
  support instead of assuming all grammars are enabled.

### 6. Web UI Improvements

The web viewer is now more than a basic graph display.

Notable additions and fixes include:

- Tree View and Circles View in the web viewer
- improved node-selection edge emphasis in the Sigma graph view
- CodeReferencesPanel and agent-output handling aligned with upstream
  implementations
- explicit stop behavior for the Nexus AI agent
- backend URL configuration via `GITNEXUS_BACKEND_URL` for Docker/deployment
  scenarios
- GitLab repository URL support
- dependency and Vercel install hardening

Architecture implication:

- web UI behavior is covered by current upstream implementations and targeted
  tests; the old local browser-ingestion-worker path should not be replayed
  automatically

### 7. Wiki, Search, And Embedding Improvements

The update expands the wiki and search/embedding surface.

Notable changes:

- local Claude and Codex providers for wiki generation
- Azure OpenAI support for wiki command
- multilingual wiki generation via `--lang`
- wiki timeout and retry flags
- budget-aware grouping to avoid context overflow on large repositories
- AST-aware and structural embedding chunking
- platform-aware semantic fallback
- configurable embeddings via `gitnexus config embeddings ...`
- Hugging Face endpoint guidance and retry/circuit-breaker improvements
- optional embedding limits for `--embeddings`

Local fork impact:

- embedding settings can be persisted under `~/.gitnexus/config.json`
- environment variables continue to take precedence over persisted config
- local Ollama/OpenAI-compatible embedding paths are the preferred local runtime
  mechanism for this machine

### 8. Doctor, Setup, And Host Diagnostics

The updated CLI has a broader diagnostics surface.

Important changes:

- `gitnexus doctor --json` reports structured checks for runtime,
  native-runtime, language support, capabilities, embeddings, repo state, and
  host configuration
- local host selectors can be used to inspect MCP setup assumptions
- setup has stronger handling for Windows shims and additional MCP hosts
- Antigravity setup and hook adapter support were added upstream
- `refresh-context` and embedding config commands were restored in this local
  integration after upstream absorption

For this local source checkout:

- do not switch operators to `npm install -g gitnexus@latest` as the default
  fix path
- update by merging upstream into `/opt/claude/GitNexus`, rebuilding
  `/opt/claude/GitNexus/gitnexus`, and restarting MCP/CLI clients

## Architecture Adjustments

### 1. Storage: Kuzu Retired, LadybugDB Current

The largest architecture shift is storage.

Old mental model:

```text
.gitnexus/kuzu
Kuzu-specific adapters and path assumptions
```

Current mental model:

```text
.gitnexus/lbug
LadybugDB native for CLI/MCP
LadybugDB WASM for browser-side Web UI
```

Consequences:

- missing `.gitnexus/kuzu` is normal
- missing `.gitnexus/lbug` is the failure condition
- `.gitnexus/meta.json` alone is not enough to prove a usable graph exists
- recovery must rebuild the graph store when `meta.json` exists but `lbug` does
  not
- Kuzu-specific local source files should not be replayed into the current fork
  unless behavior is reimplemented against LadybugDB

Local fix added after the upstream refresh:

- `gitnexus analyze` now forces a rebuild when current metadata exists but the
  LadybugDB graph store is missing or invalid

### 2. Global Registry And Lazy Connection Pool

GitNexus now uses a registry-backed multi-repo MCP design.

Flow:

```text
gitnexus analyze
  -> writes .gitnexus/lbug inside target repo
  -> registers target repo in ~/.gitnexus/registry.json

gitnexus mcp
  -> reads registry
  -> lazily opens LadybugDB connections per repo
  -> serves multiple indexed repositories through one MCP server
```

The README documents a connection pool with lazy opens and idle eviction. This
replaces the older habit of thinking in terms of one project-specific MCP server
per repository.

### 3. Incremental And Worker-Driven Indexing

The indexer now has stronger incremental behavior:

- parse cache
- incremental DB writeback
- scope-resolution short-circuiting
- worker pool with configurable worker count
- worker idle timeout
- worker sub-batch splitting
- quarantine-like handling for files that stall native parser paths
- native abort detection with actionable recovery guidance
- per-language progress reporting

Operationally important flags:

```bash
gitnexus analyze --index-only
gitnexus analyze --force --index-only --drop-embeddings --workers 0
gitnexus analyze --workers 2 --worker-timeout 20 --max-file-size 256
```

The bounded-worker path is useful for repositories with generated JavaScript,
bundled documentation, or demo assets that can stall parser workers.

### 4. Scope-Based Resolution As The Main Ingestion Direction

The upstream update continues a large migration toward scope-based resolution.

Core modules now emphasize:

- language providers
- scope extractors
- binding accumulation
- call routing
- type environments
- method resolution order processing
- inheritance/implementation edges
- access tracking
- route extraction
- framework-aware call inference

This is why language-specific commits are not isolated feature work; they are
part of a broader resolver architecture that makes `impact`, `detect_changes`,
and route/API tooling more reliable.

### 5. Graph Schema Expansion

The graph model has expanded beyond files/functions/classes.

Important node or edge concepts now include:

- `Route`
- `Tool`
- `Process`
- `Community`
- `HANDLES_ROUTE`
- `FETCHES`
- `HANDLES_TOOL`
- `ENTRY_POINT_OF`
- `ACCESSES`
- `METHOD_OVERRIDES`
- `METHOD_IMPLEMENTS`

This enables higher-level tools such as route impact, tool mapping, process
tracing, and field access analysis.

### 6. Group Bridge And Contract Registry

Cross-repo behavior is now modeled through group configuration and a contract
registry.

Architecture modules include:

- `gitnexus/src/core/group/config-parser.ts`
- `gitnexus/src/core/group/contract-extractor.ts`
- `gitnexus/src/core/group/cross-impact.ts`
- `gitnexus/src/core/group/matching.ts`
- `gitnexus/src/core/group/service.ts`
- `gitnexus/src/core/group/sync.ts`
- `gitnexus/src/core/group/bridge-db.ts`
- `gitnexus/src/core/group/storage.ts`

This supports exact contract matching, manifest links, provider/consumer roles,
cross-links, and group-level status.

### 7. Local Source Capability Replay Is Selective

The integration intentionally did not replay old local files wholesale.

The OpenSpec rule is:

- if upstream already covers the capability through a replacement architecture,
  treat the capability as absorbed
- if old local code depends on retired Kuzu paths, do not replay it directly
- reintroduce missing behavior only through focused fixtures and current
  upstream-shaped modules

This matters because the update is both a product upgrade and an architecture
cutover. Local patches must now be revalidated against the current LadybugDB,
worker, MCP, and scope-resolution architecture instead of copied forward.

## Local Operational Changes

### Current Success Criteria For External Projects

Use this classification:

```bash
test -f .gitnexus/meta.json && echo "meta: yes" || echo "meta: no"
test -e .gitnexus/lbug && echo "lbug: yes" || echo "lbug: no"
test -e .gitnexus/kuzu && echo "old kuzu: yes" || echo "old kuzu: no"
```

Interpretation:

- `old kuzu: no` is normal
- `meta: yes` and `lbug: yes` means the current graph store exists
- `meta: yes` and `lbug: no` means rebuild
- `old kuzu: yes` and `lbug: no` means the project has not been rebuilt into
  the current LadybugDB store

### Default External Project Recovery

```bash
gitnexus analyze --force --index-only --drop-embeddings --workers 0
gitnexus status
```

If parser/native worker behavior is the issue, use:

```bash
gitnexus analyze --force --index-only --drop-embeddings \
  --workers 2 \
  --worker-timeout 20 \
  --max-file-size 256
```

Do not use `--repair-fts` when `.gitnexus/lbug` is missing. FTS repair requires
an existing graph store.

### External Project Boundary

When operating on external projects, the recovery boundary is narrow:

- allowed recovery work: `gitnexus analyze`, `gitnexus status`, process checks
- not allowed without explicit approval: editing `.gitnexusignore`, `.gitignore`,
  `AGENTS.md`, host context files, or project docs
- not allowed without explicit approval: `commit`, `amend`, `fetch`, `push`, or
  any other target-project git state mutation

This boundary was added after the recovery work exposed generated/bundled asset
parser stalls in an external project.

### MCP Reconnect Boundary

If a live agent session reports `Transport closed` for GitNexus MCP tools:

1. Verify local CLI health:

   ```bash
   gitnexus status
   # or
   node /opt/claude/GitNexus/gitnexus/dist/cli/index.js status
   ```

2. Restart or reconnect the MCP host/client.

Starting a new detached `gitnexus mcp` process in a shell does not attach it to
an already-closed stdio tool channel.

## Compatibility And Risk Notes

### Embeddings

Embeddings remain optional. If a project previously had embeddings and the
operator wants to preserve them, use `--embeddings`. Running analyze without
embeddings can leave `stats.embeddings` at `0`.

Persisted embedding config now belongs under:

```text
~/.gitnexus/config.json
```

under the `embeddings` key. Environment variables still take precedence.

### Optional Grammars

Optional native grammars may be unavailable depending on install/runtime state.
Use:

```bash
gitnexus doctor --json
```

and inspect `language-support` instead of assuming Kotlin, Swift, Dart, Proto,
or other optional grammars are available.

### README vs Local Fork

The upstream README still contains npm-oriented setup snippets such as
`npm install -g gitnexus` or `npx -y gitnexus@latest`. For this local fork, the
operator workflow is different:

```bash
cd /opt/claude/GitNexus
git pull / merge upstream
cd gitnexus
npm run build
# restart MCP/CLI clients from the host
```

Do not switch shared local projects to the npm-published GitNexus unless that is
an intentional migration away from the local source workflow.

## Commit Themes In The Reviewed Range

Approximate commit distribution by observed theme:

| Theme | Representative changes |
| --- | --- |
| Indexing / ingestion / resolution | incremental indexing, scope resolution, call routing, worker timeouts, native abort handling |
| Language support | Rust, Ruby, Java, COBOL, Kotlin, C++, PHP, TypeScript improvements |
| Storage | LadybugDB/lbug, WAL and sidecar handling, read-only opens, missing store recovery |
| MCP / agent hosts | multi-repo MCP, impact pagination, detect_changes cwd/worktree metadata, Antigravity/Codex/Claude paths |
| Web UI | Tree View, Circles View, agent stop behavior, graph selection rendering, Docker/backend URL |
| Groups / contracts | group sync, contract registry, HTTP provider/consumer extraction, cross-repo matching |
| Wiki / embeddings / search | local providers, Azure OpenAI, multilingual wiki, timeout/retry flags, structural chunking |
| CLI / doctor / setup | structured diagnostics, host config checks, refresh-context, embedding config commands |
| CI / deps / security | dependency updates, deterministic installs, Docker/build fixes, server/API hardening |

## What To Watch Next

1. Keep `docs/ai-cli-local-quick-start.md` as the local operational truth for
   source-checkout deployment.
2. Treat `.gitnexus/lbug` as the current graph-store success criterion.
3. Require explicit approval before modifying external project files as part of
   index recovery.
4. Reconnect MCP from the host after rebuilding local source; do not expect
   shell-spawned MCP processes to repair an already-closed agent tool channel.
5. When adding back local behavior, write focused tests against the current
   LadybugDB/worker/scope-resolution architecture instead of replaying old
   Kuzu-era source files.
