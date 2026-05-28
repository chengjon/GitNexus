# repo-state-structured-doctor-output Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL emit structured git-repo data in doctor JSON

GitNexus SHALL expose machine-readable git-repo state alongside the existing
human-readable `git-repo` detail string.

#### Scenario: A caller requests doctor JSON for a git repository path

- **WHEN** `runDoctor()` resolves the requested path to a git repository
- **THEN** the `git-repo` check includes structured `data`
- **AND** the data identifies the requested path and resolved repo path

#### Scenario: A caller requests doctor JSON for a non-git path

- **WHEN** `runDoctor()` determines the requested path is not a git repository
- **THEN** the `git-repo` check includes structured `data`
- **AND** the data marks `isGitRepo` as `false`
- **AND** the `repoPath` value is `null`

### Requirement: GitNexus SHALL emit structured repo-indexed data in doctor JSON

GitNexus SHALL expose machine-readable index state alongside the existing
human-readable `repo-indexed` detail string.

#### Scenario: A caller requests doctor JSON for an indexed repository

- **WHEN** `runDoctor()` determines the current repo already has an index
- **THEN** the `repo-indexed` check includes structured `data`
- **AND** the data marks `indexed` as `true`

#### Scenario: A caller requests doctor JSON for a repository without an index

- **WHEN** `runDoctor()` determines the current repo is not indexed
- **THEN** the `repo-indexed` check includes structured `data`
- **AND** the data marks `indexed` as `false`
- **AND** the data includes the computed index path
