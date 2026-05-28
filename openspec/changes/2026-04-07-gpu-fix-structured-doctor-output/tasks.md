## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for structured gpu-fix output
- [x] 1.2 Bound the slice to `gpu-fix` transport only

## 2. Test-First Coverage

- [x] 2.1 Add focused doctor regression coverage for successful gpu-fix data
- [x] 2.2 Run the focused test and confirm it fails before implementation

## 3. Structured Output Convergence

- [x] 3.1 Add structured `data` to `gpu-fix` checks
- [x] 3.2 Reuse existing fix-action and manual-action arrays
- [x] 3.3 Re-run focused tests and confirm they pass
- [x] 3.4 Re-run `npm run build` and confirm the additive contract compiles cleanly

## 4. Validation

- [x] 4.1 Record the residual and repair in a dedicated audit note
- [x] 4.2 Validate the new OpenSpec change
- [x] 4.3 Update the technical-debt roadmap with the new convergence status
- [x] 4.4 Re-run scoped tests and change detection for final review
