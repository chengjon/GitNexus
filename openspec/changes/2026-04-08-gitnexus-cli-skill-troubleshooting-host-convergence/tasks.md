## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for `gitnexus-cli` skill troubleshooting host convergence
- [x] 1.2 Bound the slice to the two skill-doc surfaces, audit, roadmap update, and OpenSpec record

## 2. Truth Source

- [x] 2.1 Re-read the current source skill troubleshooting wording
- [x] 2.2 Re-read the current package skill troubleshooting wording
- [x] 2.3 Reconfirm the prior dual-cli freshness convergence conclusion
- [x] 2.4 Reconfirm the quick-start dual-cli host wording

## 3. Skill-Doc Convergence

- [x] 3.1 Remove the stale single-host troubleshooting wording
- [x] 3.2 Replace it with host-neutral reconnect guidance
- [x] 3.3 Keep source skill and package skill wording aligned
- [x] 3.4 Record the convergence in a dedicated audit note and roadmap update

## 4. Finalization

- [x] 4.1 Validate the new OpenSpec change
- [x] 4.2 Re-run scoped change detection for final review

## 5. Final Verification Notes

- `openspec validate 2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence`
  returned `Change '2026-04-08-gitnexus-cli-skill-troubleshooting-host-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  returned `risk_level=critical`, `changed_files=107`, `changed_count=269`,
  `affected_count=56`, `path_resolution=cwd_worktree`, `fallback_reason=null`
- interpretation:
  the current worktree-wide scope review is dominated by unrelated pre-existing
  code and doc changes elsewhere in the repository; this convergence slice
  itself remains documentation-only
