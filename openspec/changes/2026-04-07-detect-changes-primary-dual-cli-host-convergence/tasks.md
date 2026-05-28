## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for primary dual-CLI host convergence
- [x] 1.2 Bound the slice to docs-only governance updates

## 2. Inputs

- [x] 2.1 Re-read the current Codex empirical evidence and Claude Code live-probe record
- [x] 2.2 Confirm the current machine has no directly callable Cursor CLI
- [x] 2.3 Re-read the current worktree review and roadmap wording

## 3. Governance Writeback

- [x] 3.1 Record the dual-CLI convergence in a dedicated audit note
- [x] 3.2 Update the host-compatibility baseline audit to reflect the closed primary support surface
- [x] 3.3 Update the Claude Code probe audit to move Cursor into optional external follow-up
- [x] 3.4 Update the worktree review and roadmap so Cursor no longer appears as blocking debt

## 4. Finalization

- [x] 4.1 Validate the new OpenSpec change
- [x] 4.2 Re-run scoped change detection for final review

## 5. Final Verification Notes

- `openspec validate 2026-04-07-detect-changes-primary-dual-cli-host-convergence`
  returned `Change '2026-04-07-detect-changes-primary-dual-cli-host-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  returned `risk_level=low`, `changed_files=74`, `changed_symbols=0`,
  `affected_processes=0`, `path_resolution=cwd_worktree`,
  `fallback_reason=null`
