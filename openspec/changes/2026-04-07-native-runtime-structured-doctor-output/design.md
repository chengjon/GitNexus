## Design

This slice applies the additive `DoctorCheck.data` pattern to `native-runtime`.

- `detail` remains the operator-facing summary
- `data` is the exact `NativeRuntimeSnapshot`
- tests exercise the default snapshot path rather than an injected stub

This keeps the change narrow and avoids any runtime behavior changes.
