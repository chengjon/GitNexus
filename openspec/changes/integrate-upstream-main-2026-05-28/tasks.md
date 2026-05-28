## 1. Change Record

- [x] 1.1 Create an isolated `upstream-sync` worktree from current
      `upstream/main`
- [x] 1.2 Restore the local OpenSpec baseline so this integration is governed by
      repository source-of-truth records
- [x] 1.3 Add this OpenSpec change for the upstream integration line

## 2. Baseline Verification

- [x] 2.1 Fetch upstream/origin refs and tags
- [x] 2.2 Record current local, origin, upstream, and merge-base refs
- [x] 2.3 Recalculate local-only commits, upstream-only commits, overlapping
      files, and simulated unmerged paths
- [x] 2.4 Validate this OpenSpec change before replaying the wider governance
      layer

## 3. Governance Replay

- [x] 3.1 Restore local fork governance files that define maintainer rules and
      source-of-truth boundaries
- [x] 3.2 Restore local `docs/**` governance, audit, plan, and framework-guide
      records as documentation layer material
- [x] 3.3 Restore local `.claude/skills/**` GitNexus skill records where they
      describe local fork workflows
- [x] 3.4 Keep upstream versions for core engine, runtime, parser, ingestion,
      storage, web implementation, and dependency source files

## 4. Conflict and Scope Review

- [x] 4.1 Classify every remaining changed path as governance replay, upstream
      source authority, config/manual merge, or deferred local source capability
- [x] 4.2 Manually merge only required config and entrypoint files
- [x] 4.3 Leave local source-code-only capabilities out of the first-pass replay
      unless an upstream-equivalent comparison proves they are still required
- [x] 4.4 Run staged GitNexus change detection before any commit

## 5. Validation

- [x] 5.1 Run `openspec validate integrate-upstream-main-2026-05-28`
- [x] 5.2 Run package install/build verification required by the upstream
      baseline
- [x] 5.3 Run focused tests for touched governance/config/source-validation
      boundaries
- [x] 5.4 Run repository-level anti-regression checks for the integration branch
- [x] 5.5 Run a GitNexus analysis smoke test before claiming the branch is ready

## 6. Cutover Guard

- [x] 6.1 Push only a staging branch first, such as
      `origin/upstream-sync`
- [ ] 6.2 Replace `origin/main` only after explicit approval, successful
      validation, and source capability continuity resolution when required
- [ ] 6.3 Use `--force-with-lease` only for the final approved main replacement

## 7. Second-Stage Source Capability Audit

- [x] 7.1 Recalculate local source-ish files changed since the merge base
- [x] 7.2 Classify each local source capability as absorbed, reimplement,
      retire, verify, or remap tests
- [x] 7.3 Record that `origin/main` cutover is blocked when the required outcome
      is that all local source upgrades continue to be effective
- [ ] 7.4 Replay required source capabilities as upstream-shaped behavior
      changes
  - [x] 7.4.1 Replay detect-changes/worktree repo path handling: path-like
        `repo` parameters now prefer exact indexed paths, then resolve a single
        linked worktree match by shared canonical git root.
  - [x] 7.4.2 Replay MCP `detect_changes` cwd compatibility: `cwd` remains a
        supported client working-directory hint, while the upstream `worktree`
        override remains the stricter explicit path.
  - [x] 7.4.3 Replay standalone `refresh-context`: host context files can be
        refreshed from existing `.gitnexus/meta.json` without running a full
        reindex.
  - [x] 7.4.4 Replay `config embeddings`: the CLI can show, set, and clear
        persisted embedding runtime settings that feed the current upstream
        embedding configuration.
  - [x] 7.4.5 Replay the required `doctor` diagnostics surface:
        `doctor [path]` accepts `--json`, `--repo`, `--host`, `--gpu`, and
        `--fix`, and JSON output includes runtime, native-runtime,
        language-support, capability, embedding, repo, and host checks.
