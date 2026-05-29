# 2026-05-29 MyStocks Agent Feedback For GitNexus Upstream Update

## Reviewer Context

- Reviewer: Codex agent working on `chengjon/mystocks`
- Primary repo/worktree root: `/opt/claude/mystocks_spec`
- Active project branch family: `wip/root-dirty-20260403`
- Main usage pattern: many short-lived Git worktrees, each PR limited to a small governance or source lane
- GitNexus surfaces used:
  - MCP `detect_changes`
  - CLI `gitnexus status`
  - CLI `gitnexus list`
  - CLI `gitnexus analyze`
  - CLI `gitnexus detect-changes`
  - CLI `gitnexus impact`
  - CLI `gitnexus remove`

This feedback is based on the MyStocks G2.234 and G2.235 steward-tree closeout
work performed after reading
`docs/audits/2026-05-29-upstream-version-update-summary.md`.

## Executive Summary

The 2026-05-29 update direction is correct for this workflow: multi-repo MCP,
global registry, lazy LadybugDB, worktree-aware diff checking, and route/shape
tools are exactly the capabilities this project needs.

The biggest friction was not analysis quality after a clean index. It was
operator flow around linked worktrees, stale/ambiguous repo aliases, and MCP
transport recovery. In several places the agent could recover through CLI
fallback, temporary `.gitnexusignore`, and a worktree-specific alias, but these
recoveries were not obvious from the tool UX.

## What Worked Well

1. A worktree-specific, narrowly indexed docs-only graph worked well.
   - Command pattern used successfully:
     `gitnexus analyze --index-only --name <worktree-alias> --workers 0 --worker-timeout 20 --max-file-size 128 <worktree>`
   - After adding a temporary whitelist `.gitnexusignore`, indexing completed in
     seconds.
   - `gitnexus detect-changes --scope staged --repo <worktree-alias>` then
     reported the intended docs-only result:
     9 changed files, doc symbols only, 0 affected processes, low risk.

2. `impact` was useful as a directional risk signal even when the root index was
   stale.
   - Examples from the residual candidate refresh:
     - `get_calculator_factory`: HIGH, 9 direct, 3 affected processes
     - `get_mock_data_manager`: CRITICAL, 27 direct, 4 affected processes
     - `get_monitoring_db`: correctly surfaced ambiguity / multiple symbols

3. The global registry model is powerful when the selected repo alias is
   precise.
   - Once a per-worktree alias existed, CLI `detect-changes` was deterministic.

## Main Issues Encountered

### 1. MCP `detect_changes` closed the transport instead of returning a recoverable tool error

Observed:

```text
tool call failed for `gitnexus/detect_changes`
Caused by:
    Transport closed
```

Impact:

- The agent had to switch from MCP to CLI.
- The error did not tell the user whether the GitNexus binary, MCP host, repo
  registry, or graph store was the failing layer.
- The update summary correctly says host reconnect is required, but the MCP tool
  error itself did not provide that guidance at the point of failure.

Requested improvement:

- Prefer returning a structured MCP error rather than letting the stdio transport
  close.
- If the process must terminate, emit a final structured diagnostic before exit:
  - command/tool invoked
  - repo parameter
  - cwd/worktree path
  - whether CLI `gitnexus status` is likely still usable
  - explicit guidance: "restart/reconnect the MCP host; shell-spawning another
    `gitnexus mcp` process will not repair this client session"
- Add `gitnexus doctor --json --mcp-host <host>` or equivalent guidance that can
  distinguish "CLI healthy, MCP transport disconnected".

### 2. Repo alias mismatch caused confusion and a huge error payload

Observed:

- Project instructions referred to repo name `mystocks_spec`.
- Current registry exposed the repo as `mystocks`.
- Running with the expected name failed:

```text
Error: Repository "mystocks_spec" not found. Available: mystocks, ...
```

The available repo list was very long because this machine has many indexed
worktrees.

Impact:

- The agent had to guess that `mystocks` was the correct alias.
- The full registry list is too noisy for agent contexts and terminal output.
- In multi-worktree projects, a basename or historical alias mismatch is common.

Requested improvement:

