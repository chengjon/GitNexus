## Design

This slice extends `DoctorCheck.data` to `host-detect-changes-guidance` results.

- `detail` remains the operator-facing summary
- `data` captures the host id, target command, `repo`/`cwd` parameter recommendations, and a host-specific reason code

This keeps dual-CLI detect-changes guidance machine readable without altering
the existing guidance text.
