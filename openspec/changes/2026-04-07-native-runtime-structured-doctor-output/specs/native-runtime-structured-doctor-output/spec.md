# native-runtime-structured-doctor-output Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL emit structured native runtime data in doctor JSON

GitNexus SHALL expose the native runtime snapshot as machine-readable `data`
alongside the existing human-readable `native-runtime` detail string.

#### Scenario: A caller requests doctor JSON for a repository

- **WHEN** the default `native-runtime` check is emitted
- **THEN** the check includes `data` containing the native runtime snapshot
- **AND** it still includes the existing detail summary
