# upstream-main-integration Specification

## Purpose
TBD - created by archiving change integrate-upstream-main-2026-05-28. Update Purpose after archive.
## Requirements
### Requirement: GitNexus SHALL integrate upstream from an isolated upstream-based branch before replacing the local fork mainline

GitNexus SHALL perform upstream catch-up work on an isolated branch based on
current `upstream/main`, rather than directly merging or rebasing the dirty local
`main` worktree.

#### Scenario: A maintainer starts the upstream integration

- **WHEN** the maintainer begins the 2026-05-28 upstream integration
- **THEN** the integration branch starts from current `upstream/main`
- **AND** the existing local `main` worktree is not switched, reset, or cleaned
  as part of the setup
- **AND** the branch records the current upstream, origin, local, and merge-base
  refs in the OpenSpec change record

#### Scenario: Upstream advances during the integration review

- **WHEN** `upstream/main` advances after second-stage source capability audit
  closure but before final `origin/main` cutover approval
- **THEN** GitNexus fetches the latest upstream ref and merges it into the
  isolated `upstream-sync` staging branch
- **AND** the refresh does not replace `origin/main` or run `--force-with-lease`
- **AND** any touched core ingestion, MCP, impact, or parser behavior is covered
  by focused regression suites before the branch is treated as cutover-ready
- **AND** OpenSpec records the refreshed upstream ref, refreshed staging ref,
  validation commands, and any expected high-risk scope-gate result

### Requirement: GitNexus SHALL preserve local governance while treating upstream source architecture as authoritative for first-pass integration

GitNexus SHALL replay local governance and documentation records onto the
upstream baseline while keeping upstream source architecture authoritative for
core engine and runtime code.

#### Scenario: A file conflict involves core engine or runtime code

- **WHEN** a conflict involves parser, ingestion, resolution, storage, web
  runtime, dependency, or release-critical source files
- **THEN** the upstream version is the default authority
- **AND** local source changes are deferred unless separately compared against
  upstream equivalents and revalidated

#### Scenario: A file conflict involves local fork governance

- **WHEN** a conflict involves `AGENTS.md`, `CLAUDE.md`,
  `DEVELOPMENT_RULES.md`, `openspec/**`, or local governance documentation
- **THEN** the local fork governance content is preserved unless it directly
  contradicts current upstream runtime facts
- **AND** any required contradiction fix is recorded in the same integration
  line rather than left as session-only knowledge

#### Scenario: Upstream validation exposes a narrow source defect

- **WHEN** upstream tests fail because an upstream source file contradicts an
  existing upstream test contract
- **THEN** the integration branch may apply the smallest source fix needed to
  satisfy that upstream contract
- **AND** the fix is recorded in this OpenSpec change
- **AND** the fix does not replay unrelated local source capabilities

### Requirement: GitNexus SHALL gate any mainline replacement behind validation and explicit cutover approval

GitNexus SHALL not push the integration branch over `origin/main` until the
branch has passed the required validation gates and maintainers explicitly
approve the cutover.

#### Scenario: The integration branch is ready for remote review

- **WHEN** the first-pass integration branch is prepared
- **THEN** it is pushed as a staging branch such as `origin/upstream-sync`
- **AND** `origin/main` is not replaced in the same action

#### Scenario: Maintainers approve final mainline replacement

- **WHEN** validation is complete and maintainers approve cutover
- **THEN** the pre-cutover `origin/main` ref is preserved as a backup branch
- **AND** the final replacement may use `--force-with-lease`
- **AND** the command targets only the approved branch replacement

### Requirement: GitNexus SHALL block mainline replacement when local source capability continuity is required but not yet proven

GitNexus SHALL treat local source capability continuity as a separate acceptance
gate from governance replay. If maintainers require local source upgrades to
remain effective after upstream replacement, each local source capability must be
classified as absorbed, reimplemented, retired, or remapped before replacing
`origin/main`.

#### Scenario: Maintainers require local source upgrades to remain effective

- **WHEN** maintainers state that local source upgrades must continue to be
  fully effective after the upstream integration
- **THEN** `origin/main` replacement is blocked until the second-stage source
  capability audit is complete
- **AND** capabilities that remain required are replayed as behavior-level
  upstream-shaped changes rather than copied as old files
- **AND** capabilities tied to retired architecture are explicitly marked
  retired or replaced

#### Scenario: A source capability is tied to the retired Kuzu architecture