- Add alias/path resolution help:
  - "Current cwd is inside `/opt/claude/mystocks_spec`; closest registered repo
    is `mystocks` at `/opt/claude/mystocks_spec`."
  - "Did you mean `--repo mystocks`?"
- Cap large "Available repos" output by default and show nearest candidates first.
- Add a command such as:
  - `gitnexus resolve-repo --cwd <path> --json`
  - `gitnexus list --current --json`
- For MCP tools, when `repo` is wrong but `cwd` is provided, suggest the matching
  registry alias instead of only failing by name.

### 3. CLI `detect-changes --scope staged --repo mystocks` missed staged changes in a linked worktree

Observed:

From a linked worktree, after staging nine governance files:

```text
gitnexus detect-changes --scope staged --repo mystocks
No changes detected.
```

But the worktree did have staged files. The likely reason is that the `mystocks`
alias resolved to the canonical root checkout, while the current shell cwd was a
linked worktree.

Impact:

- This is risky because "No changes detected" sounds like a clean verification,
  not a worktree/cwd mismatch.
- The agent had to create a separate worktree alias and re-index with a
  worktree-local `.gitnexusignore` before `detect-changes` reported the correct
  staged diff.

Requested improvement:

- Make CLI `detect-changes` parity match MCP's advertised worktree support:
  - infer linked worktree from current cwd even when `--repo` points at the
    canonical registry repo, or
  - add explicit `--cwd` / `--worktree` flags to CLI `detect-changes`.
- If `--scope staged` returns zero changes while cwd is a linked worktree and the
  selected repo path is a different checkout of the same Git repository, warn:

```text
No staged changes found in registered repo path, but cwd is a linked worktree.
Use --worktree <path> or index this worktree under a separate alias.
```

### 4. `gitnexus analyze` could appear stalled or silent on a full worktree

Observed:

Initial worktree analyze command:

```text
gitnexus analyze --index-only --name g2-234-data-source-config-manager-provider-closeout-refresh --workers 2 --worker-timeout 20 --max-file-size 256 <worktree>
```

It exceeded the agent tool timeout and later still appeared to be running. The
log had only early messages about optional grammar and skipped large files, with
no useful progress heartbeat.

A second attempt with `--workers 0 --max-file-size 128` also remained quiet for a
long time until manually stopped.

The successful recovery was to create a temporary whitelist `.gitnexusignore`
that indexed only the PR's governance/evidence paths. Then analyze completed in
seconds:

```text
Repository indexed successfully
16-17 nodes, 14-15 edges, 0 flows
```

Impact:

- Without a heartbeat, the agent cannot tell whether analyze is parsing,
  waiting, stuck, or blocked on native state.
- The user sees unnecessary delay for docs-only diffs.
- A worktree-specific index is useful, but the discovery path is manual.

Requested improvement:

- Add periodic progress heartbeat for analyze:
  - files discovered
  - files skipped by ignore/max-size
  - current phase
  - current file or batch
  - worker status
  - elapsed time since last progress
- Add a built-in wall-clock timeout or `--timeout` flag that exits cleanly with a
  recovery report.
- Add a `--diff-only` or `--paths-from-git-diff` indexing mode for staged/PR
  scope checks, especially docs-only governance PRs.
- If many generated or large files are detected, suggest:
  - `--max-file-size`
  - bounded workers
  - generated-data ignore patterns
  - path-limited indexing

### 5. Stale index status needs to flow into `detect-changes` output

Observed:

`gitnexus status` on the root checkout reported:

```text
Indexed commit: 0ce0fd3
Current commit: 6995cc6
Status: stale
```

But `detect-changes --scope staged --repo mystocks` in the linked worktree could
still return "No changes detected" without making the stale/cwd mismatch obvious.

Impact:

- A stale graph may still be directionally useful for `impact`, but it should not
  be silently treated as authoritative for staged scope verification.

Requested improvement:

- Add stale metadata to all `detect-changes` results:
  - indexed commit
  - current commit for selected repo path
  - cwd commit if cwd differs from selected repo path
  - stale severity
  - whether result is exact or directional
- For worktree diffs, include:
  - registered repo path
  - actual diff path used
  - detected `.git` type: directory or linked-worktree file

### 6. Optional grammar warning was correct but noisy for non-affected repos

Observed:

