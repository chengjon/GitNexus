## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for shared README dual-CLI
      integration-depth convergence
- [x] 1.2 Bound the slice to README wording, audit, roadmap update, and
      OpenSpec record

## 2. Truth Source

- [x] 2.1 Re-read the current root README host-support wording
- [x] 2.2 Re-read the current package README host-support wording
- [x] 2.3 Re-read the earlier shared-README dual-CLI framing conclusion
- [x] 2.4 Re-read the quick-start dual-CLI label-parity conclusion
- [x] 2.5 Reconfirm the roadmap already treats `Claude Code + Codex` as the
      primary maintained pair

## 3. README Wording Convergence

- [x] 3.1 Rename the support-profile column to integration wording
- [x] 3.2 Replace `Full` / `full support` wording with explicit integration
      labels
- [x] 3.3 Add a note that Codex remains part of the primary maintained CLI
      surface
- [x] 3.4 Keep command examples intact
- [x] 3.5 Record the convergence in a dedicated audit note and roadmap update

## 4. Finalization

- [x] 4.1 Validate the new OpenSpec change
- [x] 4.2 Re-run scoped change detection for final review

## 5. Final Verification Notes

- `openspec validate 2026-04-08-readme-dual-cli-integration-depth-convergence`
  returned `Change '2026-04-08-readme-dual-cli-integration-depth-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  returned `risk_level=critical`, `changed_files=112`, `changed_count=272`,
  `affected_count=56`, `git_repo_path=/opt/claude/GitNexus`,
  `git_diff_path=/opt/claude/GitNexus`, `process_cwd=/opt/claude/GitNexus`,
  `path_resolution=cwd_worktree`, `fallback_reason=null`
- interpretation:
  the current worktree-wide scope review is dominated by unrelated pre-existing
  code and doc changes elsewhere in the repository; this convergence slice
  itself remains documentation-only