- [ ] 7.5 Re-map local regression tests after their target capabilities are
      absorbed or reimplemented
  - [x] 7.5.1 Add focused regression coverage for resolving an absolute linked
        worktree `repo` parameter to an index registered under the main checkout.
  - [x] 7.5.2 Add focused regression coverage for the `cwd` compatibility
        parameter and returned path-resolution metadata.
  - [x] 7.5.3 Add focused help and execution-path coverage for the
        `refresh-context` command and its context-refresh options.
  - [x] 7.5.4 Add focused regression coverage for `config embeddings`
        help, persistence, environment override precedence, Ollama HTTP mode,
        and configured `analyze --embeddings` node limits.
  - [x] 7.5.5 Add focused regression coverage for `doctor` help flags and
        structured JSON diagnostics.
  - [x] 7.5.6 Add focused regression coverage for current `gitnexus-web`
        Sigma selection behavior that replaced the old local selection-sync
        test files.
- [ ] 7.6 Verify absorbed source capabilities before deciding whether to replay
      old local files
  - [x] 7.6.1 Verify language/framework parsing coverage for Vue SFC, Laravel
        routes, PHP namespaces, framework detection, tree-sitter language
        availability, and Vue/PHP/Kotlin/Swift resolver behavior.
  - [x] 7.6.2 Verify wiki generator coverage for current command flags,
        grouping batching, LLM client behavior, Mermaid sanitization, and built
        CLI help.
  - [x] 7.6.3 Verify embedding runtime coverage for HTTP embedding, embedding
        config, pipeline, chunking, HF env, semantic search/model behavior, and
        persisted config commands.
  - [x] 7.6.4 Verify web build/runtime asset handling for the current
        `gitnexus-web` package before deciding not to replay the old Vite
        helper, Mermaid loader, syntax highlighter helper, and empty browser
        shim files.
  - [x] 7.6.5 Verify web ingestion/selection behavior: retire the old
        browser-side ingestion worker/import processor, and keep the current
        selection/highlighting behavior under regression coverage.

## 8. Final Cutover Guard

- [ ] 8.1 Replace `origin/main` only after explicit approval and successful
      validation
- [ ] 8.2 Use `--force-with-lease` only for the final approved main replacement

## 9. Final Verification Notes

- `openspec validate integrate-upstream-main-2026-05-28` returned
  `Change 'integrate-upstream-main-2026-05-28' is valid` before governance
  replay.
- `gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd:
  "/opt/claude/GitNexus/.worktrees/upstream-sync"})` returned
  `risk_level=low`, `changed_files=842`, `changed_count=761`,
  `affected_count=0`, `git_repo_path=/opt/claude/GitNexus`,
  `git_diff_path=/opt/claude/GitNexus/.worktrees/upstream-sync`,
  `process_cwd=/opt/claude/GitNexus/.worktrees/upstream-sync`,
  `path_resolution=cwd_worktree`, `fallback_reason=null`.
- Interpretation: the staged replay is documentation/OpenSpec/governance
  dominated and does not affect indexed execution flows.
- During unit validation, `test/unit/hooks.test.ts` exposed an upstream hook
  helper defect: explicit missing `GITNEXUS_HOOK_LSOF_PATH` values were ignored
  and the helper fell back to `/usr/bin/lsof`; in this sandbox that host binary
  timed out and forced the guard into fail-closed behavior, contradicting the
  existing ENOENT fail-open test contract.
- `gitnexus_impact` was run for both touched hook helper files in repo
  `upstream-sync`; both returned `risk=LOW`, `impactedCount=0`,
  `processes_affected=0`.
- Minimal source fix applied only to
  `gitnexus/hooks/claude/hook-db-lock-probe.cjs` and
  `gitnexus-claude-plugin/hooks/hook-db-lock-probe.cjs`: non-empty
  `GITNEXUS_HOOK_LSOF_PATH` / `GITNEXUS_HOOK_PS_PATH` overrides are now
  returned as authoritative paths.
