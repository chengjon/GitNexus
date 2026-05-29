# Local Source Capability Audit Before Upstream Main Cutover

Date: 2026-05-28
Latest refresh: 2026-05-29

## Verdict

Do not replace `origin/main` with `upstream-sync` without an explicit final
cutover approval and `--force-with-lease` authorization.

The second-stage capability audit has reduced the original source-continuity
blocker: all 19 local source capability rows now have an explicit retained,
replayed, absorbed, retired, or deferred-product decision. The branch preserves
the governance layer, keeps upstream source architecture authoritative, and
replays only the local source capabilities that remained required on the current
upstream shape.

Final cutover remains intentionally blocked only at the explicit approval step:
`origin/main` has not been replaced, and `--force-with-lease` has not been run.

## Evidence Baseline

Refs used for this audit:

- merge base: `3dbe08fab6a340018e85d5377651e31e0773ca58`
- local `main`: `2a22063c37462df3fc8a6551c9395ffa8f2d4837`
- current `origin/main`: `b18af7575f857490e073b24ca8943f007b47022a`
- `upstream/main`: `50715e3894567d435153b059b123513b766ee87e`
- proposed `upstream-sync`: `de10e0a64c06126d17cc5447485d42c148c8dd9a`

Latest upstream refresh after the capability audit:

- refreshed `upstream/main`: `b565c7c9905d4465997346bc489106611f8fa979`
- refreshed `origin/upstream-sync`: `e5ef91f9bfb2d2e7814e6e77ab24a919c6fca228`
- refreshed `origin/main`: `b18af7575f857490e073b24ca8943f007b47022a`
- `upstream/main...origin/upstream-sync`: `0 18`, so the staging branch
  contains the latest fetched upstream main plus local integration commits
- `origin/main...origin/upstream-sync`: `209 818`, so the final operation is
  still a replacement-style cutover, not a normal merge

The latest upstream refresh added three upstream commits after the audit:
FastAPI cross-file `include_router(prefix=...)` route resolution, C++ ADL
function-type entities, and per-symbol `processes` fields on impact byDepth
items. The refresh was merged into `upstream-sync` as `e5ef91f9` and validated
with focused FastAPI, C++, impact, parse-cache, and MCP LocalBackend suites.

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
| 1 | Core regression test coverage | 82 files: 61 absent, 21 upstream wins | Mapped to retained capabilities; no blanket restore | No longer blocks: focused upstream-shaped regression suites now cover each retained/replayed capability |
| 2 | Language support and framework parsing | 18 files: 16 absent, 2 upstream wins | Verified absorbed for covered surfaces; no replay now | Does not block: Vue, Laravel/PHP, framework detection, tree-sitter availability, and Vue/PHP/Kotlin/Swift resolver behavior are covered by focused fixtures |
| 3 | Wiki generator | 17 files: 16 absent, 1 upstream wins | Verified current wiki behavior; no replay now | Does not block: current upstream wiki generator flags/client/grouping/Mermaid behavior are covered; future gaps are product requests |
| 4 | MCP local backend/tools | 17 files: 14 absent, 3 upstream wins | Verified upstream-shaped; narrow detect_changes gaps already replayed | No longer blocks: current LocalBackend/LadybugDB surface covers MCP routing, detect_changes, impact, query safety, and API impact with focused regression coverage |
| 5 | Web build/runtime asset handling | 13 files: 11 absent, 2 upstream wins | Verified absorbed/retired; no replay now | Does not block: current web build/tests pass; remaining chunk warnings are optimization debt, not missing behavior |
| 6 | Host integration and context refresh | 12 files: 12 absent | Reimplemented standalone `refresh-context`; host setup absorbed/deferred | No longer blocks: required context refresh CLI is restored; broader host-adapter parity needs future behavior tests |
| 7 | Embedding runtime/configuration | 7 files: 5 absent, 2 upstream wins | Reimplemented narrow config command gap | No longer blocks: persisted embedding config commands work on current upstream embedding stack |
| 8 | Test/config harness | 7 files: 6 absent, 1 upstream wins | Verified current harness; remapped tests only | Does not block: old harness files stay retired and focused upstream-shaped suites pass |
| 9 | Core ingestion/resolution pipeline | 7 files: 4 absent, 3 upstream wins | Verified absorbed; no replay now | Does not block: current scope-based ingestion/resolver surface covers the old helper behavior under focused tests |
| 10 | Kuzu storage/index adapter | 6 files: 6 absent | Verified retired under LadybugDB | Does not block: Kuzu files stay retired and current LadybugDB/storage tests pass |
| 11 | CLI command/runtime surface | 5 files: 2 absent, 3 upstream wins | Reimplemented narrow `doctor` diagnostics surface | No longer blocks for `doctor --json/--repo/--host`; continue verifying other CLI-only gaps separately |
| 12 | Dependency/package surface | 4 files: 4 upstream wins | Verified upstream package surface; no replay now | Does not block: keep upstream 1.6.5/package-lock surfaces and do not restore old local locks/scripts |
| 13 | Web ingestion/selection behavior | 4 files: 4 absent | Selection verified with regression coverage; browser ingestion retired | Does not block: old browser ingestion worker is superseded; current Sigma selection behavior is tested |
| 14 | Detect-changes/worktree path handling | 3 files: 3 absent | Reimplemented worktree path handling | No longer blocks: linked-worktree repo selection, `cwd` compatibility, and path-resolution metadata are covered |
| 15 | Web UI panels/agent graph UX | 2 files: 2 upstream wins | Verified absorbed/enhanced; no replay now | Does not block: current panel/agent surfaces have broader upstream code and targeted tests pass |
| 16 | CI/governance automation | 2 files: 2 absent | Reimplemented missing PR governance workflow dependency | No longer blocks: `pr-governance.yml` now has the script and unit coverage it invokes |
| 17 | Core graph/index/search pipeline | 2 files: 2 upstream wins | Verified absorbed/enhanced; no replay now | Does not block: upstream storage/repo-manager surface is broader and current repo-manager/LadybugDB tests pass |
| 18 | Hook/plugin runtime | 1 file: 1 upstream wins plus local ENOENT override fix in `upstream-sync` | Verified absorbed plus minimal fix | Does not block: standalone hook/plugin suites pass; combined burst run still has the known concurrent hook flake |
| 19 | Miscellaneous local source surface | 31 files: 11 absent, 20 upstream wins | Closed by row split; no blanket replay | Does not block: remaining files are governed by rows 1-18 |

