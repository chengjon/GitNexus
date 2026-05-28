## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for latest upstream shared-doc replay
      baseline status sync
- [x] 1.2 Bound the slice to audits, roadmap update, and OpenSpec record

## 2. Truth Source

- [x] 2.1 Fetch the latest `upstream/main`
- [x] 2.2 Recompute the divergence count
- [x] 2.3 Reconfirm the shared hotspot file set
- [x] 2.4 Re-read the earlier 2026-04-06 upstream baseline and replay-review
      records

## 3. Status Sync

- [x] 3.1 Add latest-status pointers to the historical 2026-04-06 reports
- [x] 3.2 Write the 2026-04-08 upstream replay status-sync audit
- [x] 3.3 Update the remediation roadmap with the refreshed baseline
- [x] 3.4 Keep the slice review-only; do not replay new upstream wording here

## 4. Finalization

- [x] 4.1 Validate the new OpenSpec change
- [x] 4.2 Re-run scoped change detection for final review

## 5. Final Verification Notes

- `openspec validate 2026-04-08-upstream-shared-doc-replay-status-sync`
  returned `Change '2026-04-08-upstream-shared-doc-replay-status-sync' is valid`
- `git rev-list --left-right --count upstream/main...HEAD`
  returned `285 209`
- `git diff --name-only upstream/main -- README.md AGENTS.md CLAUDE.md gitnexus/README.md`
  returned `AGENTS.md`, `CLAUDE.md`, `README.md`, `gitnexus/README.md`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  returned `risk_level=critical`, `changed_files=112`, `changed_count=272`,
  `affected_count=56`, `git_repo_path=/opt/claude/GitNexus`,
  `git_diff_path=/opt/claude/GitNexus`, `process_cwd=/opt/claude/GitNexus`,
  `path_resolution=cwd_worktree`, `fallback_reason=null`
- interpretation:
  the current worktree-wide scope review is dominated by unrelated pre-existing
  code and doc changes elsewhere in the repository; this upstream baseline
  status-sync slice itself remains documentation-only
