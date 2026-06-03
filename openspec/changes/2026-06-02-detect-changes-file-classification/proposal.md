## Why

`detect_changes` reports changed files and symbols but does not classify what
category those files belong to. Project governance rules like "no router
change", "no API contract change", "no frontend API client change" require
manual mapping from file paths to categories.

Source: `/opt/claude/mystocks_spec/docs/reports/tasks/2026-06-02-gitnexus-usage-feedback.md`

## What Changes

- Add a `changed_file_classes` field to `detect_changes` output
- Classify each changed file into: `style`, `docs`, `governance`, `source`,
  `api_contract`, `router`, `test`, `config`, `build`, `other`
- Classification rules are configurable per repo via `.gitnexus/config.json`
- Support `forbidden_file_classes` parameter: if any changed file falls in
  a forbidden class, add a warning to the output

## Capabilities

### Modified Capabilities

- `detect_changes`: Reports file classification summary, enabling automated
  governance gates based on file category.

## Impact

- Affected modules:
  - `gitnexus/src/mcp/tools/detect-changes.ts`
  - `gitnexus/src/core/file-classifier.ts` (new)
  - `gitnexus/src/config/` (classification rules)
- Risk: LOW — additive output field, no existing behavior change