## Detailed Capability Notes

### 1. Core Regression Test Coverage

Representative local files:

- `gitnexus/test/helpers/native-runtime-fixture.ts`
- `gitnexus/test/integration/local-backend.test.ts`
- `gitnexus/test/integration/mcp-worker-isolation.test.ts`
- `gitnexus/test/unit/analyze-embeddings.test.ts`
- `gitnexus/test/unit/wiki-run-pipeline.test.ts`

Decision: `Mapped to retained capabilities; no blanket restore`.

The old tests are useful evidence of desired local behavior, but copying them
directly would be misleading. Many refer to local Kuzu, old MCP handler, old wiki
generator, and old host-integration surfaces that are no longer present in
upstream. Port tests only after the target capability is either absorbed or
reimplemented on upstream.

Follow-up result: row 1 is now a regression-map meta row, not a source replay
row. Local tests were not copied wholesale; they were either replaced by
upstream-shaped focused suites or restored only when the invoked behavior still
exists in the integration branch.

Covered slices include language/framework parsing, wiki commands, embedding
runtime/config, web build/runtime, web selection, CI governance, MCP backend,
core ingestion/storage/graph, detect-changes/worktree handling, refresh-context,
doctor diagnostics, PR governance, and hook/plugin runtime. Remaining broad
full-suite noise is recorded as environment-sensitive or flaky where observed,
not as a reason to restore old local test harness files.

### 2. Language Support and Framework Parsing

Representative local files:

- `gitnexus/src/core/ingestion/vue-sfc.ts`
- `gitnexus/src/core/ingestion/routes/laravel-route-extraction.ts`
- `gitnexus/src/core/ingestion/php/php-metadata.ts`
- `gitnexus/src/core/tree-sitter/language-registry.ts`
- `gitnexus/scripts/ci/language-support-report.mjs`

Decision: `Verified absorbed for covered surfaces; no replay now`.

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

Decision: `Verified current wiki behavior; no replay now`.

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

Decision: `Verified upstream-shaped; narrow detect_changes gaps already replayed`.

Upstream now has `gitnexus/src/mcp/local/local-backend.ts` and
`gitnexus/src/mcp/core/lbug-adapter.ts`. The local split handler/runtime design
is absent. Direct replay would fight upstream's backend shape. The capability
should be decomposed into behavior contracts and applied to the upstream local
backend.

