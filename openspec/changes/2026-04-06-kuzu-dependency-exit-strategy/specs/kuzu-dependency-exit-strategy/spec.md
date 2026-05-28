# kuzu-dependency-exit-strategy Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep explicit exit criteria for deprecated Kuzu dependency tracks

GitNexus SHALL keep explicit exit criteria for the deprecated CLI `kuzu` and
web `kuzu-wasm` dependency tracks rather than leaving the repository at
"reviewed and pinned" with no reopen rule.

#### Scenario: An operator evaluates whether the current pins should stay in place

- **WHEN** an operator reviews the current `kuzu` or `kuzu-wasm` tracked
  exception
- **THEN** the repository provides track-specific exit criteria
- **AND** the operator can determine whether the correct action is to keep
  pinning, replace the dependency, or reopen upgrade work

### Requirement: GitNexus SHALL treat alternate Kuzu wasm packages as reviewed candidates, not assumed successors

GitNexus SHALL not assume that a differently named wasm package is the intended
replacement for `kuzu-wasm` unless that package has been explicitly reviewed
against the repository's needs and maintenance signals.

#### Scenario: An operator notices `@kuzu/kuzu-wasm` while the current wasm line is deprecated

- **WHEN** the operator evaluates `@kuzu/kuzu-wasm` as a possible successor
- **THEN** the repository records it as an explicitly reviewed candidate
- **AND** it is not treated as a safe drop-in successor by name alone

### Requirement: GitNexus SHALL preserve Claude Code and Codex support during any future CLI Kuzu migration

GitNexus SHALL preserve both Claude Code and Codex support during any future
CLI-side `kuzu` migration work.

#### Scenario: A future change proposes to replace or unpin the CLI Kuzu dependency line

- **WHEN** the future change modifies the CLI-side Kuzu dependency path
- **THEN** the change keeps both Claude Code and Codex workflows in scope
- **AND** verification includes the current dual-CLI host-adapter and doctor
  coverage before the migration is accepted
