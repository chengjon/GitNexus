# Detect Changes Worktree Resolution Design

Date: 2026-03-25  
Status: Draft for review  
Scope: `gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts`

## 1. Goal

Make `detect_changes` choose the correct git working tree when GitNexus is running from a git worktree, while preserving the current tool contract for normal single-checkout repositories.

The target outcome is:

- if the current process is running inside a worktree for the indexed repo, `detect_changes` should diff that worktree
- if not, it should fall back to the registry-backed `repoPath`
- the output should explicitly say which path was used and why

## 2. Current Problem

Today `runDetectChangesTool()` runs git commands with:

- `cwd = ctx.repo.repoPath`

That value comes from the GitNexus registry and usually points at the main checkout path, not an active git worktree path.

This creates a real correctness problem:

- a user can be working inside a git worktree
- the MCP server can still diff the main checkout instead
- the tool may report “No changes detected” even though the user has uncommitted work in the active worktree

The branch already improved this by surfacing warning metadata, but it does not yet fix the underlying path selection.

## 3. Desired Behavior

### 3.1 Preferred Resolution

When `detect_changes` runs, it should first try to resolve the actual git working tree path to diff.

Resolution order:

1. Check whether `process.cwd()` is inside a git worktree belonging to the same repository as `ctx.repo.repoPath`
2. If yes, use that resolved worktree path for git commands
3. If no, fall back to `ctx.repo.repoPath`

This keeps the common case correct for CLI/editor sessions launched from a worktree without breaking existing behavior for users outside a worktree.

### 3.2 Fallback Behavior

If the current process cwd is not in a matching worktree:

- continue using `ctx.repo.repoPath`
- do not fail the tool
- make the fallback visible in output metadata

This preserves compatibility and avoids turning a usability problem into a hard failure.

## 4. Path Resolution Design

### 4.1 New Internal Responsibility

Introduce a small helper local to the `detect_changes` path, or a tiny git helper reused by it, that can answer:

- what is the current git top-level path for `process.cwd()`
- what is the git common dir for `process.cwd()`
- whether that common dir matches the indexed repo’s common dir

The key comparison should be based on git identity, not only string prefix checks on filesystem paths.

Recommended git commands:

- `git rev-parse --git-common-dir`
- `git rev-parse --show-toplevel`

Expected failure mode:

- if `process.cwd()` is not inside a git repository, these commands will fail
- the handler must catch that failure and fall back to the registry-backed `repoPath`
- git resolution failure is not itself a hard error for `detect_changes`

### 4.2 Matching Rule

Two paths should be treated as the same repository when they share the same git common directory.

This matters because:

- a main checkout and its linked worktrees have different working tree paths
- but they share the same common git storage

That gives a much safer signal than comparing only `repoPath` strings.

More precise boundary definition:

| Scenario | Expected behavior |
|----------|-------------------|
| `process.cwd()` is the worktree root | use worktree path |
| `process.cwd()` is a deep child of the worktree | use worktree path |
| `process.cwd()` is not inside any git repo | fall back to registry `repoPath`, no warning |
| `process.cwd()` is inside a different git repo | fall back to registry `repoPath`, warning |
| git identity commands fail | fall back to registry `repoPath`, warning only when ambiguity exists |

### 4.3 Output Metadata

`detect_changes` should continue returning additive metadata and warnings.

Recommended metadata fields:

- `git_repo_path`
  The registry-backed path from GitNexus
- `git_diff_path`
  The actual path used for `git diff`
- `process_cwd`
  The current process working directory
- `path_resolution`
  One of:
  - `cwd_worktree`
  - `registry_repo`

This makes the tool explainable to users and to higher-level callers.

### 4.4 Warning Policy

Warnings should become more selective.

Warn only when:

- the handler had to fall back to `repoPath` while `process.cwd()` appears to be in some other git context
- the cwd is inside a git repo, but not the same git common dir as the indexed repo
- git identity cannot be resolved cleanly and the handler must fall back

Do not warn merely because `process.cwd()` and `repoPath` differ as plain paths. That is too noisy for long-running MCP processes.

## 5. Performance

This design adds a small amount of git-path discovery work to each `detect_changes` call.

Recommended choice for the first implementation:

- accept the extra git command cost
- do not add caching yet

Rationale:

- the expected cost of `git rev-parse` is small compared with the correctness problem being fixed
- caching would add state and invalidation complexity to a handler that is currently easy to reason about
- if performance becomes measurable later, caching can be introduced as a follow-up

## 6. Scope Semantics

The fix must not change existing `scope` behavior.

These modes remain exactly the same:

- `unstaged`
- `staged`
- `all`
- `compare`

`base_ref` validation for `compare` must remain unchanged.

The only behavior change is which working tree path git commands run in.

## 7. Testing Strategy

### 7.1 Unit / Handler-Level Coverage

Add focused tests for:

- cwd inside a matching worktree
  expected: `git diff` runs with `cwd = worktree path`
- cwd outside any matching worktree
  expected: fallback to registry `repoPath`
- cwd inside a different repo
  expected: fallback with explicit warning
- metadata fields are accurate
  especially `git_diff_path` and `path_resolution`

### 7.2 Boundary Coverage

Add focused tests for:

- `process.cwd()` inside a deep subdirectory of the matching worktree
- git resolution command failure
- worktree paths containing spaces or other path characters that often reveal quoting issues

Concurrency-specific behavior does not need a dedicated test in this slice unless implementation introduces shared mutable state.

### 7.3 Existing Contract Preservation

Retain tests for:

- `compare` without `base_ref`
- git error propagation
- summary shape
- changed symbol / affected process structure

### 7.4 Non-Goals for This Slice

This fix does not attempt to:

- solve general worktree registration in the GitNexus registry
- rewrite `detect_changes` symbol mapping logic
- change risk-level formulas
- change `impact` or `rename`

## 8. User-Visible Changes

### 8.1 For Worktree Users

- `detect_changes` will diff the active worktree when GitNexus is run from within that worktree
- the tool should no longer incorrectly report “No changes detected” just because the registry path points at the main checkout

### 8.2 For Non-Worktree Users

- behavior remains unchanged
- the handler will continue to use the registry-backed repo path

### 8.3 New Metadata

Expected additive metadata fields:

- `git_repo_path`
- `git_diff_path`
- `process_cwd`
- `path_resolution`

These fields exist to explain path choice, not to change tool semantics.

## 9. Risks

### Risk 1: Over-detecting unrelated git repositories

If the cwd is inside some other git repo, not the indexed repo, the handler could accidentally diff the wrong project.

Mitigation:

- compare git common dir identity
- only choose cwd when it matches the indexed repo’s git common dir

### Risk 2: Breaking non-worktree usage

If the new logic is too clever, it could disrupt the simple case where users run against a normal checkout.

Mitigation:

- fallback to registry `repoPath`
- keep scope behavior unchanged

### Risk 3: Noisy warnings

If warnings trigger on benign path differences, users will ignore them.

Mitigation:

- warn only on meaningful ambiguity or forced fallback

## 10. Success Criteria

This slice is successful when:

- `detect_changes` diffs the active worktree when GitNexus is run from that worktree
- normal non-worktree usage still behaves exactly as before
- output metadata clearly identifies the actual git path used
- warnings only appear for real ambiguity/fallback situations
- existing `scope` tests stay green

## 11. Recommendation

Implement this as a small targeted correctness fix in `detect_changes`, not as a broader registry redesign.

That gives the highest user-visible value with the lowest regression risk and sets up the next hotspot refactor work on a more trustworthy verification path.
