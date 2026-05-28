## Why

`doctor --json` still emits repo-state checks mostly as prose even though the
doctor path already knows the requested path, the resolved repo root, and
whether the repository is indexed.

This shared doctor contract needs to stay machine readable regardless of
whether the operator reaches it via Claude Code or Codex.

## What Changes

- Add structured `data` to `git-repo` checks
- Add structured `data` to `repo-indexed` checks
- Reuse the existing repo-root and index-state results
- Keep the current detail strings unchanged
- Add focused regression coverage for git / non-git and indexed / non-indexed paths
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `repo-state-structured-doctor-output`: Keep shared repo-state diagnostics
  machine readable for dual-CLI doctor flows.

### Modified Capabilities

- None.

## Impact

- Affected runtime code:
  - `gitnexus/src/cli/doctor.ts`
- Affected tests:
  - `gitnexus/test/unit/doctor.test.ts`
- Affected docs:
  - `docs/audits/2026-04-07-repo-state-structured-doctor-output.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
