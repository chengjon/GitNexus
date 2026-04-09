## Design

This slice extends `DoctorCheck.data` to `gpu-fix` results.

- `detail` remains the operator-facing summary
- `data` captures `appliedFixes` and `manualFollowUps` as separate arrays

This keeps GPU fix-summary diagnostics machine readable without altering fix
execution behavior.
