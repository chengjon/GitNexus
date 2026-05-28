## Design

This slice extends `DoctorCheck.data` to `registry-entry` results.

- `detail` remains the operator-facing summary
- `data` captures the evaluated repo path, whether a registry match was found,
  and the matched entry metadata when present

This keeps doctor registry diagnostics machine readable without altering the
existing registry lookup behavior.
