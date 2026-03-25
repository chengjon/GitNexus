# Detect Changes Worktree Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `detect_changes` diff the active git worktree when GitNexus is running inside that worktree, while preserving current behavior for normal single-checkout repositories.

**Architecture:** Add small reusable git-identity helpers to `storage/git.ts`, then update `runDetectChangesTool()` to resolve the actual git diff path using git common-dir identity. Keep `scope` semantics and output shape stable, adding only explanatory metadata and selective warnings.

**Tech Stack:** TypeScript, Vitest, Node.js child_process, git CLI, path normalization

---

## Planned File Structure

**Modify:**
- `gitnexus/src/storage/git.ts`
- `gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts`
- `gitnexus/test/unit/git.test.ts`
- `gitnexus/test/unit/calltool-dispatch.test.ts`
- `gitnexus/test/integration/local-backend.test.ts`

**Intentionally unchanged in this phase:**
- `gitnexus/src/storage/repo-manager.ts`
- `gitnexus/src/mcp/local/runtime/backend-runtime.ts`
- `gitnexus/src/mcp/local/tools/handlers/impact-handler.ts`
- `gitnexus/src/mcp/local/tools/handlers/rename-handler.ts`

This is a targeted correctness fix, not a registry redesign or broader MCP refactor.

### Task 1: Add Git Identity Helpers

**Files:**
- Modify: `gitnexus/src/storage/git.ts`
- Modify: `gitnexus/test/unit/git.test.ts`

- [ ] **Step 1: Write the failing git-helper tests**

Extend `git.test.ts` with focused tests for:

- `getGitCommonDir('/repo/worktree/subdir')` returns a normalized absolute path
- helper returns `null` when `git rev-parse --git-common-dir` fails
- helper does not throw on non-git directories

Use the existing mocked `execSync` pattern in `git.test.ts`.

- [ ] **Step 2: Run the new helper tests to verify failure**

Run:

```bash
cd gitnexus
npx vitest run test/unit/git.test.ts
```

Expected:
- new tests fail because `getGitCommonDir()` / combined identity helper does not exist yet

- [ ] **Step 3: Add minimal git-identity helpers**

Add one or both of:

```ts
export const getGitCommonDir = (fromPath: string): string | null => { ... };

export const getGitIdentity = (fromPath: string): {
  topLevel: string;
  commonDir: string;
} | null => { ... };
```

Requirements:

- use `git rev-parse --show-toplevel`
- use `git rev-parse --git-common-dir`
- normalize to absolute paths
- return `null` on failure instead of throwing

- [ ] **Step 4: Run helper tests and commit**

Run:

```bash
cd gitnexus
npx vitest run test/unit/git.test.ts
```

Expected:
- git helper tests pass

Commit:

```bash
git add gitnexus/src/storage/git.ts gitnexus/test/unit/git.test.ts
git commit -m "feat: add git worktree identity helpers"
```

### Task 2: Resolve Worktree-Aware Git Diff Path

**Files:**
- Modify: `gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts`
- Modify: `gitnexus/test/unit/calltool-dispatch.test.ts`

- [ ] **Step 1: Write the failing worktree-resolution tests**

Extend `calltool-dispatch.test.ts` with focused `detect_changes` cases for:

- when `process.cwd()` is inside a matching worktree, `execFileSync('git', ...)` uses the worktree top-level as `cwd`
- when `process.cwd()` is outside any matching worktree, handler falls back to `ctx.repo.repoPath`
- metadata includes:
  - `git_repo_path`
  - `git_diff_path`
  - `process_cwd`
  - `path_resolution`

Mock the new git helper(s), not the entire handler logic.

- [ ] **Step 2: Run targeted unit tests to verify failure**

Run:

```bash
cd gitnexus
npx vitest run test/unit/calltool-dispatch.test.ts
```

Expected:
- new `detect_changes` resolution assertions fail before implementation

- [ ] **Step 3: Implement path resolution in `runDetectChangesTool()`**

Add a small helper inside `detect-changes-handler.ts`, for example:

```ts
function resolveGitDiffPath(
  repoPath: string,
  processCwd: string,
  deps: ...
): {
  gitDiffPath: string;
  pathResolution: 'cwd_worktree' | 'registry_repo';
  warnings: string[];
}
```

