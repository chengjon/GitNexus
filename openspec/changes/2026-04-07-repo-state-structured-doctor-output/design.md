## Design

This slice extends `DoctorCheck.data` to the shared repo-state checks.

- `git-repo.data` captures the requested path, resolved repo path, and git-repo verdict
- `repo-indexed.data` captures the repo path, index presence, and computed index path
- `detail` remains the operator-facing summary

This keeps repo-state diagnostics machine readable without altering existing
repo detection or indexing behavior.
