# Repository Development Rules

These rules apply to the entire repository: code, docs, scripts, tests, migrations, fixtures, and cleanup work.

These rules are hard constraints for design, implementation, review, and deletion decisions. Any change that violates them is a merge blocker unless the exception is explicitly documented in the same change and justified as temporary.

## 1. Single Source of Truth and No Duplicate Layers

- Each production behavior MUST have one canonical implementation, one canonical entry point, and one canonical contract.
- New work MUST extend, replace, or simplify the canonical path. It MUST NOT introduce a mirror implementation, shadow API, or parallel workflow for the same behavior.
- Duplicate layers are prohibited unless they are explicitly temporary migration scaffolding with a documented owner, scope, and exit condition.
- `Canonical Path:` in PR governance notes MUST identify exactly one stable path. Listing multiple candidate paths is treated as unresolved ownership, not an acceptable source of truth declaration.
- In this repository's PR governance notes, `Canonical Path:` MUST be written as exactly one stable repo-relative path such as `gitnexus/src/router.ts`, not as a role description or abstract component name.
- When a PR touches a compatibility layer, shim, wrapper, `*_new.*`, or `*_v2.*` path, `Canonical Path:` MUST identify the stable replacement path rather than the temporary layer itself.
- When a PR touches a temporary migration/debug script or debug entry point, `Canonical Path:` MUST identify the stable product path rather than the temporary script or temporary entry point itself.
- Docs, scripts, tests, diagnostics, and metrics MUST point at the same canonical path. If they describe different paths, the migration is not complete.
- Renaming a layer without removing the old authority does not create a new source of truth. If two paths can both be treated as current, the repository still has duplication debt.

## 2. Compatibility Layers, Shims, and `*_new` Files

- Compatibility layers, shims, wrappers, `*_new.*`, `*_v2.*`, dual-entry modules, and temporary adapters MUST be treated as migration-only scaffolding.
- Any such layer MUST document all of the following in the same change:
  - what canonical path it is replacing or protecting
  - why direct cutover is unsafe right now
  - the condition that allows removal
  - the expected cleanup trigger, milestone, or follow-up task
- `Compatibility Layer / Shim:` in PR governance notes MUST name the actual repo-relative shim, compat, `*_new.*`, or `*_v2.*` path under change, such as `gitnexus/src/router_new.ts`. A generic description or basename without the path is insufficient.
- `Direct Cutover Risk:` in PR governance notes MUST explain why direct cutover is unsafe right now for that compatibility layer. Placeholder text such as `TBD`, `later`, `unknown`, or "keep for safety" is not sufficient.
- `Exit Condition:` for a compatibility layer MUST describe a concrete retirement trigger. Placeholder text such as `TBD`, `later`, `follow-up cleanup`, or "keep for safety" is not sufficient.
- If a compatibility layer still remains after the change, `Cleanup Tracking:` in PR governance notes MUST name the cleanup milestone, issue, or follow-up task that removes it. Concrete anchors such as `GNX-123`, `milestone 4`, or `issue 27` are acceptable. Placeholder text such as `TBD`, `later`, `N/A`, or "same PR" is not sufficient.
- Temporary naming MUST NOT become long-lived architecture. Files and modules must eventually be renamed back to stable domain names once the migration completes.
- A shim MUST NOT accumulate new business logic. If behavior evolves, the canonical path must absorb that behavior and the shim must stay thin or be removed.
- Newly added compatibility-like files in managed paths MUST declare `CANONICAL PATH:`, `DIRECT CUTOVER RISK:`, `EXIT CONDITION:`, and `CLEANUP TRACKING:` in the file body so retirement intent is inspectable in code review.
- In those file-body markers, `CANONICAL PATH:` MUST point at exactly one stable repo-relative path such as `gitnexus/src/router.ts`, `DIRECT CUTOVER RISK:` MUST explain the concrete blocker for direct cutover, `EXIT CONDITION:` MUST describe a concrete retirement trigger, and `CLEANUP TRACKING:` MUST name the cleanup milestone, issue, or follow-up task rather than placeholder text.
- Once all real consumers have moved, the compatibility layer and the retired path MUST be deleted promptly. "Keep both for safety" is not an acceptable steady state.

## 3. Migration Completion Definition and Exit Criteria

- A migration is complete only when all of the following are true:
  - the new path is the default and only supported production path
  - no production caller still depends on the old path
  - tests, fixtures, scripts, docs, CI, and operator instructions point to the new path
  - dual-write, dual-read, fallback, and shim behavior is removed unless intentionally permanent and explicitly documented
  - validation against the expected baseline is complete and recorded
- "Code landed" is not migration complete.
- If any old path remains reachable, the work MUST be labeled as in progress, partial, or transitional. It MUST NOT be presented as finished migration work.
- In PR governance notes for migration or path-retirement work, `Migration Status:` MUST start with `transitional`, `partial`, `complete`, or `N/A`. If an old path, active shim, or active temporary migration/backfill/cutover script still remains after the change, `Migration Status:` MUST NOT claim `complete`.
- Migration cleanup is part of the feature, not optional follow-up polish.

## 4. Deletion Gate: Code Path and Feature Tree Validation

- Code MUST NOT be deleted only because it looks unused.
- Before deleting a path, the author MUST verify that it is not reachable from the current feature tree through:
  - runtime entry points
  - CLI commands, APIs, routes, or handlers
  - configuration, flags, or environment-driven branches
  - scripts, automation, or operator workflows
  - tests or fixtures that intentionally preserve contract behavior
