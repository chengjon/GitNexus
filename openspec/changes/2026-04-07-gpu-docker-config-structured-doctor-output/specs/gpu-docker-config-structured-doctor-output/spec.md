# gpu-docker-config-structured-doctor-output Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL emit structured gpu-docker-config data in doctor JSON

GitNexus SHALL expose machine-readable Docker GPU config data alongside the
existing human-readable `gpu-docker-config` detail string.

#### Scenario: A caller requests doctor JSON and the Ollama container exists with healthy GPU config

- **WHEN** `runGpuDoctorChecks()` successfully inspects the Ollama container and the required GPU config is present
- **THEN** the `gpu-docker-config` check includes structured `data`
- **AND** the data marks `dockerPresent` and `inspectOk` as `true`
- **AND** the data includes an empty `missingConfig`

#### Scenario: A caller requests doctor JSON and no Ollama container exists

- **WHEN** `runGpuDoctorChecks()` does not find a Docker container named `ollama`
- **THEN** the `gpu-docker-config` check includes structured `data`
- **AND** the data marks `dockerPresent` as `false`
- **AND** the data marks `skipped` as `true`