- **WHEN** a local source capability depends on Kuzu-specific adapters or index
  storage paths
- **THEN** the Kuzu files are not replayed into the upstream branch
- **AND** any still-required behavior is reimplemented against the current
  LadybugDB architecture

#### Scenario: A source capability is already covered by upstream-shaped fixtures

- **WHEN** a local source capability maps to an upstream replacement architecture
  and focused fixtures pass against the replacement
- **THEN** GitNexus treats the capability as absorbed for the covered behavior
- **AND** the old local files are not replayed into the integration branch
- **AND** any later uncovered gap must start from a focused failing fixture
  against the current upstream-shaped implementation

#### Scenario: A wiki capability maps to the upstream wiki generator

- **WHEN** a local wiki capability is covered by the current upstream wiki
  command, generator, provider client, grouping, or rendering behavior
- **THEN** GitNexus treats the capability as absorbed by the upstream wiki
  implementation
- **AND** the old local module-tree, page-generation, incremental-update, and
  run-pipeline files are not replayed directly
- **AND** any missing wiki behavior must be reintroduced as a focused product
  capability on top of the current upstream wiki generator

#### Scenario: A maintainer persists embedding runtime configuration

- **WHEN** a maintainer runs `gitnexus config embeddings set` with provider,
  Ollama, HTTP, node-limit, or batching settings
- **THEN** GitNexus stores those settings under the `embeddings` key in
  `~/.gitnexus/config.json`
- **AND** `gitnexus config embeddings show` reports both stored and effective
  embedding settings
- **AND** `gitnexus config embeddings clear` removes only the persisted
  embedding settings without deleting unrelated CLI config
- **AND** environment variables continue to take precedence over persisted
  settings
- **AND** persisted Ollama settings activate the current OpenAI-compatible HTTP
  embedding path, while persisted node-limit settings feed bare
  `analyze --embeddings`

#### Scenario: A maintainer requests structured doctor diagnostics

- **WHEN** a maintainer runs `gitnexus doctor --json` with optional `--repo` or
  `--host` selectors
- **THEN** GitNexus prints structured JSON with an `overall` status and named
  checks for runtime, native-runtime, language-support, capabilities, and
  embeddings
- **AND** repo selectors add a `git-repo` check without requiring a reindex
- **AND** host selectors add a `host-config` check for supported local MCP hosts
- **AND** the human-readable `gitnexus doctor` output continues to show the
  current upstream runtime, capability, and embedding summary

#### Scenario: A web user selects a graph node

- **WHEN** a graph node becomes selected in the current `gitnexus-web`
  Sigma-based graph view
- **THEN** GitNexus refreshes Sigma edge rendering through the current camera
  nudge path
- **AND** edges connected to the selected node are emphasized while unrelated
  edges are visually de-emphasized
- **AND** direct `focusNode` calls continue to use the direct focus path rather
  than replaying the retired browser-ingestion worker architecture

#### Scenario: A web user reviews code references or agent output

- **WHEN** current `gitnexus-web` renders code-reference panels or streams agent
  output
- **THEN** GitNexus uses the current upstream `CodeReferencesPanel` and `agent`
  implementations rather than replaying the old local files
- **AND** abort handling, agent-history serialization, file-content mapping, and
  selection/highlight independence remain covered by targeted regression tests
- **AND** any future visual polish request must be treated as a product/UI line,
  not as an automatic source replay requirement

#### Scenario: The PR governance workflow runs

- **WHEN** GitHub Actions runs `.github/workflows/pr-governance.yml`
- **THEN** the referenced
  `gitnexus/scripts/ci/repository-governance-check.mjs` script exists in the
  integration branch
- **AND** the script can validate PR-body governance sections in `--mode pr-body`
- **AND** its unit coverage protects PR governance fields, metric sections,
  compatibility metadata, temporary-script metadata, and developer-facing
  markdown entrypoint anchors

#### Scenario: Detect-changes receives a linked worktree path as the repo selector

- **WHEN** a caller passes a path-like `repo` parameter that points at a linked
  worktree while the registry contains the same repository indexed at its main
  checkout
- **THEN** GitNexus resolves the repository by shared canonical git root after
  exact indexed-path matching fails
- **AND** exact path matches continue to take precedence over canonical-root
  fallback matches
- **AND** multiple canonical-root fallback matches are treated as ambiguous
  rather than resolved by arbitrary registry order

