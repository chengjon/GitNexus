# Local Source Capability Audit Before Upstream Main Cutover

Date: 2026-05-28

## Verdict

Do not replace `origin/main` with `upstream-sync` if the required outcome is
"all local source upgrades continue to be effective."

The current `upstream-sync` branch is a good first-pass upstream architecture
baseline with local governance replayed, but it is not a full source-capability
replay. It preserves the governance layer and intentionally keeps upstream
source architecture authoritative.

## Evidence Baseline

Refs used for this audit:

- merge base: `3dbe08fab6a340018e85d5377651e31e0773ca58`
- local `main`: `2a22063c37462df3fc8a6551c9395ffa8f2d4837`
- current `origin/main`: `b18af7575f857490e073b24ca8943f007b47022a`
- `upstream/main`: `50715e3894567d435153b059b123513b766ee87e`
- proposed `upstream-sync`: `de10e0a64c06126d17cc5447485d42c148c8dd9a`

From merge base to local `main`, the local branch changed 1108 files. For those
local changed files, `upstream-sync` currently has:

| Status in `upstream-sync` | Files | Meaning |
|---|---:|---|
| Same content as local `main` | 837 | Preserved, mostly governance/docs/OpenSpec/skill records |
| Same content as `upstream/main` | 87 | Local version is replaced by upstream |
| Absent from `upstream-sync` | 184 | Local file is not present in the proposed replacement branch |
| Mixed/manual merge differing from both sides | 0 | No complex source-level three-way replay was attempted |

For source-ish local changes only, the audit found 240 files:

| Status in `upstream-sync` | Source-ish files |
|---|---:|
| Upstream wins | 67 |
| Absent | 173 |
| Kept local | 0 |

This means none of the local source capability set is preserved as-is in the
proposed replacement baseline. Each capability must be classified before cutover.

## Decision Vocabulary

- `Absorb`: upstream already provides the capability or a better replacement.
  Do not replay local files.
- `Reimplement`: capability remains valuable, but must be ported onto upstream's
  LadybugDB/scope-resolution architecture.
- `Retire`: capability was tied to obsolete local architecture and should not be
  revived.
- `Verify`: upstream probably covers this area, but a focused behavior check is
  needed before deciding.
- `Remap tests`: test intent is valuable, but old tests cannot be copied until
  the target capability has an upstream-shaped implementation.

## Capability Decisions