- `env HOME=/tmp/gitnexus-lbdb-home TMPDIR=/var/tmp npx vitest run
  test/unit/hooks.test.ts -t "ENOENT lsof"` passed: 1 file, 2 tests.
- `env HOME=/tmp/gitnexus-lbdb-home TMPDIR=/var/tmp npx vitest run
  test/unit/hooks.test.ts` passed: 1 file, 149 tests.
- `env HOME=/tmp/gitnexus-lbdb-home TMPDIR=/var/tmp npm run test:unit`
  passed: 298 files, 6550 tests passed, 4 skipped.
- `npm run build` in `gitnexus/` passed after the hook helper fix.
- `node gitnexus/dist/cli/index.js analyze --workers 0` was stopped after it
  ran for several minutes without progress output; `node
  gitnexus/dist/cli/index.js status` still reported the index up-to-date.
- `node gitnexus/dist/cli/index.js analyze` without a writable `HOME` failed
  because LadybugDB could not install/load the FTS extension under
  `/root/.lbdb`; rerun with `HOME=/tmp/gitnexus-lbdb-home` passed in 88.8s with
  34,244 nodes, 52,701 edges, 1096 clusters, and 300 flows.
- Final MCP `gitnexus_detect_changes({scope: "staged", repo:
  "upstream-sync", cwd: "/opt/claude/GitNexus/.worktrees/upstream-sync"})`
  could not run after the upstream CLI analysis migrated the worktree index to
  LadybugDB; the installed MCP tool still looked for `.gitnexus/kuzu`.
- Equivalent upstream CLI gate passed with `env HOME=/tmp/gitnexus-lbdb-home
  node gitnexus/dist/cli/index.js detect-changes --scope staged --repo
  GitNexus`: 844 changed files, 2070 changed symbols, 2 affected
  `HandlePreToolUse -> ResolveHookBinary` execution flows, `risk level:
  medium`.
- The medium risk is expected and bounded by the two hook helper files; the
  first-pass governance replay itself had previously returned low risk with no
  affected execution flows before the explicit hook override fix was added.
- Full `git diff --cached --check` reports trailing whitespace in replayed
  historical docs/governance files. This line intentionally does not normalize
  that archive material. Scoped check for the two hook helpers and this
  OpenSpec change passed with `git diff --cached --check --
  gitnexus/hooks/claude/hook-db-lock-probe.cjs
  gitnexus-claude-plugin/hooks/hook-db-lock-probe.cjs
  openspec/changes/integrate-upstream-main-2026-05-28`.
- `origin/upstream-sync` was pushed and PR
  https://github.com/chengjon/GitNexus/pull/8 was created as the staging review
  gate. `origin/main` remains unchanged.
- User clarified the target outcome as: local source upgrades must continue to
  be fully effective. That changes the cutover decision: the current
  `upstream-sync` branch remains useful as a staging baseline, but `origin/main`
  replacement is blocked until required local source capabilities are absorbed,
  reimplemented, retired, or remapped.
- `docs/audits/2026-05-28-local-source-capability-audit.md` records the
  second-stage audit. It found 240 local source-ish changed files relative to
  the merge base: 67 use upstream versions in `upstream-sync`, 173 are absent,
  and 0 are preserved as local source content.
- First required source replay slice completed for detect-changes/worktree path
  handling. `gitnexus/src/mcp/local/local-backend.ts` now preserves exact path
  precedence and adds a canonical-root fallback only for path-like `repo`
  parameters; ambiguous canonical-root matches fail with the existing registry
  ambiguity error instead of choosing an arbitrary index.
- Regression coverage added in `gitnexus/test/unit/detect-changes-worktree.test.ts`
  for resolving an absolute linked-worktree `repo` parameter to an indexed main
  checkout.
- Pre-edit impact analysis via
  `env HOME=/tmp/gitnexus-lbdb-home node gitnexus/dist/cli/index.js impact
  resolveRepoFromCache --repo GitNexus --include-tests --summary-only` returned
  `risk=CRITICAL`, `impactedCount=31`, direct caller count 1, 10 affected
  processes, and 5 affected modules; scope was therefore limited to the
  path-like repo-param resolver branch.