Every analyze printed a `tree-sitter-proto` optional grammar warning. This was
not material to MyStocks docs-only governance checks.

Requested improvement:

- Keep the warning, but consider demoting or summarizing it when no `.proto`
  files are in the selected path scope.
- In path-limited / docs-only indexing, report optional grammar warnings only if
  relevant files are encountered.

## Suggested UX Improvements

### A. Add a first-class "agent staged scope check" command

Proposed command:

```bash
gitnexus verify-staged --cwd <worktree> --json
```

Expected behavior:

- resolves the current worktree correctly
- warns if the selected registry alias points to another checkout
- reports staged file count
- reports source-vs-docs classification
- runs or reuses the minimal needed index
- returns low/medium/high risk
- includes stale and index freshness metadata

This would match the way agent PR work actually happens: small isolated
worktrees, many docs-only or path-limited source lanes, and pre-commit staged
checks.

### B. Add repo alias diagnostics optimized for large registries

Current failure listed too many repo names. A better failure would be:

```text
Repository "mystocks_spec" not found.
Nearest registered repo for cwd:
  mystocks -> /opt/claude/mystocks_spec
Other close aliases:
  g2-...
Use `gitnexus list --all` to print the full registry.
```

### C. Add docs-only / no-source mode

For governance PRs, the desired GitNexus answer is usually:

- changed files are docs/governance only
- no source symbols affected
- no execution flows affected
- risk low

The tool could support this directly without requiring a full repo re-index.

Proposed command:

```bash
gitnexus detect-changes --scope staged --docs-only-ok --cwd <worktree>
```

### D. MCP reconnection guidance should be surfaced at the exact failure point

The update summary documents the MCP reconnect boundary clearly. The tool
runtime should surface that same instruction when transport closes or when the
MCP server version differs from the CLI version.

## Prioritized Maintainer Requests

1. **Highest:** make `detect_changes` worktree-aware in CLI when run from a
   linked worktree, or add explicit `--cwd` / `--worktree` flags.
2. **High:** replace MCP `Transport closed` with structured diagnostics and
   explicit host reconnect guidance when possible.
3. **High:** improve repo alias resolution in a large global registry; suggest
   the repo matching current cwd.
4. **Medium:** add analyze progress heartbeat and timeout/recovery reporting for
   silent/stalled runs.
5. **Medium:** add a staged docs-only / path-limited verification mode so small
   governance PRs do not need full repository analysis.
6. **Medium:** include stale-index and selected-path metadata in every
   `detect-changes` result.
7. **Low:** suppress optional grammar warnings when the selected indexed scope
   cannot contain those file types.

## Concrete Evidence From This Session

### MCP transport

```text
gitnexus/detect_changes -> Transport closed
```

Fallback: CLI was used.

### Repo alias mismatch

```text
gitnexus detect-changes --scope staged --repo mystocks_spec
Error: Repository "mystocks_spec" not found.
```

Fallback:

```text
gitnexus detect-changes --scope staged --repo mystocks
No changes detected.
```

This was misleading from a linked worktree with staged changes.

### Worktree alias recovery

Successful recovery pattern:

```bash
gitnexus analyze --index-only \
  --name g2-235-service-lifecycle-residual-candidate-refresh \
  --workers 0 \
  --worker-timeout 20 \
  --max-file-size 128 \
  /opt/claude/mystocks_spec/.worktrees/g2-235-service-lifecycle-residual-candidate-refresh

gitnexus detect-changes \
  --scope staged \
  --repo g2-235-service-lifecycle-residual-candidate-refresh
```

Successful result:

```text
Changes: 9 files, 9 symbols
Affected processes: 0
Risk level: low
```

### Analyze stall recovery

Full worktree analyze appeared stalled/silent. Path-limited `.gitnexusignore`
made it complete in seconds.

Temporary whitelist pattern:

```gitignore
*
!.planning/
!.planning/codebase/
!.planning/codebase/generated/
!.planning/codebase/steward-tree/
!.planning/codebase/steward-tree/**
!docs/
!docs/reports/
!docs/reports/quality/
!governance/
!governance/mainline/
!governance/mainline/task-cards/
```

This pattern is effective but should not have to be hand-authored by agents for
routine docs-only PR checks.
