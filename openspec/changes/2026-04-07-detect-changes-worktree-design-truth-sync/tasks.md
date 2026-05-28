## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for the detect_changes worktree design truth-sync slice
- [x] 1.2 Bound the slice to design/review documentation only

## 2. Source-Of-Truth Review

- [x] 2.1 Re-read the current handler and git helper behavior
- [x] 2.2 Re-read the focused unit / integration / review evidence

## 3. Design And Review Sync

- [x] 3.1 Sync the worktree design doc to the implemented `cwd` contract
- [x] 3.2 Clarify git command semantics and metadata / fallback boundaries
- [x] 3.3 Narrow the review doc so only external host compatibility research remains open

## 4. Governance Record

- [x] 4.1 Record the residual and repair in a dedicated audit note
- [x] 4.2 Update the technical-debt roadmap with the truth-sync result

## 5. Finalization

- [x] 5.1 Validate the new OpenSpec change
- [x] 5.2 Re-run scoped change detection for final review

## 6. Final Verification Notes

- `openspec validate 2026-04-07-detect-changes-worktree-design-truth-sync`
  returned `Change '2026-04-07-detect-changes-worktree-design-truth-sync' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  returned `risk_level=low`, `changed_files=68`, `changed_symbols=0`,
  `affected_processes=0`, `path_resolution=cwd_worktree`,
  `fallback_reason=null`
