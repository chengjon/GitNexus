# file-classification Specification Delta

## ADDED Requirements

### Requirement: detect_changes SHALL classify changed files by type

The `detect_changes` MCP tool SHALL classify every changed file path using
regex-based rules and include `changed_file_classes` in the response.

#### Scenario: detect_changes returns file class counts for mixed changes

- **WHEN** a changeset includes `src/app.ts`, `src/app.test.ts`, and `tsconfig.json`
- **THEN** `changed_file_classes` includes `source: 1`, `test: 1`, `config: 1`

### Requirement: detect_changes SHALL support forbidden_file_classes parameter

The `detect_changes` tool SHALL accept `forbidden_file_classes` (array of FileClass).
When provided, the response SHALL include a warning if any changed files match.

#### Scenario: Agent passes forbidden_file_classes and a governance file changed

- **WHEN** `forbidden_file_classes: ["governance"]` is provided
- **AND** a changed file matches `openspec/**`
- **THEN** the response includes a warning about governance file changes

### Requirement: detect_changes SHALL apply repo-specific classification overrides

The `detect_changes` tool SHALL load repo-local classification overrides from
`.gitnexus/config.json` under `fileClassification.rules`. Each rule SHALL
contain a regex `pattern` and `classes`. When an override rule matches a changed
path, the override classes SHALL take precedence over default classification
rules for that path.

#### Scenario: Repo override reclassifies a source file as governance

- **GIVEN** `.gitnexus/config.json` contains `fileClassification.rules` with
  `pattern: "^src/auth\\.ts$"` and `classes: ["governance"]`
- **WHEN** `detect_changes` sees `src/auth.ts` changed
- **THEN** `changed_file_classes` includes `governance: 1`
- **AND** `changed_file_classes` does not include `source` for that file
- **AND** `forbidden_file_classes: ["governance"]` reports `src/auth.ts` as a violation
