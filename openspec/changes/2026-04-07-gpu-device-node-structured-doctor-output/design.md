## Design

This slice extends `DoctorCheck.data` to `gpu-device-node` results.

- `detail` remains the operator-facing summary
- `data` captures the current platform, the checked Linux device-node paths,
  the currently visible nodes, and whether the check was skipped

This keeps GPU device-node diagnostics machine readable without altering the
existing GPU detection behavior.
