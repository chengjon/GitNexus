## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for stale-Ralph design
      body-boundary sync
- [x] 1.2 Bound the slice to the historical design doc, audit note, and
      OpenSpec record

## 2. Truth Source

- [x] 2.1 Re-read the current status note in the 2026-04-12 design doc
- [x] 2.2 Re-read the `Recommended Command` and `Recommendation` entry points
- [x] 2.3 Reconfirm the stale-Ralph implementation audit for completion-history boundaries
- [x] 2.4 Reconfirm the stale-Ralph upstream replay note for replay-history boundaries

## 3. Boundary Sync

- [x] 3.1 Add an explicit historical-design note before the preserved design body
- [x] 3.2 Add an explicit note before `Recommended Command` clarifying proposed-surface scope
- [x] 3.3 Add an explicit note before `Recommendation` clarifying historical rollout posture
- [x] 3.4 Keep the original 2026-04-12 design text intact
- [x] 3.5 Record the boundary sync in a dedicated audit note and OpenSpec docs

## 4. Finalization

- [x] 4.1 Validate the new OpenSpec change
- [x] 4.2 Re-run scoped change detection for final review

## 5. Final Verification Notes

- `openspec validate 2026-04-15-omx-stale-ralph-design-body-boundary-sync`
  returned `Change '2026-04-15-omx-stale-ralph-design-body-boundary-sync' is valid`
- `gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  returned `risk_level=low`, `changed_files=5`, `changed_count=0`,
  `affected_count=0`, `git_repo_path=/opt/claude/GitNexus`,
  `git_diff_path=/opt/claude/GitNexus`, `process_cwd=/opt/claude/GitNexus`,
  `path_resolution=cwd_worktree`, `fallback_reason=null`
- interpretation:
  the staged review stayed within the expected stale-Ralph design boundary sync
  slice, no code processes were affected, and the user's unrelated unstaged
  test change stayed out of scope
