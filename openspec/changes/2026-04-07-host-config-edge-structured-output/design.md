## Design

This slice extends `DoctorCheck.data` to the two `host-config` early-return
results.

- `detail` remains the operator-facing summary
- `data` captures the originally requested host value, whether host evaluation
  was skipped, the currently matched host list, and a stable reason code

This keeps the `host-config` transport consistent without altering the existing
host resolution behavior.
