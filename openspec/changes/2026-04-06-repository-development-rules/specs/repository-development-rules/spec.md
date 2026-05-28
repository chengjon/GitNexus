# repository-development-rules Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL provide one canonical repository development rules document with durable entrypoints

GitNexus SHALL keep repository-wide development governance in one canonical root
document and surface it through both human and AI entrypoints.

#### Scenario: A contributor starts work from repository entry docs

- **WHEN** a contributor reads `README.md`, `AGENTS.md`, `CLAUDE.md`,
  `gitnexus/AGENTS.md`, or `gitnexus/CLAUDE.md`
- **THEN** those entrypoints direct the contributor to `DEVELOPMENT_RULES.md`
  as the repository governance source of truth

#### Scenario: GitNexus refreshes generated context

- **WHEN** `gitnexus refresh-context` regenerates the GitNexus marker block
- **THEN** repository-governance preambles outside the marker block remain
  intact

### Requirement: GitNexus SHALL validate repository governance structure for managed paths and pull requests

GitNexus SHALL provide automated governance validation for managed repository
paths and pull-request governance structure.

#### Scenario: A managed path introduces a backup-style filename

- **WHEN** a managed repository path introduces a backup-style or stray
  temporary filename
- **THEN** the repository governance path check fails

#### Scenario: A new compatibility-like file is added without retirement metadata

- **WHEN** a newly added compatibility-like file in a managed path omits
  `CANONICAL PATH:` or `EXIT CONDITION:`
- **THEN** repository governance validation fails

#### Scenario: A pull request deletes or retires a managed path without explicit governance evidence

- **WHEN** a pull request body omits required governance structure, deletion
  reachability coverage, or GitNexus evidence for a managed-path deletion or
  rename-based retirement
- **THEN** PR governance validation fails
