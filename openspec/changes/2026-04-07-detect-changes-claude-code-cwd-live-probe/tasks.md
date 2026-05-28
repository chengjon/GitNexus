## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for the Claude Code cwd live-probe slice
- [x] 1.2 Bound the slice to docs-only probe recording and review updates

## 2. Live Probe

- [x] 2.1 Run a Claude Code probe from the repository directory
- [x] 2.2 Run the same Claude Code probe from a temporary git worktree
- [x] 2.3 Confirm the raw server log recorded only `scope`, not `cwd`

## 3. Review Update

- [x] 3.1 Record the Claude Code live-probe result in a dedicated audit note
- [x] 3.2 Update the worktree review so Claude Code no longer remains under generic unverified host debt

## 4. Governance Record

- [x] 4.1 Register the probe result in roadmap / governance docs

## 5. Finalization

- [x] 5.1 Validate the new OpenSpec change
- [x] 5.2 Re-run scoped change detection for final review

## 6. Final Verification Notes

- `openspec validate 2026-04-07-detect-changes-claude-code-cwd-live-probe`
  returned `Change '2026-04-07-detect-changes-claude-code-cwd-live-probe' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  returned `risk_level=low`, `changed_files=74`, `changed_symbols=0`,
  `affected_processes=0`, `path_resolution=cwd_worktree`,
  `fallback_reason=null`
