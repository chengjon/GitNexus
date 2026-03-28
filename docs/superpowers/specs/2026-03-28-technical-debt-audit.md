# Technical Debt Audit Report

**Date**: 2026-03-28  
**Auditor**: AI Review  
**Scope**: Wiki-page-generation-subagents worktree, design documents, tech debt roadmap

---

## 1. Active Worktree Status

### wiki-page-generation-subagents

| Metric | Documented | Actual | Delta |
|--------|------------|--------|-------|
| Unmerged commits | 20+ | **47** | +27 |
| Uncommitted changes | +4/-2 | `gitnexus/src/core/wiki/full-generation.ts` (staged) + 2 untracked review docs | ❌ Underreported |

**Commit history** (excerpt):
```
f070ff0 refactor: extract wiki full generation flow
e53cafe test: cover wiki full generation orchestration
80bee09 test: define wiki full generation contract
4344c87 plan: outline wiki full generation extraction
... (43 more)
```

**Additional uncommitted files**:
- `docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design-review.md`
- `docs/superpowers/specs/2026-03-28-wiki-generator-full-generation-review.md`

**Recommendation**: 47 commits is substantial, but well-structured:
- 27 test commits (57%) — thorough coverage
- 7 refactor commits — actual extraction
- 6 spec + 4 plan commits — design upfront

**Chosen Merge Strategy**: `git merge main` + `git merge --no-ff wiki-page-generation-subagents`

Rationale:
- High test coverage (27/47) provides confidence
- Series already organized as incremental → support → module-tree → full-generation
- `--no-ff` preserves history while keeping clean merge point

---

## 2. Design Documents Status

| Document | Document Status | Actual Repo Status | Verified |
|----------|-----------------|--------------------|----------|
| `wiki-generator-page-generation-design` | ✅ Draft | ✅ Draft exists | ✅ Match |
| `wiki-generator-module-tree-design` | ✅ Draft | ✅ Draft exists | ✅ Match |
| `detect-changes-worktree-resolution-design` | ✅ Draft | ✅ Design exists; implementation already landed | ✅ Exists |
| `local-backend-handler-first-design` | ⚠️ Implemented, pending merge | ✅ Refactor already merged on `main` | ❌ Status stale |
| `parse-worker-laravel-route-extraction-design` | ✅ Draft | ✅ Laravel route extraction already landed in repo code | ❌ Status stale |
| `detect-changes-worktree-resolution-review` | ✅ Has TODO | ✅ Review exists with remaining TODO items | ✅ Match |

**Notes**:
- Most documented design files exist and broadly match their intended phase
- `local-backend-handler-first-design` is stale as a status source; roadmap and code indicate the handler-first split is already merged on `main`
- `parse-worker-laravel-route-extraction-design` is also stale as a phase marker; the extraction is already implemented in `src/core/ingestion/routes/`
- Review documents still contain actionable TODOs

---

## 3. Tech Debt Roadmap Progress

| Phase | Item | Status | Notes |
|-------|------|--------|-------|
| **P0-A** | NativeRuntimeManager | ✅ First pass complete | Runtime manager exists and is integrated across CLI / MCP / server runtime paths |
| **P0-B** | Test infrastructure hardening | ✅ First pass complete | Active Vitest/CI layout has been restructured; follow-up work is optional hardening, not missing baseline |
| **P1** | local-backend.ts | ✅ Done | MCP backend split complete and already merged on `main` |
| **P1** | generator.ts | 🔄 In progress | 47-commit worktree series still awaits final commit/merge; `failedModules` review finding has been fixed locally |
| **P1** | parse-worker.ts | ✅ Done | Laravel route extraction already lives under `src/core/ingestion/routes/` with downstream imports updated |
| **P1** | kuzu-adapter.ts | ✅ Local slice committed | FTS helpers have been extracted to `src/core/kuzu/fts.ts`; local commit `ecd70ee` verifies the first narrowing step |
| **P1** | analyze.ts | ✅ Local slice committed | Analyze orchestration has been split into finalization/embeddings/summary/kuzu/session helpers; local commit `df9ae67` verifies the first narrowing step |
| **P2** | Kotlin/Swift language support | 🔄 In progress | `doctor --json` already reports `language-support`; deterministic support work remains |
| **P3** | Platform abstraction convergence | 🔄 In progress | Platform-specific logic has moved forward, but convergence work remains open |

