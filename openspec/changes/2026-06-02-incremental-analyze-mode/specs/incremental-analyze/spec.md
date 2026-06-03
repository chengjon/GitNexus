# incremental-analyze Specification Delta

## ADDED Requirements

### Requirement: analyze SHALL support --staged-only, --changed-only, and --files flags

`gitnexus analyze` SHALL accept `--staged-only` (only git-staged files),
`--changed-only` (only files changed vs HEAD), and `--files <path...>` (explicit paths).
The pipeline SHALL skip files not in the resolved set.

#### Scenario: User runs analyze --staged-only with 3 staged files

- **WHEN** the user runs `gitnexus analyze --staged-only`
- **AND** `git diff --cached --name-only` returns 3 files
- **THEN** the pipeline only scans and parses those 3 files

#### Scenario: User runs analyze --changed-only after a commit

- **WHEN** the user runs `gitnexus analyze --changed-only`
- **AND** `git diff --name-only HEAD` returns 5 files
- **THEN** the pipeline only scans and parses those 5 files

#### Scenario: User runs analyze --files with explicit paths

- **WHEN** the user runs `gitnexus analyze --files src/app.ts src/util.ts`
- **THEN** the pipeline only scans and parses those 2 files