- Focused TDD red/green: the new worktree repo-param test failed with
  `expected null to be handle` before the implementation and passed after the
  canonical-root fallback.
- `HOME=/tmp/gitnexus-lbdb-home npx vitest run
  test/unit/detect-changes-worktree.test.ts` passed: 24 tests.
- `HOME=/tmp/gitnexus-lbdb-home npm run build` passed after the detect-changes
  path replay.
- Built CLI smoke passed with
  `HOME=/tmp/gitnexus-lbdb-home node gitnexus/dist/cli/index.js detect-changes
  --scope unstaged --repo GitNexus`: 2 changed files, 12 changed symbols, 4
  affected processes, `risk level: medium`.
- Full unit-suite recheck with default `/tmp` reached 295/298 passing files and
  6548 passing tests, but failed in existing environment-sensitive tests:
  hook concurrent burst accounting, `/tmp` being treated as a git worktree in
  `git.test.ts`, and sibling-clone-drift non-git cwd mocking. The targeted
  detect-changes/worktree suite and build passed.
- Second MCP detect-changes replay slice completed for `cwd` compatibility and
  path-resolution metadata. `detect_changes` now accepts `cwd?: string`,
  resolves it before linked-worktree auto-detection, preserves explicit
  `worktree` override precedence, and returns `metadata.git_repo_path`,
  `metadata.git_diff_path`, `metadata.process_cwd`,
  `metadata.path_resolution`, `metadata.fallback_reason`, and
  `metadata.warnings`.
- Pre-edit impact analysis for this slice returned `detectChanges:
  risk=CRITICAL, impacted=20, direct=1, processes=7, modules=2` and
  `resolveWorktreeCwd: risk=LOW, impacted=1, direct=1, processes=0,
  modules=0`; scope was therefore limited to `detect_changes` cwd compatibility
  and metadata.
- Focused red/green: new structural tests for `cwd` compatibility and
  path-resolution metadata failed before the implementation and passed after
  the `detect_changes` schema/backend changes.
- `HOME=/tmp/gitnexus-lbdb-home npx vitest run
  test/unit/detect-changes-worktree.test.ts` passed: 26 tests.
- `HOME=/tmp/gitnexus-lbdb-home npm run build` passed after the MCP
  detect-changes cwd replay.
- MCP-style runtime smoke passed with `LocalBackend.callTool('detect_changes',
  {repo: 'GitNexus', scope: 'unstaged', cwd:
  '/opt/claude/GitNexus/.worktrees/upstream-sync'})` using
  `GITNEXUS_HOME=/tmp/gitnexus-lbdb-home/.gitnexus`: 3 changed files,
  14 changed symbols, `risk_level=low`, `path_resolution=cwd_worktree`,
  `fallback_reason=null`.
- Third source replay slice completed for host integration/context refresh.
  Upstream `setup` and analyze-time AI context generation already absorb the
  local host adapter split, but the local standalone
  `gitnexus refresh-context [path]` command was absent in `upstream-sync` and
  remained a required operator-facing capability.
- Focused red/green: `refresh-context --help` first fell back to root help,
  proving the command was not registered. After the replay it exposes
  `refresh-context [options] [path]`, `--skip-agents-md`, `--no-stats`, and
  `--skip-skills`.
- `HOME=/tmp/gitnexus-lbdb-home npx vitest run
  test/unit/cli-index-help.test.ts test/unit/refresh-context-command.test.ts
  --reporter=dot` passed: 2 test files, 14 tests.
- Language/framework parsing was verified as absorbed for the covered surfaces;
  direct replay of old local ingestion files is not required for those surfaces.
  `HOME=/tmp/gitnexus-lbdb-home npx vitest run
  test/unit/vue-sfc-extractor.test.ts
  test/unit/laravel-route-extraction.test.ts
  test/unit/php-namespace-extraction.test.ts
  test/unit/framework-detection.test.ts
  test/integration/tree-sitter-languages.test.ts
  test/integration/resolvers/vue.test.ts
  test/integration/resolvers/php.test.ts
  test/integration/resolvers/kotlin.test.ts
  test/integration/resolvers/swift.test.ts
  test/integration/resolvers/route-mapping.test.ts --reporter=dot` passed: 10
  test files, 649 tests.
