## Summary

<!-- Describe the user-facing or architecture-facing change. -->

## Development Rules Check

- [ ] I reviewed `DEVELOPMENT_RULES.md` and this PR follows it.
- [ ] I identified the stable canonical path or source of truth touched by this PR as exactly one repo-relative path, and I did not name a shim, compat, `*_new.*`, or `*_v2.*` path as canonical.
- [ ] I did not introduce an undeclared duplicate implementation, shadow entry point, or long-lived compatibility layer.
- [ ] Any temporary shim, compatibility layer, migration bridge, or temporary entry point in this PR has a documented exit condition, lives in a managed `scripts/` path when it is a one-off script, and uses an exact-purpose name rather than a generic `debug`/`migration`/`cutover` filename.
- [ ] If this PR is still mid-migration or keeps an old path/shim active, I marked the migration as transitional or partial instead of complete.
- [ ] Any deletion or rename-based path retirement in this PR was checked for runtime reachability, feature-tree reachability, scripts/automation reachability, config/env reachability, tests/fixtures contract preservation, and recorded GitNexus evidence with at least one concrete GitNexus tool call or `gitnexus://repo/...` resource that names the retired path or canonical replacement path.
- [ ] Any metric or benchmark claim in this PR is labeled clearly as measured, inferred, or historical baseline, and any real claim records explicit `scope:` and `time:` context.
- [ ] Any mechanical split in this PR has a concrete benefit for ownership boundaries, call-path clarity, testability, or change safety; it is not justified as churn by itself.
- [ ] This PR does not leave backup files or other stray temporary artifacts in production paths, and any `*_new.*` path is treated as a documented temporary compatibility layer with a clear exit condition.
- [ ] Any developer-facing markdown entrypoint I changed in the repository root or first-level `docs/`, `eval/`, or `gitnexus/` directories still points readers to `DEVELOPMENT_RULES.md`.

## Governance Notes

- Canonical Path:
<!-- Name exactly one stable canonical path as a repo-relative path, for example `gitnexus/src/router.ts`. Do not put shim, compat, *_new.*, or *_v2.* paths here. Do not put a temporary script or debug entry point here either. -->
- Compatibility Layer / Shim:
<!-- Name the actual repo-relative shim, compat, *_new.*, or *_v2.* path under change, for example `gitnexus/src/router_new.ts`. -->
- Direct Cutover Risk:
<!-- For compatibility layers, explain why direct cutover is unsafe right now. Do not write TBD, later, unknown, or keep for safety. -->
- Exit Condition:
<!-- State the concrete retirement trigger for the compatibility path or any remaining temporary layer or script. Do not write TBD, later, follow-up cleanup, or keep for safety. -->
- Migration Status:
<!-- Use transitional, partial, complete, or N/A. If any old path, shim, or temporary migration/backfill/cutover script remains active, use transitional or partial instead of complete. -->
- Cleanup Tracking:
<!-- If a temporary layer or script still remains after this PR, name the cleanup milestone, issue, or follow-up task that removes it, for example `GNX-123`, `milestone 4`, or `issue 27`. One-off temporary scripts should live in a managed `scripts/` path, not under a product source path. -->
- Deletion Reachability:
<!-- Required for managed-path deletions and rename/move-based path retirement. Use explicit dimensions such as: feature-tree: ...; runtime: ...; scripts: ...; config: ...; tests: ... -->
- GitNexus Evidence:
<!-- Cite concrete GitNexus proof such as gitnexus_impact(...), gitnexus_context(...), gitnexus_query(...), gitnexus_detect_changes(...), or gitnexus://repo/... and name the retired path or canonical replacement path as a repo-relative path, for example `gitnexus/src/router.ts`. -->
- N/A:

## Metrics Claims

- Measured:
- Inferred:
- Historical Baseline:
- N/A:
<!-- For any real metric claim, include `scope:` and `time:` in the same line, for example `scope: local MCP startup benchmark on mini repo; time: 2026-04-07 current run; value: ...`. Only fill this when all three metric categories are empty. Do not mix N/A with measured, inferred, or historical baseline claims. -->

## Validation

<!-- List the commands, tests, benchmarks, or manual checks you ran. -->

## Notes

<!-- Add migration risk, cleanup follow-up, reviewer focus areas, or why a mechanical split improves ownership boundaries, call-path clarity, testability, or change safety. -->
