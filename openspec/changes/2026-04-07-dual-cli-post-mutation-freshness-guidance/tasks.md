## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for dual-CLI post-mutation freshness guidance
- [x] 1.2 Bound the slice to shared guidance and tests only

## 2. Test-First Coverage

- [x] 2.1 Add focused AI-context regression coverage for Claude Code automatic freshness wording
- [x] 2.2 Add focused AI-context regression coverage for Codex manual freshness wording
- [x] 2.3 Run the focused test and confirm it fails before implementation

## 3. Shared Guidance Convergence

- [x] 3.1 Keep the existing Claude Code PostToolUse note
- [x] 3.2 Add the Codex manual-rerun note
- [x] 3.3 Re-run focused tests and confirm they pass
- [x] 3.4 Re-run `npm run build` and confirm the additive change compiles cleanly

## 4. Validation

- [x] 4.1 Record the residual and repair in a dedicated audit note
- [x] 4.2 Validate the new OpenSpec change
- [x] 4.3 Update the technical-debt roadmap with the new convergence status
- [x] 4.4 Re-run scoped tests and change detection for final review
