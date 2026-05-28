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

- [ ] 6.1 Push only a staging branch first, such as
      `origin/upstream-sync`
- [ ] 6.2 Replace `origin/main` only after explicit approval and successful
      validation
- [ ] 6.3 Use `--force-with-lease` only for the final approved main replacement

## 7. Final Verification Notes

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
