## Design

This slice extends `DoctorCheck.data` to `gpu-container-runtime` results.

- `detail` remains the operator-facing summary
- `data` captures the probe command, whether it was attempted, whether it succeeded, exit metadata, output summary, and skipped state

This keeps container GPU runtime diagnostics machine readable without altering
the existing probe or skip behavior.
