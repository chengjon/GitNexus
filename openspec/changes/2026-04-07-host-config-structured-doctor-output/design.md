## Design

This slice extends `DoctorCheck.data` to `host-config` results that correspond
to evaluated host plans.

- `detail` remains the operator-facing summary
- `data` captures host id, display name, detection result, configured result,
  manual-setup requirement, and detection reason

This keeps Claude Code and Codex diagnostics machine readable without altering
their existing setup behavior.