| # | Capability | Local source status | Decision | Cutover impact |
|---:|---|---|---|---|
| 1 | Core regression test coverage | 82 files: 61 absent, 21 upstream wins | Remap tests | Blocks "all local upgrades effective"; tests must be mapped to retained capabilities |
| 2 | Language support and framework parsing | 18 files: 16 absent, 2 upstream wins | Verify then reimplement gaps | Blocks if Vue SFC, Laravel/PHP metadata, Swift/Kotlin reporting, or language availability matrix is required |
| 3 | Wiki generator | 17 files: 16 absent, 1 upstream wins | Reimplement selectively | Blocks if local full/incremental/module-tree wiki generation is required |
| 4 | MCP local backend/tools | 17 files: 14 absent, 3 upstream wins | Reimplement on upstream local-backend/LadybugDB | Blocks; current MCP path has already shown Kuzu/Ladybug index mismatch risk |
| 5 | Web build/runtime asset handling | 13 files: 11 absent, 2 upstream wins | Verified absorbed/retired; no replay now | Does not block: current web build/tests pass; remaining chunk warnings are optimization debt, not missing behavior |
| 6 | Host integration and context refresh | 12 files: 12 absent | Reimplement selectively | Blocks if Codex/Claude/Cursor host setup, freshness, and local context refresh behavior must survive |
| 7 | Embedding runtime/configuration | 7 files: 5 absent, 2 upstream wins | Verify then reimplement config gaps | Blocks if local Ollama/config override behavior is required beyond upstream embedding support |
| 8 | Test/config harness | 7 files: 6 absent, 1 upstream wins | Remap tests/config only after target capability decisions | Does not block by itself; supports other blockers |
| 9 | Core ingestion/resolution pipeline | 7 files: 4 absent, 3 upstream wins | Absorb upstream; reimplement only proven gaps | Direct replay is unsafe because upstream replaced this architecture |
| 10 | Kuzu storage/index adapter | 6 files: 6 absent | Retire | Should not block; upstream has LadybugDB replacement |
| 11 | CLI command/runtime surface | 5 files: 2 absent, 3 upstream wins | Verify then reimplement narrow missing behavior | Blocks only for missing local CLI behavior still required |
| 12 | Dependency/package surface | 4 files: 4 upstream wins | Absorb upstream | Does not block; do not restore old package locks |
| 13 | Web ingestion/selection behavior | 4 files: 4 absent | Verify product need; reimplement if still required | Blocks only if local web import/selection behavior is required |
| 14 | Detect-changes/worktree path handling | 3 files: 3 absent | Reimplement first | Blocks; governance requires reliable worktree-aware staged scope gates |
| 15 | Web UI panels/agent graph UX | 2 files: 2 upstream wins | Verify visual/UX gaps | Does not block unless local UI behavior is required |
| 16 | CI/governance automation | 2 files: 2 absent | Reimplement or replace with root governance workflow | Blocks local release discipline only if these checks are expected in CI |
| 17 | Core graph/index/search pipeline | 2 files: 2 upstream wins | Absorb upstream | Does not block; upstream owns this layer |
| 18 | Hook/plugin runtime | 1 file: 1 upstream wins plus local ENOENT override fix in `upstream-sync` | Absorb upstream plus keep minimal fix | Does not block after current tests pass |
| 19 | Miscellaneous local source surface | 31 files: 11 absent, 20 upstream wins | Split into the rows above before replay | Treat as no blanket replay |

## Detailed Capability Notes

### 1. Core Regression Test Coverage

Representative local files:

- `gitnexus/test/helpers/native-runtime-fixture.ts`
- `gitnexus/test/integration/local-backend.test.ts`
- `gitnexus/test/integration/mcp-worker-isolation.test.ts`
- `gitnexus/test/unit/analyze-embeddings.test.ts`
- `gitnexus/test/unit/wiki-run-pipeline.test.ts`

Decision: `Remap tests`.

The old tests are useful evidence of desired local behavior, but copying them
directly would be misleading. Many refer to local Kuzu, old MCP handler, old wiki
generator, and old host-integration surfaces that are no longer present in
upstream. Port tests only after the target capability is either absorbed or
reimplemented on upstream.

### 2. Language Support and Framework Parsing

Representative local files:

- `gitnexus/src/core/ingestion/vue-sfc.ts`
- `gitnexus/src/core/ingestion/routes/laravel-route-extraction.ts`
- `gitnexus/src/core/ingestion/php/php-metadata.ts`
- `gitnexus/src/core/tree-sitter/language-registry.ts`
- `gitnexus/scripts/ci/language-support-report.mjs`

Decision: `Verify then reimplement gaps`.

Upstream has a much broader ingestion tree and language-specific extractors under
`gitnexus/src/core/ingestion/**`, so direct local replay is not appropriate. The
right next step is to run focused fixtures for local-only language behaviors
against upstream: Vue SFC, Laravel routes, PHP metadata, optional Swift/Kotlin
availability, and language support report output.

Follow-up result: `Absorb upstream for covered surfaces`.

The `upstream-sync` branch now verifies this capability through focused upstream
fixtures rather than local file replay. The verification covered Vue SFC
extraction, Laravel route extraction, PHP namespace extraction, framework
detection, tree-sitter language availability, and Vue/PHP/Kotlin/Swift resolver
behavior. No language/parser files were replayed. Any future language gap should
start as a failing fixture against the current upstream-shaped ingestion
architecture.

### 3. Wiki Generator

Representative local files:

