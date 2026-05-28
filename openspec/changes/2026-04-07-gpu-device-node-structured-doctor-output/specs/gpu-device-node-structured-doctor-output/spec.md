# gpu-device-node-structured-doctor-output Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL emit structured gpu-device-node data in doctor JSON

GitNexus SHALL expose machine-readable GPU device-node data alongside the
existing human-readable `gpu-device-node` detail string.

#### Scenario: A caller requests doctor JSON on Linux and GPU device nodes are visible

- **WHEN** `runGpuDoctorChecks()` checks Linux GPU device-node paths and finds visible nodes
- **THEN** the `gpu-device-node` check includes structured `data`
- **AND** the data identifies the checked paths and visible nodes
- **AND** the data marks `skipped` as `false`

#### Scenario: A caller requests doctor JSON on Linux and no GPU device nodes are visible

- **WHEN** `runGpuDoctorChecks()` checks Linux GPU device-node paths and finds no visible nodes
- **THEN** the `gpu-device-node` check includes structured `data`
- **AND** the data identifies the checked paths and an empty visible-node list
- **AND** the data marks `skipped` as `false`
