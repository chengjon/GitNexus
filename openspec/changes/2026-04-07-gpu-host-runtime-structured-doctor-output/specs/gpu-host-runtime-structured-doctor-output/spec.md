# gpu-host-runtime-structured-doctor-output Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL emit structured gpu-host-runtime data in doctor JSON

GitNexus SHALL expose machine-readable host GPU runtime data alongside the
existing human-readable `gpu-host-runtime` detail string.

#### Scenario: A caller requests doctor JSON and the host `nvidia-smi` probe succeeds

- **WHEN** `runGpuDoctorChecks()` runs `nvidia-smi` successfully
- **THEN** the `gpu-host-runtime` check includes structured `data`
- **AND** the data marks `ok` as `true`
- **AND** the data includes the summarized command output

#### Scenario: A caller requests doctor JSON and `nvidia-smi` is unavailable

- **WHEN** `runGpuDoctorChecks()` cannot find `nvidia-smi`
- **THEN** the `gpu-host-runtime` check includes structured `data`
- **AND** the data marks `ok` as `false`
- **AND** the data includes `errorCode = ENOENT`