Follow-up result: the blocker has been reduced to upstream-shaped behavior and
focused regression coverage. Static comparison confirms the old local split
files are still absent, but their relevant surfaces now live in
`gitnexus/src/mcp/local/local-backend.ts` and `gitnexus/src/mcp/tools.ts`:
`LocalBackend`, `resolveWorktreeCwd`, query-safety constants,
`detect_changes`, `impact`, `cypher`, and `api_impact`.

The previously proven real gap was not the old file layout; it was the
MCP-host path after analysis migrated the index to LadybugDB. Earlier replay
slices restored linked-worktree repo selector handling, `cwd` compatibility,
and path-resolution metadata on the current `LocalBackend` implementation.

Verification:

- `HOME=/tmp/gitnexus-row4-home npm test -- test/integration/local-backend.test.ts test/integration/local-backend-calltool.test.ts test/unit/mcp/group-repo-routing.test.ts test/unit/detect-changes-worktree.test.ts test/unit/mcp-stdout-sentinel.test.ts --reporter=dot`
  passed: 5 files, 94 tests.
- `HOME=/tmp/gitnexus-row4-home npm test -- test/integration/api-impact-e2e.test.ts test/unit/group/impact-by-uid.test.ts test/unit/impact-batching-grouping.test.ts test/unit/impact-confidence.test.ts test/unit/impact-pagination.test.ts --reporter=dot`
  passed: 5 files, 58 tests.

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

Decision: `Reimplemented standalone refresh-context; host setup absorbed/deferred`.

The local branch had explicit multi-host setup and context refresh surfaces that
are absent from the proposed replacement branch. Upstream has `setup.ts`,
`status.ts`, MCP server, and hook assets, but not the same host-adapter split.
If Codex/Claude/Cursor parity is required, define behavior tests first, then
port only the missing behavior.

Follow-up result: the required standalone context refresh surface was restored
as `gitnexus refresh-context [path]` on top of the current upstream context
refresh implementation. The old host-adapter split was not replayed.

Verification is recorded in OpenSpec: focused red/green help and command tests
cover `refresh-context [options] [path]`, `--skip-agents-md`, `--no-stats`, and
`--host`; built CLI smoke confirms the command exits 0.

### 7. Embedding Runtime and Configuration

Representative local files:

- `gitnexus/src/cli/analyze-embeddings.ts`
- `gitnexus/src/cli/embedding-insights.ts`
- `gitnexus/src/cli/embedding-overrides.ts`
- `gitnexus/src/core/embeddings/ollama-client.ts`
- `gitnexus/src/core/embeddings/runtime-config.ts`

Decision: `Reimplemented narrow config command gap`.

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

Decision: `Verified current harness; remapped tests only`.

The upstream unit suite passed with local environment controls
`HOME=/tmp/gitnexus-lbdb-home` and `TMPDIR=/var/tmp`. Keep the current upstream
test harness until a specific local regression test needs an upstream-shaped
port.

Follow-up result: the target capability rows now have focused upstream-shaped
regression coverage. The old `global-setup`, integration-native config, and
setup file layout is not replayed.

### 9. Core Ingestion and Resolution Pipeline

Representative local files:

- `gitnexus/src/core/ingestion/call-form.ts`
- `gitnexus/src/core/ingestion/framework-path-detection.ts`
- `gitnexus/src/core/ingestion/resolvers/utils.ts`
- `gitnexus/src/core/ingestion/utils.ts`

Decision: `Verified absorbed; no replay now`.

Upstream has a much larger scope-based ingestion and language extractor surface.
Direct replay of local pipeline helpers is high risk and should not precede
behavior-level proof that upstream lacks a specific local capability.

Follow-up result: the old helper files remain absent, but representative local
symbols map into the current upstream-shaped ingestion surface:
`inferCallForm` and `extractReceiverName` live under `call-extractors`,
`call-processor`, `call-types`, `tree-sitter-queries`, and
`utils/call-analysis`; `detectFrameworkFromPath` lives under
`entry-point-scoring` and `framework-detection`; suffix resolution now lives
under `import-processor` and language-specific `import-resolvers`.

Verification:

