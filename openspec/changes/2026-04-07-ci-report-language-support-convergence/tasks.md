## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for the PR report language-support convergence slice
- [x] 1.2 Bound the slice to PR report consumption, not doctor or CI producer changes

## 2. Test-First Coverage

- [x] 2.1 Add a focused workflow regression test for `language_support_result`
- [x] 2.2 Run the targeted test and confirm it fails before implementation

## 3. PR Report Convergence

- [x] 3.1 Read `language_support_result` in `ci-report.yml`
- [x] 3.2 Pass the result into the report build step as `LANG_SUPPORT`
- [x] 3.3 Add the `Language Support` row to the PR report table
- [x] 3.4 Include `LANG_SUPPORT` in the report overall success condition
- [x] 3.5 Rename the same status carrier to `LANG_SUPPORT` in `ci.yml` shell steps while keeping `language_support_result` as the persisted artifact field
- [x] 3.6 Re-run the targeted test and confirm it passes

## 4. Validation

- [x] 4.1 Record the residual and repair in a dedicated audit note
- [x] 4.2 Validate the new OpenSpec change
- [x] 4.3 Update the technical-debt roadmap with the residual-fix status
- [x] 4.4 Re-run scoped change detection for final review
