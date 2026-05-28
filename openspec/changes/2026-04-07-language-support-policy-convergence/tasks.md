## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for language-support policy convergence
- [x] 1.2 Bound the slice to runtime/CI policy ownership and compiled reporter execution

## 2. Test-First Coverage

- [x] 2.1 Add a focused workflow regression assertion for the compiled reporter path
- [x] 2.2 Add a focused runtime regression assertion for the exported language-support policy
- [x] 2.3 Run the targeted tests and confirm they fail before implementation

## 3. Policy And Reporter Convergence

- [x] 3.1 Export shared language-support policy from `language-registry.ts`
- [x] 3.2 Move reporter implementation into `src/ci/language-support-report.ts`
- [x] 3.3 Keep `scripts/ci/language-support-report.mjs` as a thin compatibility shim
- [x] 3.4 Switch `ci.yml` to execute `dist/ci/language-support-report.js`
- [x] 3.5 Re-run the focused tests and confirm they pass
- [x] 3.6 Re-run `npm run build` and confirm the compiled reporter emits cleanly

## 4. Validation

- [x] 4.1 Record the residual and repair in a dedicated audit note
- [x] 4.2 Validate the new OpenSpec change
- [x] 4.3 Update the technical-debt roadmap with the new convergence status
- [x] 4.4 Re-run scoped tests and change detection for final review