- `gitnexus/src/core/wiki/full-generation.ts`
- `gitnexus/src/core/wiki/incremental-update.ts`
- `gitnexus/src/core/wiki/module-tree/builder.ts`
- `gitnexus/src/core/wiki/pages/overview-page.ts`
- `gitnexus/test/unit/wiki-module-tree.test.ts`

Decision: `Reimplement selectively`.

Upstream still has wiki support under `gitnexus/src/core/wiki/**`, but the local
full-generation, incremental update, module-tree, and page-generation pipeline is
not present. If those are still product requirements, port them into upstream's
current wiki client/query model instead of restoring the old file tree.

Follow-up result: `Absorb upstream for current wiki command behavior`.

The `upstream-sync` branch has a current upstream wiki implementation centered on
`gitnexus/src/core/wiki/generator.ts`, `graph-queries.ts`, provider clients,
HTML rendering, review mode, incremental update, and grouping snapshots. The old
local module-tree/page-generation/run-pipeline files should not be replayed
directly. Existing upstream-shaped tests verify the current command flags,
grouping batching, LLM client, and Mermaid sanitizer behavior, and built CLI help
exposes `--provider`, `--review`, `--model`, `--gist`, and `--api-key`. Treat
future wiki gaps as product requests against the current generator API, not as a
blanket restoration of the old local wiki module tree.

### 4. MCP Local Backend and Tools

Representative local files:

- `gitnexus/src/mcp/backend-contract.ts`
- `gitnexus/src/mcp/local/runtime/backend-runtime.ts`
- `gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts`
- `gitnexus/src/mcp/local/tools/handlers/impact-handler.ts`
- `gitnexus/src/mcp/local/tools/shared/query-safety.ts`

Decision: `Reimplement on upstream local-backend/LadybugDB`.

Upstream now has `gitnexus/src/mcp/local/local-backend.ts` and
`gitnexus/src/mcp/core/lbug-adapter.ts`. The local split handler/runtime design
is absent. Direct replay would fight upstream's backend shape. The capability
should be decomposed into behavior contracts and applied to the upstream local
backend.

This is a cutover blocker because the final staged `gitnexus_detect_changes`
MCP call failed after upstream analysis migrated the worktree index to LadybugDB
while the installed MCP still looked for `.gitnexus/kuzu`. The upstream CLI gate
worked, but the MCP-host path still needs a dedicated compatibility check.

### 5. Web Build and Runtime Asset Handling

Representative local files:

- `gitnexus-web/scripts/vite-chunking.mjs`
- `gitnexus-web/scripts/vite-static-copy.mjs`
- `gitnexus-web/src/lib/mermaid-loader.ts`
- `gitnexus-web/src/lib/syntax-highlighter.ts`
- `gitnexus-web/src/shims/empty-browser-module.js`

Decision: `Verified absorbed/retired; no replay now`.

The local `main` web asset work introduced Vite helper files for manual chunking
and static copy, a lazy Mermaid loader, a Prism-light syntax highlighter helper,
and an empty browser shim. `upstream-sync` no longer carries those exact helper
files, but it has upgraded the web package around Vite 8, Mermaid 11.15, and the
current Markdown/Mermaid components.

Verification on 2026-05-29:

- `npm run build` under `gitnexus-web` exited 0.
- `npm test -- --reporter=dot` under `gitnexus-web` exited 0 with 22 test files
  and 282 tests passing.

The build still reports large chunk warnings and an ineffective dynamic import
warning for `ProcessFlowModal`, so the old manual chunking work is not fully
equivalent as a performance optimization. It is not a cutover blocker because
the current web package builds and its unit suite passes without the retired
helper files. Revisit this only if deployment size/performance becomes a
release gate or a browser smoke test proves a runtime regression.

### 6. Host Integration and Context Refresh

Representative local files:

- `gitnexus/src/cli/host-adapters/claude-code.ts`
- `gitnexus/src/cli/host-adapters/codex.ts`
- `gitnexus/src/cli/host-adapters/cursor.ts`
- `gitnexus/src/cli/index-freshness.ts`
- `gitnexus/src/cli/refresh-context.ts`

