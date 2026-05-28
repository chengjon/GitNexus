## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for PR review skill guidance convergence
- [x] 1.2 Bound the slice to skill docs and one focused test

## 2. Test-First Coverage

- [x] 2.1 Add focused regression coverage for explicit `repo` guidance
- [x] 2.2 Add focused regression coverage for explicit `cwd` guidance
- [x] 2.3 Run the focused test and confirm it fails before implementation

## 3. Skill Guidance Convergence

- [x] 3.1 Update the source skill to the current `repo` / `cwd` contract
- [x] 3.2 Update the checked-in installed skill copy to the same contract
- [x] 3.3 Re-run focused tests and confirm they pass
- [x] 3.4 Re-run `npm run build` and confirm the bounded change remains clean

## 4. Validation

- [x] 4.1 Record the residual and repair in a dedicated audit note
- [x] 4.2 Validate the new OpenSpec change
- [x] 4.3 Update the technical-debt roadmap with the new convergence status
- [x] 4.4 Re-run scoped tests and change detection for final review