#### Scenario: Detect-changes receives a client cwd hint from MCP

- **WHEN** an MCP client calls `detect_changes` with a `cwd` parameter
- **THEN** GitNexus uses that directory as the linked-worktree auto-detection
  input instead of relying only on the MCP server process cwd
- **AND** the stricter explicit `worktree` parameter still overrides the cwd
  hint after validating that it belongs to the same canonical git repository
- **AND** the result includes path-resolution metadata describing the indexed
  repo path, git diff path, client cwd, resolution mode, fallback reason, and
  warnings

#### Scenario: Repo-scoped MCP tools receive a client cwd hint

- **WHEN** an MCP client calls a repo-scoped tool such as `query`, `context`,
  `impact`, `rename`, `cypher`, or `detect_changes` with a `cwd` parameter
  while multiple repositories are indexed
- **THEN** GitNexus uses that cwd as a repository-selection hint
- **AND** if the explicit cwd does not identify a registered repository,
  resolution remains ambiguous or no-match rather than falling back to the MCP
  server process cwd
- **AND** when no cwd parameter is supplied, the existing MCP server process cwd
  compatibility fallback is preserved
- **AND** an explicit `repo` parameter continues to take precedence over the cwd
  hint
- **AND** ambiguous cwd matches return an ambiguity error rather than selecting
  an arbitrary repository

#### Scenario: Impact guides recovery when the target symbol is not found

- **WHEN** an MCP client calls `impact` for a target that cannot be resolved to
  a graph symbol
- **THEN** GitNexus returns a structured `not_found` response with zero impacted
  symbols and unknown risk
- **AND** the response includes a recovery path that tells the client to use
  `query` to find candidates, `context` to confirm a candidate symbol, and
  `impact` with `target_uid` to retry without name ambiguity

#### Scenario: MCP local tools run on the upstream backend shape

- **WHEN** a maintainer reviews the old local MCP split files for
  backend-contract, backend-runtime, detect-changes handler, impact handler, and
  query-safety
- **THEN** GitNexus does not replay those files directly into the integration
  branch
- **AND** the retained behavior is provided through the current
  `LocalBackend`, LadybugDB adapter, and MCP tool definitions
- **AND** focused regression coverage protects local-backend calls,
  MCP tool routing, group repo routing, stdout isolation, worktree-aware
  `detect_changes`, impact, impact-by-uid, impact grouping, impact confidence,
  impact pagination, and API impact

#### Scenario: Core ingestion and storage use the upstream architecture

- **WHEN** a maintainer reviews the old local ingestion helper files,
  Kuzu adapters, and older storage/repo-manager implementations
- **THEN** GitNexus does not replay those files directly into the integration
  branch
- **AND** call-form inference, receiver extraction, framework detection, and
  suffix/import resolution are retained through the current scope-based
  ingestion and import-resolver modules
- **AND** Kuzu-specific source remains retired in favor of LadybugDB adapters,
  extension loading, checkpoint/WAL handling, readonly handling, FTS repair, and
  repo-manager storage safety checks
- **AND** focused regression coverage protects ingestion/resolver behavior,
  LadybugDB behavior, and repo-manager behavior before `origin/main` cutover is
  considered

#### Scenario: Supporting source surfaces are closed without blanket replay

- **WHEN** a maintainer reviews local package files, test harness files,
  hook/plugin files, and miscellaneous source-ish files from the local branch
- **THEN** GitNexus keeps the upstream `package.json` and lockfile surfaces
  rather than restoring old local package locks or obsolete script names
- **AND** old test harness files remain retired unless a specific retained
  capability requires an upstream-shaped regression test
- **AND** the hook/plugin runtime keeps the current upstream plugin shape plus
  the minimal `hook-db-lock-probe.cjs` ENOENT override fix
- **AND** miscellaneous files are closed through the explicit capability rows
  rather than replayed as a catch-all batch

#### Scenario: A maintainer refreshes AI host context without reindexing

- **WHEN** a maintainer runs `gitnexus refresh-context [path]` inside or against
  a git repository with existing `.gitnexus/meta.json`
- **THEN** GitNexus refreshes the `AGENTS.md` and `CLAUDE.md` GitNexus sections
  from the existing index metadata
- **AND** the command does not require a full `gitnexus analyze` run
- **AND** `--skip-agents-md`, `--no-stats`, and `--skip-skills` remain available
  as focused context-refresh controls
