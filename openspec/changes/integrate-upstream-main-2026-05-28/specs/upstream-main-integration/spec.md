# upstream-main-integration Specification Delta

## ADDED Requirements

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
- **THEN** the final replacement may use `--force-with-lease`
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
