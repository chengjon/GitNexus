## Why

Full `gitnexus analyze` takes 60-125 seconds and re-scans the entire repo
every time, even when only a handful of SCSS files changed. For repeated
staged micro-commits, this is heavier than necessary.

Source: `/opt/claude/mystocks_spec/docs/reports/tasks/2026-06-02-gitnexus-usage-feedback.md`

## What Changes

- Add `--staged-only` flag: only index files in `git diff --cached --name-only`
- Add `--changed-only` flag: only index files changed vs HEAD
- Add `--files <path...>` flag: only index specified file paths
- Cache the large-file skip scan result to avoid reprinting it every run
- Return a short "index already current for requested files" when applicable

## Capabilities

### New Capabilities

- `incremental-analyze`: Supports scoped re-indexing for staged, changed, or
  explicitly listed files instead of requiring full repo re-scan.

### Modified Capabilities

- `analyze`: Accepts new flags for scoped analysis. Existing behavior
  unchanged when no flags are provided.

## Impact

- Affected modules:
  - `gitnexus/src/cli/commands/analyze.ts`
  - `gitnexus/src/core/analyzer.ts`
  - `gitnexus/src/core/file-discovery.ts` or equivalent
- Risk: LOW — additive flags, no existing behavior change