- For shared or unclear modules, the deletion review MUST include both graph-aware analysis and direct reference inspection before removal.
- In this repository, use GitNexus path/context/impact analysis plus text search when the reachability of a path is not obvious.
- In PR governance notes, `Deletion Reachability:` MUST explicitly cover feature-tree reachability, runtime, scripts or automation, config or environment branches, and tests or fixtures. A generic statement such as "no remaining references" is insufficient.
- PRs that delete managed-path files MUST record the GitNexus evidence used for that deletion decision.
- That deletion evidence MUST cite at least one concrete GitNexus tool call or `gitnexus://repo/...` resource, so reviewers can inspect the exact graph-aware basis for the deletion.
- That deletion evidence MUST also name the retired managed path or the canonical replacement path as a repo-relative path such as `gitnexus/src/router.ts`, so the cited GitNexus proof is unambiguous for the exact cutover under review.
- A rename or move that retires an old managed path counts as path deletion for review purposes and MUST satisfy the same reachability and GitNexus-evidence requirements.
- A fallback path, recovery path, migration bridge, or contract-preserving fixture is not dead code until the successor path is verified and all intended consumers are updated.

## 5. Metrics Semantics: Measured, Inferred, and Historical Baseline

- Every metric claim MUST be labeled as exactly one of:
  - `Measured`: directly observed in the current run, benchmark, test, or experiment
  - `Inferred`: estimated, extrapolated, or derived from partial evidence
  - `Historical Baseline`: prior measured data used for comparison
- Reports, PR descriptions, docs, and dashboards MUST keep these categories separate.
- `N/A` may be used only when no measured, inferred, or historical-baseline claim is being made for that section. `N/A` MUST NOT be filled together with any of those three categories.
- Inferred values MUST NOT be presented as measured results.
- Historical baselines MUST NOT be described as current state.
- Claims about performance, coverage, scale, impact, reliability, cost, or adoption MUST include source scope and time context unless that context is already explicit in the surrounding artifact.
- In this repository's PR governance notes, any non-empty `Measured:`, `Inferred:`, or `Historical Baseline:` claim that is not simply `none` or `N/A` MUST include explicit `scope:` and `time:` fragments in the same line so reviewers can distinguish claim source from claim value without inference.
- When comparing current behavior to history, the text MUST make clear which numbers are current observations and which numbers are reference baselines.

## 6. Mechanical Splits, Temporary Entrypoints, and Backup File Hygiene

- Mechanical file splits do not count as architectural improvement by themselves. A split is only justified if it improves ownership boundaries, call-path clarity, testability, or change safety.
- Temporary entry points, debug entry points, and migration-only scripts MUST carry an explicit removal condition or tracked follow-up.
- If a temporary migration or debug script still remains after the change, PR governance notes MUST keep `Exit Condition:` on the concrete retirement trigger and `Cleanup Tracking:` on the milestone, issue, or follow-up task that removes it.
- In this repository, `Cleanup Tracking:` should include a concrete tracking anchor such as `GNX-123`, `milestone 4`, or `issue 27` so the cleanup owner and removal trigger are reviewable without inference.
- Newly added temporary migration or debug scripts in managed script paths MUST declare `CANONICAL PATH:`, `PURPOSE:`, `CLEANUP TRACKING:`, and `EXIT CONDITION:` in the file body so reviewers can verify the script's stable product path, specific purpose, tracked cleanup path, and retirement intent without guessing from the filename alone.
- In this repository, temporary-script `CANONICAL PATH:` metadata MUST also be written as exactly one stable repo-relative path such as `gitnexus/src/router.ts`, not as an abstract role description.
- Source-controlled backup copies and placeholder variants in production paths are prohibited. This includes names such as `*_bak.*`, `*_backup.*`, `copy*`, `old_*`, `temp_*`, and `tmp_*` unless they are clearly documented fixtures, samples, or generated test assets.
- `*_new.*` files are not treated as generic backup artifacts. If they exist at all, they are governed by the compatibility-layer rules above and must remain explicitly temporary with inspectable retirement metadata.
- Git history, patch files, design docs, and migration notes are the approved ways to preserve rollback context. Long-lived code copies are not.
- One-off migration helpers or debug tools MUST live in intentional locations, be named for their exact purpose, and be deleted after use unless they are promoted to supported tooling with ownership and documentation. Generic names such as `debug.mjs`, `migration.sh`, or `cutover.py` are not specific enough in managed script paths.
- In this repository, developer-facing markdown entrypoints in the repository root or first-level `docs/`, `eval/`, and `gitnexus/` directories MUST reference `DEVELOPMENT_RULES.md` so contributors can reach the governing policy from the entrypoint they actually started with.

## 7. Review Checklist

Before merging any change that adds, migrates, deprecates, or deletes behavior, verify all of the following:

- the canonical path is identified
- no undeclared duplicate implementation or authority was introduced
- every temporary layer has a documented exit condition
- every deletion passed reachability and feature-tree review
- every metric statement is labeled as measured, inferred, or historical baseline
- no stray temporary entry points or backup files remain in the changed scope

## 8. Automation Hooks

- CI quality checks enforce temporary and backup-style filename hygiene for managed repository paths.
- CI quality checks also enforce that developer-facing markdown entrypoints in the repository root or first-level `docs/`, `eval/`, and `gitnexus/` directories reference `DEVELOPMENT_RULES.md`, except for explicit exemptions such as `CHANGELOG.md` and the rules file itself.
- Pull request governance checks enforce retention of explicit PR governance fields for canonical path, compatibility-layer exit conditions, deletion reachability, and metric classification.
- Automation is a backstop, not the whole policy. Passing checks does not waive the review obligations above.
