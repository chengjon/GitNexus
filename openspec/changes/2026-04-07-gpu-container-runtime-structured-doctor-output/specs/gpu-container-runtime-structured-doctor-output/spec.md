# gpu-container-runtime-structured-doctor-output Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL emit structured gpu-container-runtime data in doctor JSON

GitNexus SHALL expose machine-readable container GPU runtime data alongside the
existing human-readable `gpu-container-runtime` detail string.

#### Scenario: A caller requests doctor JSON and the container runtime probe succeeds

- **WHEN** `runGpuDoctorChecks()` successfully runs the container `nvidia-smi` probe
- **THEN** the `gpu-container-runtime` check includes structured `data`
- **AND** the data marks `attempted` and `ok` as `true`
- **AND** the data includes the summarized probe output

#### Scenario: A caller requests doctor JSON and no Ollama container exists

- **WHEN** `runGpuDoctorChecks()` does not find a Docker container named `ollama`
- **THEN** the `gpu-container-runtime` check includes structured `data`
- **AND** the data marks `attempted` as `false`
- **AND** the data marks `skipped` as `true`
