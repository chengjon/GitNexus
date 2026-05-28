## Design

This slice extends `DoctorCheck.data` to `gpu-host-runtime` results.

- `detail` remains the operator-facing summary
- `data` captures the command name, success flag, exit metadata, and summarized output

This keeps GPU host-runtime diagnostics machine readable without altering the
existing `nvidia-smi` probe behavior.
