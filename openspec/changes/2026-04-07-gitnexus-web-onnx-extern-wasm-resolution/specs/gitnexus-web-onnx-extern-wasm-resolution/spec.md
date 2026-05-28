# gitnexus-web-onnx-extern-wasm-resolution Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep Vite app and inline builds aligned on the ONNX external-wasm resolution path

GitNexus SHALL keep `gitnexus-web` app and inline Vite builds aligned on the
`onnxruntime-web-use-extern-wasm` resolution condition so both build entrypoints
select the same ONNX runtime distribution strategy.

#### Scenario: A maintainer reviews Vite config parity

- **WHEN** `vite.config.ts` and `vite.inline.config.mjs` are inspected
- **THEN** both configs declare `onnxruntime-web-use-extern-wasm` in their
  `resolve.conditions`
- **AND** neither config silently relies on the default `onnxruntime-web`
  bundle entry

### Requirement: GitNexus SHALL keep ONNX resolution convergence auditable

GitNexus SHALL keep ONNX resolution convergence auditable so future build
cleanup can distinguish proven external-wasm alignment from unverified guesses
about the remaining worker ONNX chunk size.

#### Scenario: A maintainer validates the ONNX resolution slice

- **WHEN** the ONNX external-wasm resolution slice is validated
- **THEN** a regression test asserts the shared Vite resolve condition
- **AND** `npm run build` passes
- **AND** the audit trail records whether `worker-onnx-*` changed materially
