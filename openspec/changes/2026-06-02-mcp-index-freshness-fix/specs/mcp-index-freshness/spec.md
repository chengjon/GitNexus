# mcp-index-freshness Specification Delta

## ADDED Requirements

### Requirement: MCP server SHALL refresh all in-memory metadata on index re-init

The MCP server SHALL refresh `handle.lastCommit` and `handle.stats` from `meta`
whenever `ensureInitialized` detects that `indexedAt` changed (CLI rebuilt the index),
so that subsequent stale-checks use current values.

#### Scenario: MCP server re-initializes after CLI rebuilds the index

- **WHEN** a long-running MCP server detects `indexedAt` has changed
- **THEN** the server re-opens the database AND refreshes `lastCommit` and `stats` from the new `meta`
- **AND** subsequent calls to `buildIndexStatus` reflect the current commit, not a stale value

### Requirement: Index status SHALL include granular stale reasons and staged-diff freshness

`buildIndexStatus` SHALL populate `stale_reasons` (e.g. `["commit_mismatch"]`) and
`fresh_for_staged_diff` (true when index is stale but no staged files exist).

#### Scenario: Index is stale due to commit mismatch but no staged files

- **WHEN** the indexed commit differs from HEAD
- **AND** `git diff --cached --name-only` returns no files
- **THEN** `stale_reasons` includes `"commit_mismatch"`
- **AND** `fresh_for_staged_diff` is `true`

### Requirement: CLI status SHALL support structured JSON output

`gitnexus status --json` SHALL output a JSON object with repoPath, indexedAt,
indexedCommit, currentCommit, upToDate, stats, and stale information.

#### Scenario: User runs gitnexus status --json on an up-to-date repo

- **WHEN** the user runs `gitnexus status --json`
- **THEN** the output is valid JSON containing `upToDate: true` and the current commit hash
