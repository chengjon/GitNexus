## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for stale-Ralph upstream-replay
      body-boundary sync
- [x] 1.2 Bound the slice to the historical replay note, audits index,
      audit note, and OpenSpec record

## 2. Truth Source

- [x] 2.1 Re-read the current purpose line in the 2026-04-12 replay note
- [x] 2.2 Re-read the `Upstream Source Replay Status` and `Replay Strategy` entry points
- [x] 2.3 Reconfirm the stale-Ralph implementation audit for context boundaries
- [x] 2.4 Reconfirm the audits index wording for entrypoint scope

## 3. Boundary Sync

- [x] 3.1 Add an explicit historical-replay note before the preserved replay-note body
- [x] 3.2 Add an explicit note before `Upstream Source Replay Status` clarifying publication-snapshot scope
- [x] 3.3 Add an explicit note before `Replay Strategy` clarifying historical replay-guidance scope
- [x] 3.4 Keep the original 2026-04-12 replay-note text intact
- [x] 3.5 Record the boundary sync in a dedicated audit note and audits entrypoint update

## 4. Finalization

- [x] 4.1 Validate the new OpenSpec change
- [x] 4.2 Re-run scoped change detection for final review

## 5. Final Verification Notes

- `openspec validate 2026-04-15-omx-stale-ralph-upstream-replay-body-boundary-sync`
  returned `Change '2026-04-15-omx-stale-ralph-upstream-replay-body-boundary-sync' is valid`
- `gitnexus_detect_changes({scope: "staged", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  returned `risk_level=low`, `changed_files=6`, `changed_count=1`,
  `affected_count=0`, `git_repo_path=/opt/claude/GitNexus`,
  `git_diff_path=/opt/claude/GitNexus`, `process_cwd=/opt/claude/GitNexus`,
  `path_resolution=cwd_worktree`, `fallback_reason=null`
- interpretation:
  the staged review stayed within the expected stale-Ralph upstream-replay
  boundary sync slice. GitNexus indexed the audits entrypoint as the only
  changed symbol, no code processes were affected, and the user's unrelated
  unstaged test change stayed out of scope