Decision: `Reimplement selectively`.

The local branch had explicit multi-host setup and context refresh surfaces that
are absent from the proposed replacement branch. Upstream has `setup.ts`,
`status.ts`, MCP server, and hook assets, but not the same host-adapter split.
If Codex/Claude/Cursor parity is required, define behavior tests first, then
port only the missing behavior.

### 7. Embedding Runtime and Configuration

Representative local files:

- `gitnexus/src/cli/analyze-embeddings.ts`
- `gitnexus/src/cli/embedding-insights.ts`
- `gitnexus/src/cli/embedding-overrides.ts`
- `gitnexus/src/core/embeddings/ollama-client.ts`
- `gitnexus/src/core/embeddings/runtime-config.ts`

Decision: `Verify then reimplement config gaps`.

Upstream has a broader embeddings directory with `config.ts`, `http-client.ts`,
`hf-env.ts`, `server-mapping.ts`, and related modules. Local Ollama/config
override behavior should not be copied by file. Verify the required operator
configuration contract and port only missing controls.

Follow-up result: `Reimplemented narrow config command gap`.

The current upstream embedding stack already covers local/HTTP embedding,
chunking, HF env handling, and semantic model tests, but it was missing the
operator-facing `gitnexus config embeddings show|set|clear` surface still
documented in the local fork. The replay restores that narrow CLI surface on top
of upstream's current embedding config shape: saved settings live under
`~/.gitnexus/config.json`, environment variables still take precedence, Ollama
settings activate the OpenAI-compatible HTTP embedding path, and saved
`nodeLimit` feeds bare `analyze --embeddings`.

### 8. Test and Config Harness

Representative local files:

- `gitnexus/test/global-setup.ts`
- `gitnexus/test/setup.ts`
- `gitnexus/vitest.integration.config.ts`
- `gitnexus/vitest.integration.native.config.ts`

Decision: `Remap tests/config`.

The upstream unit suite passed with local environment controls
`HOME=/tmp/gitnexus-lbdb-home` and `TMPDIR=/var/tmp`. Keep the current upstream
test harness until a specific local regression test needs an upstream-shaped
port.

### 9. Core Ingestion and Resolution Pipeline

Representative local files:

- `gitnexus/src/core/ingestion/call-form.ts`
- `gitnexus/src/core/ingestion/framework-path-detection.ts`
- `gitnexus/src/core/ingestion/resolvers/utils.ts`
- `gitnexus/src/core/ingestion/utils.ts`

Decision: `Absorb upstream; reimplement only proven gaps`.

Upstream has a much larger scope-based ingestion and language extractor surface.
Direct replay of local pipeline helpers is high risk and should not precede
behavior-level proof that upstream lacks a specific local capability.

### 10. Kuzu Storage and Index Adapter

Representative local files:

- `gitnexus/src/cli/analyze-kuzu.ts`
- `gitnexus/src/core/kuzu/kuzu-adapter.ts`
- `gitnexus/src/core/kuzu/load-graph.ts`
- `gitnexus/src/mcp/core/kuzu-adapter.ts`

Decision: `Retire`.

Upstream moved to LadybugDB with `gitnexus/src/core/lbug/**` and
`gitnexus/src/mcp/core/lbug-adapter.ts`. Kuzu-specific source files should not
be carried forward. Any still-needed behavior must be described as LadybugDB
behavior and reimplemented there.

### 11. CLI Command and Runtime Surface

Representative local files:

- `gitnexus/src/cli/ai-context.ts`
- `gitnexus/src/cli/analyze-session.ts`
- `gitnexus/src/cli/analyze-summary.ts`
- `gitnexus/src/cli/setup.ts`
- `gitnexus/src/cli/doctor.ts`

Decision: `Verify then reimplement narrow missing behavior`.

Upstream owns the CLI command surface. Some local CLI helpers are absent, and
some were replaced by upstream versions. Verify specific user-visible commands
and messages before any port.

### 12. Dependency and Package Surface

Representative local files:

