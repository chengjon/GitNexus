## Design

This slice extends `DoctorCheck.data` to `gpu-ollama-runtime` results.

- `detail` remains the operator-facing summary
- `data` captures provider, probe status, query status, model, `size_vram`, skip state, and branch reason

This keeps Ollama GPU runtime diagnostics machine readable without altering the
existing probe/query behavior.
