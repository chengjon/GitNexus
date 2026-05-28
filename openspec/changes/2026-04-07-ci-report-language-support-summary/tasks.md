## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for the PR report language-support summary slice
- [x] 1.2 Bound the slice to artifact persistence and PR report rendering

## 2. Test-First Coverage

- [x] 2.1 Add focused workflow regression assertions for the new artifact
- [x] 2.2 Add focused workflow regression assertions for summary rendering
- [x] 2.3 Run the targeted test and confirm it fails before implementation

## 3. Summary Persistence And Rendering

- [x] 3.1 Persist `language-support-summary.md` from `ci.yml`
- [x] 3.2 Upload `language-support-report` as a dedicated artifact
- [x] 3.3 Download `language-support-report` in `ci-report.yml`
- [x] 3.4 Render the summary inside the PR sticky report when present
- [x] 3.5 Re-run the targeted workflow regression and confirm it passes

## 4. Validation

- [x] 4.1 Record the residual and repair in a dedicated audit note
- [x] 4.2 Validate the new OpenSpec change
- [x] 4.3 Update the technical-debt roadmap with the new convergence status
- [x] 4.4 Re-run scoped tests and change detection for final review