- `gitnexus/package.json`
- `gitnexus/package-lock.json`
- `gitnexus-web/package.json`
- `gitnexus-web/package-lock.json`

Decision: `Absorb upstream`.

The upstream dependency graph built and tested. Restoring old local package
locks would undercut the upstream integration.

### 13. Web Ingestion and Selection Behavior

Representative local files:

- `gitnexus-web/src/core/ingestion/import-processor.ts`
- `gitnexus-web/src/workers/ingestion.worker.ts`
- `gitnexus-web/test/unit/GraphCanvas.selection-sync.test.tsx`
- `gitnexus-web/test/unit/useSigma.behavior.test.tsx`

Decision: `Verify product need; reimplement if still required`.

The files are absent in `upstream-sync`. Treat these as product behavior
requests, not automatic replay material.

### 14. Detect-Changes and Worktree Path Handling

Representative local files:

- `gitnexus/src/cli/platform-process-scan.ts`
- `gitnexus/src/lib/path-comparison.ts`
- `gitnexus/test/unit/detect-changes-path-comparison.test.ts`

Decision: `Reimplement first`.

This is a blocker for governed development because `detect_changes` is the
pre-commit scope gate in local rules. The final integration needed an upstream
CLI fallback because the MCP tool expected Kuzu after LadybugDB analysis. A
dedicated upstream-shaped fix should come before main cutover if local source
capability continuity is mandatory.

### 15. Web UI Panels and Agent Graph UX

Representative local files:

- `gitnexus-web/src/components/CodeReferencesPanel.tsx`
- `gitnexus-web/src/core/llm/agent.ts`

Decision: `Verify visual/UX gaps`.

Upstream versions win in the current branch. Do not replay local UI code unless
browser-level review identifies a missing user-facing behavior.

### 16. CI and Governance Automation

Representative local files:

- `gitnexus/scripts/ci/repository-governance-check.mjs`
- `gitnexus/test/unit/repository-governance-check.test.ts`

Decision: `Reimplement or replace with root governance workflow`.

The root `pr-governance.yml` governance workflow is preserved. Package-local CI
governance scripts are absent and should be reintroduced only if the root
workflow does not enforce the same rule.

### 17. Core Graph, Index, and Search Pipeline

Representative local files:

- `gitnexus/src/storage/git.ts`
- `gitnexus/src/storage/repo-manager.ts`

Decision: `Absorb upstream`.

Upstream wins and the analysis smoke passed. Do not replay local versions unless
a focused regression proves a missing behavior.

### 18. Hook and Plugin Runtime

Representative local file:

- `gitnexus-claude-plugin/hooks/gitnexus-hook.js`

Decision: `Absorb upstream plus keep the minimal ENOENT override fix`.

The current `upstream-sync` branch already includes the minimal helper fix in
`hook-db-lock-probe.cjs`. Hook unit tests passed.

## Recommended Execution Order

1. Block `origin/main` cutover until source continuity requirements are reduced
   to explicit capability acceptance criteria.
2. Start with `Detect-changes/worktree path handling`, because local governance
   depends on it and current MCP/CLI behavior diverges after LadybugDB analysis.
3. Audit `MCP local backend/tools` against upstream `local-backend.ts` and
   `lbug-adapter.ts`; port behavior, not files.
4. Verify `Host integration and context refresh` behavior for Codex, Claude
   Code, Cursor, and generic stdio.
5. Run focused fixtures for language/framework parsing before porting local Vue,
   Laravel, PHP, Swift/Kotlin reporting behavior.
6. Decide whether full/incremental/module-tree wiki generation is still a
   product requirement. If yes, reimplement on upstream wiki query/client
   surfaces.
7. Re-map tests only after their target capability has a current upstream-shaped
   implementation.

## Cutover Decision

With the user's stated goal that local source upgrades continue to be fully
effective, the current `upstream-sync` branch is not ready to replace
`origin/main`.

The branch remains useful as a staging baseline and review artifact. The next
work should be capability-by-capability replay, not force-push cutover.