### P0-A Detail

The `NativeRuntimeManager` class exists at:
```
gitnexus/src/runtime/native-runtime-manager.ts
```

Functions implemented:
- Reindex lock management (`writeReindexLock`, `removeReindexLock`, `readReindexLock`)
- Stale-lock handling (`clearStaleReindexLock`, `assertNoActiveReindexLock`)
- Runtime snapshot (`getSnapshot`)
- Signal handling / exit orchestration (`registerShutdownHandlers`, `scheduleExit`, `runCleanupAndExit`)
- Runtime-specific cleanup entrypoints (`cleanupMcpRuntime`, `cleanupCoreRuntime`)

Current integration surface includes:
- `gitnexus/src/cli/analyze.ts`
- `gitnexus/src/cli/doctor.ts`
- `gitnexus/src/cli/eval-server.ts`
- `gitnexus/src/mcp/server.ts`
- `gitnexus/src/server/api.ts`
- `gitnexus/src/mcp/core/kuzu-adapter.ts`
- core / MCP embedder lifecycles

**Assessment**: The current roadmap treats P0-A as first-pass complete. Any remaining work should be framed as follow-on scope expansion, not as proof that the initial phase is still only "partial".

### P1-generator.ts Detail

The worktree contains 47 commits across the full extraction series:
- incremental update extraction
- support helpers extraction
- module tree extraction
- page generation extraction (current)

Current local follow-up status:
- the design review has been completed
- the `failedModules` dual-channel follow-up has been implemented locally in the worktree
- the remaining work is operational: final commit(s) and merge sequencing

**Recommendation**: Treat the remaining generator work as integration/merge work, not as an unresolved design defect.

### P1-parse-worker.ts Detail

The Laravel route extraction slice is already implemented in the main repo:
- `gitnexus/src/core/ingestion/routes/types.ts`
- `gitnexus/src/core/ingestion/routes/laravel-route-extraction.ts`
- `gitnexus/src/core/ingestion/routes/php-route-shared.ts`
- downstream consumers now import `ExtractedRoute` from `routes/types.ts`

**Assessment**: The audit's earlier "`❌ Not started`" status was stale.

### P1-kuzu-adapter.ts Detail

The current workspace now contains a focused FTS extraction:
- `gitnexus/src/core/kuzu/fts.ts`
- `gitnexus/src/core/kuzu/kuzu-adapter.ts` retains the public API as thin wrappers
- targeted FTS/core adapter tests and build pass locally

**Assessment**: This is no longer merely "pending evaluation"; a first local slice has already been executed, verified, and committed locally.

### P1-analyze.ts Detail

The current workspace now contains focused orchestration helpers for analyze:
- `gitnexus/src/cli/analyze-finalization.ts`
- `gitnexus/src/cli/analyze-embeddings.ts`
- `gitnexus/src/cli/analyze-summary.ts`
- `gitnexus/src/cli/analyze-kuzu.ts`
- `gitnexus/src/cli/analyze-session.ts`

`gitnexus/src/cli/analyze.ts` remains the top-level workflow, but no longer owns as many inlined details.

**Assessment**: This is active local implementation work with verification evidence and a local commit, not just roadmap evaluation.

---

## 4. Residual Artifacts

### .omc/state Files

| Documented | Actual | Delta |
|------------|--------|-------|
| 3 files | **2 files** | -1 |

**Actual files**:
- `hud-state.json` (180B)
- `hud-stdin-cache.json` (861B)

**Assessment**: The previous 4-file observation is not reproducible in the current checkout. `.omc/state` appears environment-specific, so debt claims here should be backed by a fresh directory listing instead of older residue assumptions.

---

## 5. Action Items

