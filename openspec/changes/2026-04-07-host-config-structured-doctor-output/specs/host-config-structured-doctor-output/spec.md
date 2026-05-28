# host-config-structured-doctor-output Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL emit structured host-config data in doctor JSON

GitNexus SHALL expose machine-readable host evaluation data alongside the
existing human-readable `host-config` detail string.

#### Scenario: A caller requests doctor JSON for a supported host

- **WHEN** `runDoctor()` evaluates a host plan
- **THEN** the corresponding `host-config` check includes structured `data`
- **AND** the data identifies the host and its detection/configuration state
