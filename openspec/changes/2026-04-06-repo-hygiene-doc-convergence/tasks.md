## 1. Audit Baseline

- [x] 1.1 Add the 2026-04-06 repository technical-debt and residual audit under `docs/audits/`
- [x] 1.2 Cross-link the audit and the OpenSpec change so future cleanup work has a single entry point

## 2. Documentation Truth Sync

- [x] 2.1 Update stale status text in `docs/superpowers/specs/2026-03-24-local-backend-handler-first-design.md`
- [x] 2.2 Refresh `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md` so pending items reflect current `main`
- [x] 2.3 Reframe unresolved `detect_changes` host checks in `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md` as either completed or explicitly deferred research

## 3. Residual Artifact Disposition

- [x] 3.1 Inventory tracked files under the legacy `.sisyphus/` and `tmp_exports/` staging directories
- [x] 3.2 Decide which tracked artifacts are durable docs, which should move to `docs/archive/`, and which should stop being tracked
- [x] 3.3 Apply the chosen disposition and update `.gitignore` so the old staging locations stay untracked in future

## 4. Web Logging Cleanup

- [x] 4.1 Remove or gate unconditional logs in `gitnexus-web/src/workers/ingestion.worker.ts`
- [x] 4.2 Reduce broad prompt/stream debug logging in `gitnexus-web/src/core/llm/agent.ts`
- [x] 4.3 Narrow query-failure diagnostics in `gitnexus-web/src/core/ingestion/import-processor.ts` so they avoid broad content dumps by default
- [x] 4.4 Run targeted verification for the touched web files

## 5. Dependency Debt Registry

- [x] 5.1 Record the deprecated `kuzu` / `kuzu-wasm` dependency line as explicit technical debt in repository docs
- [x] 5.2 Note the deprecated transitive chain (`tar`, `npmlog`, `gauge`, `are-we-there-yet`, `boolean`) and the current expected mitigation path

## 6. Upstream Convergence Planning

- [x] 6.1 Document the current divergence baseline from `upstream/main`
- [x] 6.2 Write the preferred convergence rule: align to latest local merged doc direction before replaying to `upstream/main`
- [x] 6.3 Define the next operator step for upstream convergence review without attempting the full integration in this change

## 7. Validation

- [x] 7.1 Re-run repository status and confirm the repo-hygiene scope only contains intended files, with unrelated pre-existing worktree changes called out separately
- [x] 7.2 Validate the OpenSpec change artifacts
- [x] 7.3 Confirm the audit findings and repair tasks remain consistent with current git history
