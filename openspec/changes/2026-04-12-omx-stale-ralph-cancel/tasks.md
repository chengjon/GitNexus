## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for stale Ralph cleanup command
- [x] 1.2 Bound the slice to command design, implementation evidence, and
  upstream replay guidance

## 2. Design Record

- [x] 2.1 Record the recommended command as `omx cancel ralph --stale`
- [x] 2.2 Record stale-detection safety rules and refusal cases

## 3. Planning Record

- [x] 3.1 Write an implementation plan for the command
- [x] 3.2 Record execution-time verification expectations

## 4. Implementation Evidence

- [x] 4.1 Record the locally installed OMX package files modified for the fix
- [x] 4.2 Record the focused compiled test evidence
- [x] 4.3 Record live workspace command and stop-hook verification evidence

## 5. Upstream Replay Guidance

- [x] 5.1 Add a note describing how to replay the verified local fix into the
  canonical `oh-my-codex` source repository

## 6. Finalization

- [x] 6.1 Validate the new OpenSpec change
- [x] 6.2 Re-run scoped change detection for final review

## 7. Final Verification Notes

- `openspec validate 2026-04-12-omx-stale-ralph-cancel`
  returned `Change '2026-04-12-omx-stale-ralph-cancel' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  returned `risk_level=low`, `changed_files=1`, `changed_symbols=2`,
  `affected_processes=0`, `path_resolution=cwd_worktree`,
  `fallback_reason=null`
- scoped `git status --short` still shows the new docs / OpenSpec files as
  untracked repository records, while the only tracked code diff remains the
  pre-existing local test change