Required behavior:

- get git identity for `process.cwd()`
- get git identity for `ctx.repo.repoPath`
- if both resolve and `commonDir` matches, use cwd’s `topLevel`
- otherwise fall back to `ctx.repo.repoPath`
- only warn on meaningful ambiguity/fallback
- do not warn merely because paths differ

- [ ] **Step 4: Wire metadata fields**

Ensure `detect_changes` responses now include additive metadata:

```ts
metadata: {
  git_repo_path: ...,
  git_diff_path: ...,
  process_cwd: ...,
  path_resolution: 'cwd_worktree' | 'registry_repo',
  scope: ...,
  base_ref?: ...,
}
```

Keep all existing summary / changed_symbols / affected_processes fields intact.

- [ ] **Step 5: Run targeted unit tests and commit**

Run:

```bash
cd gitnexus
npx vitest run test/unit/calltool-dispatch.test.ts
```

Expected:
- `detect_changes` unit coverage passes with new path-resolution assertions

Commit:

```bash
git add gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts gitnexus/test/unit/calltool-dispatch.test.ts
git commit -m "fix: resolve detect_changes against active worktree"
```

### Task 3: Add Integration-Level Worktree Resolution Coverage

**Files:**
- Modify: `gitnexus/test/integration/local-backend.test.ts`

- [ ] **Step 1: Add failing integration regression for path resolution metadata**

Add integration-oriented tests for:

- cwd inside matching worktree/subdirectory
- cwd inside a different git repo
- git helper failure fallback

This can stay semi-isolated by mocking the git helper layer while still exercising `runDetectChangesTool()` end-to-end with a realistic handler context.

- [ ] **Step 2: Run integration test to verify failure**

Run:

```bash
cd gitnexus
npx vitest run --config vitest.integration.native.config.ts test/integration/local-backend.test.ts
```

Expected:
- new `detect_changes` path-resolution assertions fail before final implementation is complete

- [ ] **Step 3: Complete any metadata/warning refinements discovered by the integration test**

Only make bounded adjustments:

- warning wording
- metadata field completeness
- top-level vs cwd path selection edge cases

Do not broaden into symbol-mapping or risk-score redesign.

- [ ] **Step 4: Run the final detect_changes-focused verification and commit**

Run:

```bash
cd gitnexus
npx vitest run test/unit/git.test.ts test/unit/calltool-dispatch.test.ts
npx vitest run --config vitest.integration.native.config.ts test/integration/local-backend.test.ts
```

Expected:
- unit and integration detect_changes coverage passes

Commit:

```bash
git add gitnexus/test/integration/local-backend.test.ts gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts
git commit -m "test: cover detect_changes worktree resolution"
```

### Task 4: Final Verification and Doc Sync

**Files:**
- Modify: `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-design.md` (only if implementation meaningfully differs)

- [ ] **Step 1: Run final verification commands**

Run:

```bash
cd gitnexus
npx vitest run test/unit/git.test.ts test/unit/calltool-dispatch.test.ts test/unit/server.test.ts
npx vitest run --config vitest.integration.native.config.ts test/integration/local-backend.test.ts test/integration/local-backend-calltool.test.ts
npm run build
```

Expected:
- all targeted tests pass
- build passes

- [ ] **Step 2: Run final diff review**

Run:

```bash
git diff --stat main...HEAD
git diff -- gitnexus/src/storage/git.ts gitnexus/src/mcp/local/tools/handlers/detect-changes-handler.ts
```

Expected:
- changes stay concentrated in git helper + detect_changes path + targeted tests

- [ ] **Step 3: Update the spec if implementation required a bounded deviation**

Only update the design doc if the actual implementation meaningfully differs from the approved behavior.

- [ ] **Step 4: Commit spec sync if needed**

```bash
git add docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-design.md
git commit -m "docs: sync detect_changes worktree design"
```

## Execution Notes

- Do not redesign `repo-manager` or registry storage in this slice.
- Do not touch `impact`, `rename`, or `query` behavior.
- Keep `detect_changes` output additive; avoid removing existing fields.
- Prefer helper reuse from `storage/git.ts` over duplicating `git rev-parse` logic in the handler.
