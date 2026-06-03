## Why

Every `gitnexus analyze` prints `optional grammar "tree-sitter-proto" is unavailable`
even when the changed file set contains no `.proto` files. This is noisy and
irrelevant for most workflows (SCSS, TypeScript, Python, etc.).

Source: `/opt/claude/mystocks_spec/docs/reports/tasks/2026-06-02-gitnexus-usage-feedback.md`

## What Changes

- Track which optional grammars have been reported per session/repo
- Only show optional grammar warnings once per repo session
- Suppress completely when no files of that type exist in the repo or changed set
- Add `--verbose` to show all grammar warnings

## Capabilities

### Modified Capabilities

- `analyze`: Optional grammar warnings are suppressed unless relevant or
  explicitly requested via `--verbose`.

## Impact

- Affected modules:
  - `gitnexus/src/core/analyzer.ts` or grammar detection module
- Risk: LOW — output-only change
