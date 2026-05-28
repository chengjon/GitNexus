# gpu-fix-structured-doctor-output Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL emit structured gpu-fix data in doctor JSON

GitNexus SHALL expose machine-readable GPU fix-summary data alongside the
existing human-readable `gpu-fix` detail string.

#### Scenario: A caller requests GPU doctor with automatic fixes and a safe fix is applied

- **WHEN** `runGpuDoctorChecks()` applies a safe automatic fix
- **THEN** the `gpu-fix` check includes structured `data`
- **AND** the data includes the applied fix in `appliedFixes`
- **AND** the data exposes manual follow-ups separately