- `HOME=/tmp/gitnexus-row9-home npm test -- test/unit/call-form.test.ts test/unit/framework-detection.test.ts test/unit/ingestion-utils.test.ts test/unit/import-resolver-factory.test.ts test/unit/laravel-route-extraction.test.ts test/unit/php-namespace-extraction.test.ts test/unit/kotlin-scope-captures.test.ts test/unit/kotlin-static-marker.test.ts test/integration/resolvers/vue.test.ts test/integration/resolvers/swift.test.ts test/integration/resolvers/typescript-hof-callbacks.test.ts test/integration/resolvers/typescript-jsx-as-call.test.ts test/integration/resolvers/route-mapping.test.ts --reporter=dot`
  passed: 13 files, 400 tests.

### 10. Kuzu Storage and Index Adapter

Representative local files:

- `gitnexus/src/cli/analyze-kuzu.ts`
- `gitnexus/src/core/kuzu/kuzu-adapter.ts`
- `gitnexus/src/core/kuzu/load-graph.ts`
- `gitnexus/src/mcp/core/kuzu-adapter.ts`

Decision: `Verified retired under LadybugDB`.

Upstream moved to LadybugDB with `gitnexus/src/core/lbug/**` and
`gitnexus/src/mcp/core/lbug-adapter.ts`. Kuzu-specific source files should not
be carried forward. Any still-needed behavior must be described as LadybugDB
behavior and reimplemented there.

Follow-up result: no Kuzu files are replayed. The current branch keeps the
LadybugDB adapter, extension loading, checkpoint, WAL, embedding-hash, native
runtime, readonly-error, FTS repair, and repo-manager surfaces as the retained
storage/index implementation.

Verification:

- `HOME=/tmp/gitnexus-row10-home npm test -- test/unit/lbug-adapter-wal-schema.test.ts test/unit/lbug-checkpoint-lifecycle.test.ts test/unit/lbug-checkpoint.test.ts test/unit/lbug-config-wal.test.ts test/unit/lbug-embedding-hashes.test.ts test/unit/lbug-extension-loader.test.ts test/unit/lbug-native-check.test.ts test/unit/lbug-native-safe-path.test.ts test/unit/lbug-pool-win-fts-probe.test.ts test/unit/lbug-readonly-error.test.ts test/unit/repo-manager.test.ts test/unit/repo-manager-ensure-ignore-readonly.test.ts test/unit/repo-manager-finalize-invariant.test.ts test/unit/run-analyze-fts-repair.test.ts --reporter=dot`
  passed: 14 files, 179 tests, 2 skipped.

### 11. CLI Command and Runtime Surface

Representative local files:

- `gitnexus/src/cli/ai-context.ts`
- `gitnexus/src/cli/analyze-session.ts`
- `gitnexus/src/cli/analyze-summary.ts`
- `gitnexus/src/cli/setup.ts`
- `gitnexus/src/cli/doctor.ts`

Decision: `Reimplemented narrow doctor diagnostics surface`.

Upstream owns the CLI command surface. `ai-context`, `setup`, and most analyze
runtime behavior are already covered by upstream-shaped commands. The local
`main` branch, however, exposed a richer `doctor [path]` surface with
`--json`, `--repo`, `--host`, `--gpu`, and `--fix`; `upstream-sync` had regressed
that to a plain text-only `doctor` command with no options.

The required local operator-facing subset has been replayed without restoring
the old 1000-line Kuzu-era doctor implementation:

- `doctor [path]` accepts `--json`, `--repo <path>`, `--host <name>`, `--gpu`,
  and `--fix`.
- Structured JSON output includes `runtime`, `native-runtime`,
  `language-support`, `capabilities`, `embeddings`, and optional `git-repo` /
  `host-config` checks.
- Text output keeps the current upstream runtime/capability/embedding summary.

Verification on 2026-05-29:

- Red/green focused tests for `doctor --help`, `runDoctor({ json, repo })`, and
  host/native/language checks now pass.
- `npm run build` under `gitnexus` exits 0.
- Built CLI smoke for `doctor --help` and `doctor --json --repo <worktree>`
  exits 0 and emits the expected structured checks.

### 12. Dependency and Package Surface

Representative local files:

- `gitnexus/package.json`
- `gitnexus/package-lock.json`
- `gitnexus-web/package.json`
- `gitnexus-web/package-lock.json`

Decision: `Verified upstream package surface; no replay now`.

The upstream dependency graph built and tested. Restoring old local package
locks would undercut the upstream integration.

