# registry-entry-structured-doctor-output Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL emit structured registry-entry data in doctor JSON

GitNexus SHALL expose machine-readable registry entry data alongside the
existing human-readable `registry-entry` detail string.

#### Scenario: A caller requests doctor JSON for a repo with a matching registry entry

- **WHEN** `runDoctor()` evaluates the global registry for the current repo
- **THEN** the corresponding `registry-entry` check includes structured `data`
- **AND** the data identifies the evaluated repo path and the matched entry metadata

#### Scenario: A caller requests doctor JSON for a repo without a matching registry entry

- **WHEN** `runDoctor()` does not find a matching registry entry for the current repo
- **THEN** the corresponding `registry-entry` check still includes structured `data`
- **AND** the data marks `matched` as `false`
- **AND** the `entry` value is `null`
