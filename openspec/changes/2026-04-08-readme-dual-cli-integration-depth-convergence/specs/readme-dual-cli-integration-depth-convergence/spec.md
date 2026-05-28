# readme-dual-cli-integration-depth-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL describe shared README dual-CLI differences as integration-depth differences within one primary support surface

GitNexus SHALL keep `README.md` and `gitnexus/README.md` aligned with the
repository's primary maintained CLI surface of `Claude Code + Codex` while
describing host differences as integration-depth or automation differences
rather than a support-tier split.

#### Scenario: A maintainer reads the shared README support matrix and manual setup sections

- **WHEN** they read the root or package README support table and manual setup
  sections
- **THEN** both documents continue to treat `Claude Code + Codex` as the
  primary maintained CLI pair
- **AND** the finer-grained labels describe current integration depth,
  automation, or setup shape
- **AND** the wording does not imply that `Codex` falls outside the primary
  maintained CLI support surface