Follow-up result: keep upstream package surfaces. `gitnexus/package.json` is now
upstream `1.6.5` with the broader upstream dependency/script set; the old local
`check:repo-governance`, `test:integration:native`, and `test:all` script names
are not restored directly. The PR governance script is restored at its current
workflow path instead.

### 13. Web Ingestion and Selection Behavior

Representative local files:

- `gitnexus-web/src/core/ingestion/import-processor.ts`
- `gitnexus-web/src/workers/ingestion.worker.ts`
- `gitnexus-web/test/unit/GraphCanvas.selection-sync.test.tsx`
- `gitnexus-web/test/unit/useSigma.behavior.test.tsx`

Decision: `Selection verified with regression coverage; browser ingestion retired`.

The old browser-side ingestion worker and import processor belong to the retired
local web ingestion architecture. They should not be replayed into
`upstream-sync`, which now routes graph data through the current backend/server
flow.

The selection/highlighting behavior remains user-facing and is still present in
the current `gitnexus-web/src/hooks/useSigma.ts` path. A focused regression test
was added instead of restoring the old test files verbatim:

- selecting a node nudges the Sigma camera to refresh cached edge rendering
- connected edges are emphasized and unrelated edges are dimmed
- `focusNode` uses the direct focus path after the first focus

Verification on 2026-05-29:

- `HOME=/tmp/gitnexus-web-audit-home npm test --
  test/unit/useSigma.selection.test.tsx --reporter=dot` passed: 1 test file, 3
  tests.
- `HOME=/tmp/gitnexus-web-audit-home npm test -- --reporter=dot` under
  `gitnexus-web` passed: 23 test files, 285 tests.

### 14. Detect-Changes and Worktree Path Handling

Representative local files:

- `gitnexus/src/cli/platform-process-scan.ts`
- `gitnexus/src/lib/path-comparison.ts`
- `gitnexus/test/unit/detect-changes-path-comparison.test.ts`

Decision: `Reimplemented worktree path handling`.

This is a blocker for governed development because `detect_changes` is the
pre-commit scope gate in local rules. The final integration needed an upstream
CLI fallback because the MCP tool expected Kuzu after LadybugDB analysis. A
dedicated upstream-shaped fix should come before main cutover if local source
capability continuity is mandatory.

Follow-up result: completed in two upstream-shaped slices. `detect_changes`
resolves path-like linked-worktree repo selectors by shared canonical git root
after exact indexed-path matching, accepts `cwd` as an MCP client working
directory hint, preserves explicit `worktree` precedence, and returns
path-resolution metadata. Focused detect-changes/worktree tests and MCP-style
runtime smoke passed.

### 15. Web UI Panels and Agent Graph UX

Representative local files:

- `gitnexus-web/src/components/CodeReferencesPanel.tsx`
- `gitnexus-web/src/core/llm/agent.ts`

Decision: `Verified absorbed/enhanced; no replay now`.

The current upstream-shaped `CodeReferencesPanel.tsx` and `agent.ts` are larger
than the local `main` versions and add current file loading, node indexing,
abort handling, and agent-history serialization coverage. Static comparison did
not find local-only exported APIs, state variables, memoized values, or callback
surfaces that would justify replaying the old files.

Targeted verification on 2026-05-29:

- `HOME=/tmp/gitnexus-web-audit-home npm test --
  test/unit/agent-abort.test.ts test/unit/agent-history.test.ts
  test/unit/bug-fixes.test.ts test/unit/useSigma.selection.test.tsx
  --reporter=dot` passed: 4 test files, 33 tests.

This does not replace a future browser-level UX review. It only establishes that
the source capability continuity gate does not require replaying the old local
panel or agent files.

### 16. CI and Governance Automation

Representative local files:

- `gitnexus/scripts/ci/repository-governance-check.mjs`
- `gitnexus/test/unit/repository-governance-check.test.ts`

Decision: `Reimplemented missing PR governance workflow dependency`.

This was a true CI continuity gap. `upstream-sync` preserved the root
`.github/workflows/pr-governance.yml` workflow, and that workflow still invokes
`node gitnexus/scripts/ci/repository-governance-check.mjs`, but the script and
its unit test were absent.

The local package governance script was restored because it is the implementation
behind the preserved root workflow. Its coverage enforces PR-body governance
fields, metric-claim sections, compatibility metadata, temporary-script
metadata, and developer-facing markdown entrypoint anchors.

