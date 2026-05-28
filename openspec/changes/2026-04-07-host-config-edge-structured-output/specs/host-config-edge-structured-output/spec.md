# host-config-edge-structured-output Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL emit structured host-config edge state in doctor JSON

GitNexus SHALL expose machine-readable `host-config` edge-state diagnostics
alongside the existing human-readable detail string.

#### Scenario: A caller requests an unknown host

- **WHEN** `runDoctor()` receives a `host` option that does not match any known host plan
- **THEN** the corresponding `host-config` check includes structured `data`
- **AND** the data identifies the originally requested host, that host evaluation was skipped, and that the reason code is `unknown-host`

#### Scenario: A caller does not request host checks

- **WHEN** `runDoctor()` resolves no host plans because no host was requested
- **THEN** the corresponding `host-config` check includes structured `data`
- **AND** the data identifies that host evaluation was skipped and that the reason code is `no-host-requested`
