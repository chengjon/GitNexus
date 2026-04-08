## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for the setup/context convergence slice
- [x] 1.2 Record the setup-help and repo-local context scope

## 2. Setup Help Coverage

- [x] 2.1 Add a failing integration test for `gitnexus setup --help`
- [x] 2.2 Run the targeted integration test and confirm it fails before implementation
- [x] 2.3 Update the setup command description to include Codex
- [x] 2.4 Re-run the targeted integration test and confirm it passes

## 3. Repo-Local Context Sync

- [x] 3.1 Refresh `gitnexus/AGENTS.md` and `gitnexus/CLAUDE.md` from the current GitNexus context generator
- [x] 3.2 Keep the repo-local skill copies aligned with explicit `repo` and worktree `cwd` guidance
- [x] 3.3 Confirm only the expected repo-local skill copies changed

## 4. Validation

- [x] 4.1 Validate the new OpenSpec change
- [x] 4.2 Re-run scoped repository status for the setup/context slice
