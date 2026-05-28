## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for structured language-support doctor output
- [x] 1.2 Bound the slice to additive JSON structure plus reporter fallback compatibility

## 2. Test-First Coverage

- [x] 2.1 Add focused doctor regression coverage for structured `language-support` data
- [x] 2.2 Add focused reporter regression coverage for preferring `data`
- [x] 2.3 Run the targeted tests and confirm they fail before implementation

## 3. Structured Output Convergence

- [x] 3.1 Extend `DoctorCheck` with optional `data`
- [x] 3.2 Emit structured language-support rows from `runDoctor()`
- [x] 3.3 Make the reporter prefer `data` and preserve legacy fallback
- [x] 3.4 Re-run the focused tests and confirm they pass
- [x] 3.5 Re-run `npm run build` and confirm the additive contract compiles cleanly

## 4. Validation

- [x] 4.1 Record the residual and repair in a dedicated audit note
- [x] 4.2 Validate the new OpenSpec change
- [x] 4.3 Update the technical-debt roadmap with the new convergence status
- [x] 4.4 Re-run scoped tests and change detection for final review
