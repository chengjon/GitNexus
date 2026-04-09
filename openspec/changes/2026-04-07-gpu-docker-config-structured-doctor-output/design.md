## Design

This slice extends `DoctorCheck.data` to `gpu-docker-config` results.

- `detail` remains the operator-facing summary
- `data` captures container presence, inspect status, runtime/config fields, missing config items, and skip state

This keeps Docker GPU config diagnostics machine readable without altering the
existing inspect or fix behavior.