| Priority | Action | Status | Owner |
|----------|--------|--------|-------|
| **High** | Decide merge strategy for 47 commits | ✅ Done | Team |
| **High** | Update audit language so P0/P1 statuses match roadmap and current codebase reality | ✅ Done | Auditor |
| **High** | Account for the 2 wiki review docs before merging the worktree | 🔄 In progress — both review docs are staged, final commit still pending | Worktree owner |
| **Medium** | Complete design review for generator.ts extraction before merge | ✅ Review completed; follow-up fix implemented locally, final commit still pending | Reviewer + implementer |
| **Medium** | Commit the local `kuzu-adapter.ts` FTS slice after review | ✅ Done locally (`ecd70ee`) | Maintainer |
| **Medium** | Commit the local `analyze.ts` helper extraction after review | ✅ Done locally (`df9ae67`) | Maintainer |
| **Low** | Record exact verification commands / sample time in future audit snapshots | ✅ Done | Auditor |

### Verification Snapshot

Sample window: 2026-03-28 19:30-19:31 (UTC+08:00)

Commands used for this audit update:
- `git -C .worktrees/wiki-page-generation-subagents rev-list --count HEAD ^main` → `47`
- `git -C .worktrees/wiki-page-generation-subagents status --short`
- `find .omc/state -maxdepth 1 -type f | sort`
- `npx vitest run test/unit/wiki-incremental-update.test.ts test/unit/wiki-generator-support.test.ts test/unit/wiki-full-generation.test.ts test/unit/wiki-generator-orchestration.test.ts`
- `npx vitest run test/unit/kuzu-fts.test.ts test/unit/analyze-finalization.test.ts test/unit/analyze-embeddings.test.ts test/unit/analyze-summary.test.ts test/unit/analyze-kuzu.test.ts test/unit/analyze-session.test.ts`
- `npx vitest run --config vitest.integration.native.config.ts test/integration/search-core.test.ts`
- `npx vitest run --config vitest.integration.config.ts test/integration/cli-e2e.test.ts`

Observed verification results:
- Worktree status at sample time: 2 staged review docs + 1 staged `gitnexus/src/core/wiki/full-generation.ts`
- `.omc/state` contained 2 files: `hud-state.json`, `hud-stdin-cache.json`
- Targeted wiki extraction tests passed: 4 files, 22 tests
- Local `kuzu-adapter` / `analyze.ts` refactor helpers passed: 6 files, 18 tests
- Local code commits created:
  - `ecd70ee` — `refactor(kuzu): extract fts helpers`
  - `df9ae67` — `refactor(analyze): extract workflow helpers`
- Core FTS search native integration passed: 1 file, 12 tests
- CLI end-to-end integration passed: 1 file, 8 tests (including `analyze` on a mini repo)

### Design Review Findings

Extraction modules verified:
- `incremental-update.ts` → `wiki-incremental-update.test.ts` ✅
- `generator-support.ts` → `wiki-generator-support.test.ts` ✅
- `full-generation.ts` → `wiki-full-generation.test.ts` ✅
- Orchestration → `wiki-generator-orchestration.test.ts` ✅

Review status nuance:
- The review artifacts exist and the targeted extraction tests pass
- `2026-03-28-wiki-generator-full-generation-review.md` still records the prior should-fix issue, but the current worktree code has already switched `runFullGeneration` to internal `failedModules` aggregation and wrapper-level mergeback

Test coverage by commit labeling: 27/47 commits (57%) are `test:` commits.

---

## 6. Summary (2026-03-28 Updated)

**Status**: Action items largely resolved
- Wiki worktree: merge strategy decided, review docs staged
- P0/P1 status: language aligned with current codebase
- Verification evidence is now recorded with explicit commands and sample window
- Design review is complete and its generator follow-up fix exists in local code
- `parse-worker.ts` is already implemented in repo code
- `kuzu-adapter.ts` and `analyze.ts` now have verified local extraction slices committed on local `main`

**Remaining**:
- Final commit of the staged wiki review docs and `full-generation.ts`
- Review/push the newly committed `kuzu-adapter.ts` and `analyze.ts` slices as needed
- Execute the generator worktree merge command sequence after the above is settled

**Risk assessment**: Medium — the remaining work is mostly integration and branch hygiene rather than unverified refactor intent. Confidence is improved by passing helper tests, native core search integration, CLI analyze e2e, and by landing the local `kuzu-adapter.ts` / `analyze.ts` slices as commits.
