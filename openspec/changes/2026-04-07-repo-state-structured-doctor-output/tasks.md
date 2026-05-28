## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for structured repo-state doctor output
- [x] 1.2 Bound the slice to `git-repo` / `repo-indexed` transport only

## 2. Test-First Coverage

- [x] 2.1 Add focused doctor regression coverage for structured git-repo pass data
- [x] 2.2 Add focused doctor regression coverage for structured repo-indexed pass/fail data
- [x] 2.3 Add focused doctor regression coverage for structured git-repo fail data
- [x] 2.4 Run the focused test and confirm it fails before implementation

## 3. Structured Output Convergence

- [x] 3.1 Add structured `data` to `git-repo` checks
- [x] 3.2 Add structured `data` to `repo-indexed` checks
- [x] 3.3 Reuse existing repo-root and index-state results
- [x] 3.4 Re-run focused tests and confirm they pass
- [x] 3.5 Re-run `npm run build` and confirm the additive contract compiles cleanly

## 4. Validation

- [x] 4.1 Record the residual and repair in a dedicated audit note
- [x] 4.2 Validate the new OpenSpec change
- [x] 4.3 Update the technical-debt roadmap with the new convergence status
- [x] 4.4 Re-run scoped tests and change detection for final review
