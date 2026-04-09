## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for structured host-config doctor output
- [x] 1.2 Bound the slice to evaluated host-config checks

## 2. Test-First Coverage

- [x] 2.1 Add focused doctor regression coverage for Codex manual-path host-config data
- [x] 2.2 Add focused doctor regression coverage for Codex configured-path host-config data
- [x] 2.3 Add focused doctor regression coverage for Claude Code configured-path host-config data
- [x] 2.4 Run the focused test and confirm it fails before implementation

## 3. Structured Output Convergence

- [x] 3.1 Add structured `data` to evaluated host-config checks
- [x] 3.2 Reuse existing detection/configured/manual booleans
- [x] 3.3 Re-run focused tests and confirm they pass
- [x] 3.4 Re-run `npm run build` and confirm the additive contract compiles cleanly

## 4. Validation

- [x] 4.1 Record the residual and repair in a dedicated audit note
- [x] 4.2 Validate the new OpenSpec change
- [x] 4.3 Update the technical-debt roadmap with the new convergence status
- [x] 4.4 Re-run scoped tests and change detection for final review
