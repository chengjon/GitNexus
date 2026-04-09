# Detect Changes Worktree Resolution Design

Date: 2026-03-25  
Status: Implemented; truth-synced to current behavior on 2026-04-07  
Scope: `gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts`

## 1. Goal

Document the current `detect_changes` worktree resolution contract now that the
path-selection fix is implemented.

The target outcome is:

- if the caller provides `params.cwd`, `detect_changes` should prefer it over `process.cwd()`
- if that effective cwd belongs to the same git repository as the indexed repo, `detect_changes` should diff that worktree
- if not, it should fall back to the registry-backed `repoPath`
- the output should explicitly say which path was used and why

## 2. Current Problem

The original correctness problem was:

- a user can be working inside a git worktree
- the MCP server can still diff the main checkout instead
- the tool may report “No changes detected” even though the user has uncommitted work in the active worktree

That path-selection bug is now fixed in `runDetectChangesTool()`.

The remaining risk is no longer in GitNexus mainline logic; it is in whether an
external host actually passes the right `cwd` when `process.cwd()` does not
represent the active user worktree.

## 3. Desired Behavior

### 3.1 Preferred Resolution

Current resolution order:

Resolution order:

1. Use `params.cwd` when provided, otherwise fall back to `process.cwd()`
2. Resolve git identity for that effective cwd and for `ctx.repo.repoPath`
3. If both identities exist and their `commonDir` values match, use the cwd-side `topLevel` path for git commands
4. Otherwise, fall back to `ctx.repo.repoPath`

This keeps the common case correct for worktree-aware callers without breaking
existing behavior for users outside a worktree.

### 3.2 Fallback Behavior

If the effective cwd is not in a matching worktree:

- continue using `ctx.repo.repoPath`
- do not fail the tool
- expose the fallback through additive metadata
- warn only when the fallback reflects ambiguity or a different repo, not when the cwd simply is not a git repo

This preserves compatibility and avoids turning a usability problem into a hard failure.

## 4. Path Resolution Design

### 4.1 New Internal Responsibility

Introduce a small helper local to the `detect_changes` path, or a tiny git helper reused by it, that can answer:

- what is the current git top-level path for the effective cwd
- what is the git common dir for the effective cwd
- whether that common dir matches the indexed repo’s common dir

The key comparison should be based on git identity, not only string prefix checks on filesystem paths.

Current git helper contract:

- `git rev-parse --git-common-dir`
- `git rev-parse --show-toplevel`

Semantic boundary:

| Command | Purpose |
|---------|---------|
| `--git-common-dir` | determine whether the effective cwd and indexed repo share the same repository identity |
| `--show-toplevel` | resolve the visible worktree root used for `git diff` |
| `--git-dir` | useful only for distinguishing the specific checkout/worktree admin dir; **not** the identity signal used by the current implementation |

Expected failure mode:

- if the effective cwd is not inside a git repository, these commands will fail
- the handler must catch that failure and fall back to the registry-backed `repoPath`
- git resolution failure is not itself a hard error for `detect_changes`

### 4.2 Matching Rule

Two paths should be treated as the same repository when they share the same git common directory.

This matters because:

- a main checkout and its linked worktrees have different working tree paths
- but they share the same common git storage

That gives a much safer signal than comparing only `repoPath` strings.

More precise boundary definition:

| Scenario | Expected behavior | `fallback_reason` |
|----------|-------------------|-------------------|
| effective cwd is the worktree root | use worktree path | `null` |
| effective cwd is a deep child of the worktree | use worktree path | `null` |
| effective cwd is not inside any git repo | fall back to registry `repoPath`, no warning | `not_git_repo` |
| effective cwd is inside a different git repo | fall back to registry `repoPath`, warning | `different_repo` |
| indexed repo identity cannot be resolved | fall back to registry `repoPath`, warning | `repo_identity_unresolved` |

Current implementation detail:

- `not_git_repo` describes cwd-side identity resolution failure
- `repo_identity_unresolved` describes registry-side identity resolution failure

### 4.3 Output Metadata

`detect_changes` should continue returning additive metadata and warnings.

Recommended metadata fields:

- `git_repo_path`
  The registry-backed path from GitNexus
- `git_diff_path`
  The actual path used for `git diff`
- `process_cwd`
  The effective working directory used for identity resolution (`params.cwd` or `process.cwd()`)
- `path_resolution`
  One of:
  - `cwd_worktree`
  - `registry_repo`
- `fallback_reason`
  One of:
  - `different_repo`
  - `not_git_repo`
  - `repo_identity_unresolved`
  - `null`

This makes the tool explainable to users and to higher-level callers.

### 4.4 Warning Policy

Warnings should become more selective.

Warn only when:

- the handler had to fall back to `repoPath` while the effective cwd appears to be in some other git context
- the effective cwd is inside a git repo, but not the same git common dir as the indexed repo
- indexed repo identity cannot be resolved cleanly and the handler must fall back

Do not warn merely because the effective cwd and `repoPath` differ as plain
paths. That is too noisy for long-running MCP processes.

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

Current focused coverage includes:

- explicit `cwd` wins over `process.cwd()`
- cwd inside a matching worktree resolves to `cwd_worktree`
- cwd inside a different repo falls back with `different_repo`
- non-git cwd falls back with `not_git_repo`
- metadata fields and `fallback_reason` are directly asserted

Referenced tests:

- `gitnexus/test/unit/calltool-dispatch.test.ts`
- `gitnexus/test/integration/local-backend.test.ts`

### 7.2 Boundary Coverage

Still reasonable follow-up coverage:

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
- force external hosts to pass `cwd`
- rewrite `detect_changes` symbol mapping logic
- change risk-level formulas
- change `impact` or `rename`

## 8. User-Visible Changes

### 8.1 For Worktree Users

- `detect_changes` will diff the active worktree when the effective cwd belongs to that worktree
- the tool should no longer incorrectly report “No changes detected” just because the registry path points at the main checkout
- if the host cannot provide the right cwd, the remaining limitation is in host integration, not in handler path selection

### 8.2 For Non-Worktree Users

- behavior remains unchanged
- the handler will continue to use the registry-backed repo path

### 8.3 New Metadata

Expected additive metadata fields:

- `git_repo_path`
- `git_diff_path`
- `process_cwd`
- `path_resolution`
- `fallback_reason`

These fields exist to explain path choice, not to change tool semantics.

## 9. Risks

### Risk 1: Over-detecting unrelated git repositories

If the effective cwd is inside some other git repo, not the indexed repo, the
handler could accidentally diff the wrong project.

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

### Risk 4: Host integration still controls real-world correctness

If a host never passes the active worktree path and its process cwd does not
match the user worktree, `detect_changes` can still diff the wrong checkout.

Mitigation:

- document that `params.cwd` takes priority over `process.cwd()`
- keep host-specific guidance explicit for Claude Code / Codex and future MCP clients
- treat the remaining compatibility matrix as host research, not a mainline GitNexus blocker

## 10. Success Criteria

This slice is successful when:

- `detect_changes` diffs the active worktree when the effective cwd belongs to that worktree
- normal non-worktree usage still behaves exactly as before
- output metadata clearly identifies the actual git path used and the fallback reason
- warnings only appear for real ambiguity/fallback situations
- explicit `cwd` priority and `fallback_reason` tests stay green

## 11. Recommendation

Keep this documented as an implemented fix, not as a still-pending proposal.

The remaining open follow-up is external host compatibility research around
which MCP clients actually pass `cwd` in worktree scenarios.
