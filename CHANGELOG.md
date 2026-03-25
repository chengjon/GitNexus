# Changelog

All notable changes to GitNexus will be documented in this file.

## [Unreleased]

### Added

- `detect_changes` now accepts an explicit `cwd` parameter for git operations, making worktree-aware usage possible from MCP/CLI hosts whose `process.cwd()` does not reflect the user’s active worktree.
- `detect_changes` responses now include richer metadata such as the git repo path, actual git diff path, process cwd, path-resolution mode, and structured fallback reasons.
- New git identity helpers in `src/storage/git.ts` for resolving git top-level and git common-dir identity.
- Embeddings configuration can now be stored in `~/.gitnexus/config.json` under an `embeddings` block instead of requiring shell env vars for every run.
- New `gitnexus config embeddings` CLI commands:
  - `gitnexus config embeddings show`
  - `gitnexus config embeddings set`
  - `gitnexus config embeddings clear`
- Ollama embeddings support for both indexing and MCP query embeddings, with verified local workflow using `qwen3-embedding:0.6b`.
- Embedding progress reporting now includes embeddable node count, batch count, throughput, provider, and model.
- New runtime/dispatch seams for the local MCP backend:
  - `src/mcp/local/runtime/backend-runtime.ts`
  - `src/mcp/local/tools/tool-context.ts`
  - `src/mcp/local/tools/tool-registry.ts`
- New handler modules for:
  - `query`
  - `cypher`
  - `context`
  - `overview`
  - `impact`
  - `detect_changes`
  - `rename`
- New shared local-MCP helper modules for query safety, cypher formatting, and cluster aggregation.
- New targeted regression coverage for LocalBackend dispatch, handler extraction, cypher formatting boundaries, detect_changes worktree behavior, and rename preview/apply parity.

### Changed

- `src/mcp/local/local-backend.ts` was refactored from a large monolithic implementation into a thin facade over runtime, registry, handlers, and shared helper modules.
- `detect_changes` now resolves git diff execution paths more explicitly and surfaces worktree ambiguity as metadata/warnings rather than silent behavior.
- `detect_changes` symbol matching was tightened from broad substring-style path matching toward exact-path-first matching with a safer fallback path.
- Local rename behavior is now more explicit and safer:
  - dry-run/apply semantics are aligned
  - graph-covered files collect all matching lines needed for complete application
  - broad same-file matches are downgraded from optimistic `graph` confidence to lower-confidence classifications
  - skipped text-search coverage is surfaced additively to callers
- Cypher tool behavior is stricter and safer:
  - invalid/blank queries now return structured errors
  - markdown formatting escapes table-breaking characters
  - unexpected row shapes fall back more safely instead of throwing through the tool boundary
- Query semantic-search probing now uses a non-aggregating embedding existence check instead of a `COUNT(*)` scan.
- `query.process_symbols` is now explicitly documented and tested as unique-by-symbol-id in the current contract.
- Embedding gating now uses embeddable node count instead of total graph node count.
- `analyze --force --embeddings` now prints a follow-up hint recommending incremental refreshes without `--force` when embeddings already exist.
- README, CLI skills, and generated AI context now document incremental embedding refreshes, local Ollama GPU setup guidance, and a `batchSize=64` starting point for local GPU workflows.

### Fixed

- Native runtime lifecycle handling and test infrastructure were stabilized through centralized runtime policy and split Vitest configurations.
- `gitnexus analyze` now automatically stops local `gitnexus mcp` processes that are holding the target repo’s `.gitnexus/kuzu` file open, reducing Kuzu lock conflicts in multi-session usage.
- MCP lifecycle handling was improved to reduce orphaned local MCP processes on client disconnect.
- `impact` now coerces and sanitizes `minConfidence` before Cypher interpolation, and preserves real `0` confidence values instead of rewriting them through truthy fallback behavior.
- Rename path traversal violations are now surfaced as user-visible errors instead of log-only continuation.
- Repo IDs for same-name repositories are now assigned deterministically, avoiding refresh-order instability in long-lived multi-repo MCP sessions.

## [1.4.0] - 2026-03-13

### Added