Verification on 2026-05-29:

- Red/green: restoring only the test first failed before test execution because
  `repository-governance-check.mjs` was missing.
- After restoring the script,
  `HOME=/tmp/gitnexus-lbdb-home
  GITNEXUS_HOME=/tmp/gitnexus-lbdb-home/.gitnexus npx vitest run
  test/unit/repository-governance-check.test.ts --reporter=dot` passed: 1 test
  file, 83 tests.
- Workflow-shaped smoke passed:
  `node gitnexus/scripts/ci/repository-governance-check.mjs --mode pr-body
  --repo-root . --event-path <temp-event-json>` printed
  `Pull request governance body check passed.`

### 17. Core Graph, Index, and Search Pipeline

Representative local files:

- `gitnexus/src/storage/git.ts`
- `gitnexus/src/storage/repo-manager.ts`

Decision: `Verified absorbed/enhanced; no replay now`.

Upstream wins and the analysis smoke passed. The current `git.ts` and
`repo-manager.ts` exports are substantially broader than local main, including
canonical repo root handling, registry ambiguity/finalization errors, safe
storage-path checks, readonly index handling, and Ladybug-era cleanup paths.
Do not replay local versions unless a focused regression proves a missing
behavior.

Verification is shared with row 10 through the focused repo-manager/LadybugDB
suite above.

### 18. Hook and Plugin Runtime

Representative local file:

- `gitnexus-claude-plugin/hooks/gitnexus-hook.js`

Decision: `Verified absorbed plus minimal fix`.

The current `upstream-sync` branch already includes the minimal helper fix in
`hook-db-lock-probe.cjs`.

Verification:

- `HOME=/tmp/gitnexus-row18-home TMPDIR=/var/tmp npx vitest run
  test/unit/hooks.test.ts --reporter=dot` passed: 1 file, 149 tests.
- `HOME=/tmp/gitnexus-row18-home TMPDIR=/var/tmp npx vitest run
  test/unit/cursor-hook.test.ts test/integration/hooks-e2e.test.ts
  test/integration/antigravity-hook-e2e.test.ts --reporter=dot` passed: 3 files,
  105 tests.
- A combined 4-file hook run produced one known concurrent burst flake in
  `Plugin: hook does not exceed MAX_INFLIGHT under simultaneous bursts`; the
  same test passed when isolated.

### 19. Miscellaneous Local Source Surface

Representative local files: split across the capability rows above.

Decision: `Closed by row split; no blanket replay`.

The 31 miscellaneous source-ish files do not define a separate capability after
row classification. They are governed by rows 1-18 and should not be replayed
as a catch-all batch.

## Recommended Execution Order

1. Block `origin/main` cutover until source continuity requirements are reduced
   to explicit capability acceptance criteria.
2. Start with `Detect-changes/worktree path handling`, because local governance
   depends on it and current MCP/CLI behavior diverges after LadybugDB analysis.
3. Completed: audit `MCP local backend/tools` against upstream
   `local-backend.ts` and `lbug-adapter.ts`; keep behavior on the upstream
   backend shape instead of replaying the old split files.
4. Completed: verify `Host integration and context refresh`; restore only the
   required standalone `refresh-context` command and defer broader host-adapter
   parity to future behavior tests.
5. Completed: run focused fixtures for language/framework parsing; keep current
   upstream-shaped Vue, Laravel/PHP, Kotlin, Swift, framework, and tree-sitter
   behavior instead of replaying old local files.
6. Completed: keep the current upstream wiki generator behavior; treat future
   full/incremental/module-tree gaps as product requests against the current API.
7. Completed: re-map tests only after their target capability has a current
   upstream-shaped implementation.
8. Completed: refresh against latest fetched `upstream/main`
   (`b565c7c9905d4465997346bc489106611f8fa979`) and merge it into
   `upstream-sync` as `e5ef91f9bfb2d2e7814e6e77ab24a919c6fca228`.

## Cutover Decision

With the user's stated goal that local source upgrades continue to be fully
effective, the current `upstream-sync` branch has completed the required
second-stage source capability audit and latest-upstream refresh.

The branch remains a staging baseline and review artifact until the maintainer
explicitly approves the final replacement. The only remaining cutover work is
the guarded `origin/main` replacement itself, performed only after final
validation and using `--force-with-lease`.
