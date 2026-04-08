## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for the dual-CLI doctor guidance slice
- [x] 1.2 Record the scoped doctor/test change

## 2. Test-First Coverage

- [x] 2.1 Add a failing Codex doctor test for explicit worktree/cwd guidance
- [x] 2.2 Add a failing Claude Code doctor test for explicit worktree/cwd guidance
- [x] 2.3 Run the targeted doctor tests and confirm they fail before implementation

## 3. Doctor Guidance Implementation

- [x] 3.1 Add a host-specific guidance check for Codex and Claude Code
- [x] 3.2 Keep the new guidance scoped to targeted host inspections
- [x] 3.3 Fix option-only `doctorCommand()` parsing for Commander invocations without a positional path
- [x] 3.4 Re-run the targeted doctor tests and confirm they pass

## 4. Validation

- [x] 4.1 Validate the new OpenSpec change
- [x] 4.2 Re-run scoped repository status for the doctor guidance slice