- **Language-aware symbol resolution engine** with 3-tier resolver: exact FQN → scope-walk → guarded fuzzy fallback that refuses ambiguous matches (#238) — @magyargergo
- **Method Resolution Order (MRO)** with 5 language-specific strategies: C++ leftmost-base, C#/Java class-over-interface, Python C3 linearization, Rust qualified syntax, default BFS (#238) — @magyargergo
- **Constructor & struct literal resolution** across all languages — `new Foo()`, `User{...}`, C# primary constructors, target-typed new (#238) — @magyargergo
- **Receiver-constrained resolution** using per-file TypeEnv — disambiguates `user.save()` vs `repo.save()` via `ownerId` matching (#238) — @magyargergo
- **Heritage & ownership edges** — HAS_METHOD, OVERRIDES, Go struct embedding, Swift extension heritage, method signatures (`parameterCount`, `returnType`) (#238) — @magyargergo
- **Language-specific resolver directory** (`resolvers/`) — extracted JVM, Go, C#, PHP, Rust resolvers from monolithic import-processor (#238) — @magyargergo
- **Type extractor directory** (`type-extractors/`) — per-language type binding extraction with `Record<SupportedLanguages, Handler>` + `satisfies` dispatch (#238) — @magyargergo
- **Export detection dispatch table** — compile-time exhaustive `Record` + `satisfies` pattern replacing switch/if chains (#238) — @magyargergo
- **Language config module** (`language-config.ts`) — centralized tsconfig, go.mod, composer.json, .csproj, Swift package config loaders (#238) — @magyargergo
- **Optional skill generation** via `npx gitnexus analyze --skills` — generates AI agent skills from KuzuDB knowledge graph (#171) — @zander-raycraft
- **First-class C# support** — sibling-based modifier scanning, record/delegate/property/field/event declaration types (#163, #170, #178 via #237) — @Alice523, @benny-yamagata, @jnMetaCode
- **C/C++ support fixes** — `.h` → C++ mapping, static-linkage export detection, qualified/parenthesized declarators, 48 entry point patterns (#163, #227 via #237) — @Alice523, @bitgineer
- **Rust support fixes** — sibling-based `visibility_modifier` scanning for `pub` detection (#227 via #237) — @bitgineer
- **Adaptive tree-sitter buffer sizing** — `Math.min(Math.max(contentLength * 2, 512KB), 32MB)` (#216 via #237) — @JasonOA888
- **Call expression matching** in tree-sitter queries (#234 via #237) — @ex-nihilo-jg
- **DeepSeek model configurations** (#217) — @JasonOA888
- 282+ new unit tests, 178 integration resolver tests across 9 languages, 53 test files, 1146 total tests passing

### Fixed

- Skip unavailable native Swift parsers in sequential ingestion (#188) — @Gujiassh
- Heritage heuristic language-gated — no longer applies class/interface rules to wrong languages (#238) — @magyargergo
- C# `base_list` distinguishes EXTENDS vs IMPLEMENTS via symbol table + `I[A-Z]` heuristic (#238) — @magyargergo
- Go `qualified_type` (`models.User`) correctly unwrapped in TypeEnv (#238) — @magyargergo
- Global tier no longer blocks resolution when kind/arity filtering can narrow to 1 candidate (#238) — @magyargergo

### Changed

- `import-processor.ts` reduced from 1412 → 711 lines (50% reduction) via resolver and config extraction (#238) — @magyargergo
- `type-env.ts` reduced from 635 → ~125 lines via type-extractor extraction (#238) — @magyargergo
- CI/CD workflows hardened with security fixes and fork PR support (#222, #225) — @magyargergo

## [1.3.11] - 2026-03-08

### Security

- Fix FTS Cypher injection by escaping backslashes in search queries (#209) — @magyargergo

### Added

- Auto-reindex hook that runs `gitnexus analyze` after commits and merges, with automatic embeddings preservation (#205) — @L1nusB
- 968 integration tests (up from ~840) covering unhappy paths across search, enrichment, CLI, pipeline, worker pool, and KuzuDB (#209) — @magyargergo
- Coverage auto-ratcheting so thresholds bump automatically on CI (#209) — @magyargergo
- Rich CI PR report with coverage bars, test counts, and threshold tracking (#209) — @magyargergo
- Modular CI workflow architecture with separate unit-test, integration-test, and orchestrator jobs (#209) — @magyargergo

### Fixed

- KuzuDB native addon crashes on Linux/macOS by running integration tests in isolated vitest processes with `--pool=forks` (#209) — @magyargergo
- Worker pool `MODULE_NOT_FOUND` crash when script path is invalid (#209) — @magyargergo

### Changed

- Added macOS to the cross-platform CI test matrix (#208) — @magyargergo

## [1.3.10] - 2026-03-07

### Security

- **MCP transport buffer cap**: Added 10 MB `MAX_BUFFER_SIZE` limit to prevent out-of-memory attacks via oversized `Content-Length` headers or unbounded newline-delimited input
- **Content-Length validation**: Reject `Content-Length` values exceeding the buffer cap before allocating memory
- **Stack overflow prevention**: Replaced recursive `readNewlineMessage` with iterative loop to prevent stack overflow from consecutive empty lines
- **Ambiguous prefix hardening**: Tightened `looksLikeContentLength` to require 14+ bytes before matching, preventing false framing detection on short input
- **Closed transport guard**: `send()` now rejects with a clear error when called after `close()`, with proper write-error propagation

### Added

- **Dual-framing MCP transport** (`CompatibleStdioServerTransport`): Auto-detects Content-Length (Codex/OpenCode) and newline-delimited JSON (Cursor/Claude Code) framing on the first message, responds in the same format (#207)
- **Lazy CLI module loading**: All CLI subcommands now use `createLazyAction()` to defer heavy imports (tree-sitter, ONNX, KuzuDB) until invocation, significantly improving `gitnexus mcp` startup time (#207)
- **Type-safe lazy actions**: `createLazyAction` uses constrained generics to validate export names against module types at compile time
- **Regression test suite**: 13 unit tests covering transport framing, security hardening, buffer limits, and lazy action loading

### Fixed

- **CALLS edge sourceId alignment**: `findEnclosingFunctionId` now generates IDs with `:startLine` suffix matching node creation format, fixing process detector finding 0 entry points (#194)
- **LRU cache zero maxSize crash**: Guard `createASTCache` against `maxSize=0` when repos have no parseable files (#144)

### Changed

- Transport constructor accepts `NodeJS.ReadableStream` / `NodeJS.WritableStream` (widened from concrete `ReadStream`/`WriteStream`)
- `processReadBuffer` simplified to break on first error instead of stale-buffer retry loop

## [1.3.9] - 2026-03-06

### Fixed

- Aligned CALLS edge sourceId with node ID format in parse worker (#194)

## [1.3.8] - 2026-03-05

### Fixed

- Force-exit after analyze to prevent KuzuDB native cleanup hang (#192)
