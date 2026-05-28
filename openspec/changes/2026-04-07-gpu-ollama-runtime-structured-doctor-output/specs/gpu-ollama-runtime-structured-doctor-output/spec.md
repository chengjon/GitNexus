# gpu-ollama-runtime-structured-doctor-output Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL emit structured gpu-ollama-runtime data in doctor JSON

GitNexus SHALL expose machine-readable Ollama GPU runtime data alongside the
existing human-readable `gpu-ollama-runtime` detail string.

#### Scenario: A caller requests doctor JSON and Ollama reports GPU offload

- **WHEN** `runGpuDoctorChecks()` queries `/api/ps` after a successful embed probe and finds the target model with `size_vram > 0`
- **THEN** the `gpu-ollama-runtime` check includes structured `data`
- **AND** the data identifies the model and `sizeVram`
- **AND** the data marks `queryAttempted` and `queryOk` as `true`

#### Scenario: A caller requests doctor JSON and Ollama falls back to CPU

- **WHEN** `runGpuDoctorChecks()` queries `/api/ps` after a successful embed probe and finds the target model with `size_vram = 0`
- **THEN** the `gpu-ollama-runtime` check includes structured `data`
- **AND** the data identifies the model and `sizeVram`
- **AND** the data marks `queryAttempted` and `queryOk` as `true`