- Wiki generator was verified as absorbed for the current upstream command
  behavior. `HOME=/tmp/gitnexus-lbdb-home npx vitest run
  test/unit/wiki-flags.test.ts test/unit/wiki-grouping-batch.test.ts
  test/unit/wiki-llm-client.test.ts test/unit/wiki-mermaid-sanitizer.test.ts
  --reporter=dot` passed: 4 test files, 119 tests. Built CLI
  `node dist/cli/index.js wiki --help` exited 0 and exposed `--provider`,
  `--review`, `--model`, `--gist`, and `--api-key`.
- Embedding runtime/configuration replay restored the documented
  `gitnexus config embeddings show|set|clear` surface without restoring the old
  local embedding runtime files. `HOME=/tmp/gitnexus-lbdb-home
  GITNEXUS_HOME=/tmp/gitnexus-lbdb-home/.gitnexus npx vitest run
  test/unit/embedding-config.test.ts test/unit/http-embedder.test.ts
  test/unit/embedding-pipeline.test.ts test/unit/embedding-chunking.test.ts
  test/unit/hf-env.test.ts test/unit/analyze-embeddings-limit.test.ts
  test/unit/lbug-embedding-hashes.test.ts test/unit/semantic-chunk-search.test.ts
  test/unit/model/semantic-model.test.ts test/unit/config-command.test.ts
  --reporter=dot` passed: 10 test files, 133 tests.
- `HOME=/tmp/gitnexus-lbdb-home
  GITNEXUS_HOME=/tmp/gitnexus-lbdb-home/.gitnexus npm run build` passed after
  the embedding config replay.
- Built CLI smoke for `config embeddings set/show/clear` passed with a temporary
  `GITNEXUS_HOME`: set wrote provider `ollama`, node limit `90000`, and batch
  size `8`; show printed effective config; clear removed only `embeddings`.
- Web build/runtime asset handling was verified as absorbed/retired for cutover
  purposes. `HOME=/tmp/gitnexus-web-audit-home npm run build` under
  `gitnexus-web` exited 0. `HOME=/tmp/gitnexus-web-audit-home npm test --
  --reporter=dot` under `gitnexus-web` exited 0 with 22 test files and 282
  tests passing. The build still reports large chunk warnings and an ineffective
  dynamic import warning for `ProcessFlowModal`; those remain optimization debt,
  not a current blocker that justifies restoring the old Vite helper files.
- CLI doctor/runtime surface replay restored the required operator-facing subset
  without restoring the old Kuzu-era doctor implementation. Red/green coverage:
  `HOME=/tmp/gitnexus-lbdb-home
  GITNEXUS_HOME=/tmp/gitnexus-lbdb-home/.gitnexus npx vitest run
  test/unit/cli-index-help.test.ts test/unit/doctor-command.test.ts
  test/unit/doctor-format.test.ts --reporter=dot` passed: 3 test files, 20
  tests.
- `npm run build` under `gitnexus` passed after the doctor replay. Built CLI
  smoke for `doctor --help` and `doctor --json --repo <worktree>` exited 0 and
  produced `runtime`, `native-runtime`, `capabilities`, `language-support`,
  `embeddings`, and `git-repo` checks.
- Web ingestion/selection behavior was split by architecture. The old
  browser-side ingestion worker/import processor was retired with the previous
  local web ingestion architecture. Current Sigma selection behavior was
  verified with `HOME=/tmp/gitnexus-web-audit-home npm test --
  test/unit/useSigma.selection.test.tsx --reporter=dot`: 1 test file, 3 tests.
  The full `gitnexus-web` unit suite also passed with 23 test files and 285
  tests.
