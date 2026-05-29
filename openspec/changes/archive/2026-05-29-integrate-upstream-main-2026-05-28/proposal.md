## Why

The local `main` branch has diverged far from upstream GitNexus.

Current verified baseline after fetching on 2026-05-28:

- local `main`: `2a22063c`
- `origin/main`: `b18af757`
- `upstream/main`: `50715e38`
- merge base: `3dbe08fa`
- local-only commits from merge base: 376
- upstream-only commits from merge base: 797
- overlapping files: 91
- simulated unmerged paths from `git merge-tree --write-tree main upstream/main`: 85

The upstream side contains the current core-engine architecture, including
scope-based resolution, lbug storage changes, broader language support, web UI
updates, and dependency updates. The local side is dominated by governance,
documentation, OpenSpec records, and maintainer workflow rules. A direct merge
or rebase would force high-risk conflict resolution across core engine files
that upstream has structurally replaced.

## What Changes

- Create and use an isolated `upstream-sync` branch based on current
  `upstream/main`
- Restore the local OpenSpec/governance layer onto the upstream baseline
- Keep upstream as authoritative for core engine, parser, ingestion,
  resolution, storage, web runtime, and release dependency changes
- Apply one minimal upstream validation fix for hook binary override resolution
  where the upstream test contract already required ENOENT `lsof` fail-open
  behavior
- Keep local governance documents authoritative where they describe local fork
  operating rules and maintainer workflows
- Treat local source-code-only additions as a later capability audit, not as
  automatic first-pass replay material
- Validate the resulting integration branch before any push or replacement of
  `origin/main`

## Capabilities

### New Capabilities

- `upstream-main-integration`: Maintain a governed integration path that brings
  current upstream GitNexus into the local fork while preserving the local
  governance layer and separating source capability replay into a follow-up
  decision pass.

### Modified Capabilities

- Hook DB owner guard validation: explicit `GITNEXUS_HOOK_LSOF_PATH` and
  `GITNEXUS_HOOK_PS_PATH` overrides are treated as authoritative paths, so a
  missing override path produces the intended ENOENT fail-open behavior instead
  of silently falling back to the host binary.

## Impact

- Affected branch:
  - `upstream-sync`
  - `origin/main` after explicit final cutover approval
- Affected governance paths:
  - `openspec/**`
  - `AGENTS.md`
  - `CLAUDE.md`
  - `DEVELOPMENT_RULES.md`
  - `.github/PULL_REQUEST_TEMPLATE.md`
  - local `docs/**` governance and audit records
  - local `.claude/skills/**` GitNexus skill records
- Affected source policy:
  - upstream wins by default for core engine and runtime source files
  - local source additions require separate follow-up comparison before replay
  - source changes in this line are limited to the hook binary override fix in
    `gitnexus/hooks/claude/hook-db-lock-probe.cjs` and
    `gitnexus-claude-plugin/hooks/hook-db-lock-probe.cjs`
- Non-goals:
  - no direct push to `origin/main` before staging review, final validation, and
    explicit cutover approval
  - no unguarded forced replacement of local history; final replacement requires
    a backup ref and `--force-with-lease`
  - no blanket replay of the 67 local source-code-only files in this change
  - no hidden compatibility promise for local source features that are not
    revalidated on the upstream architecture
