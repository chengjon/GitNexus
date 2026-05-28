## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for `gitnexus-refactoring` skill rename taxonomy convergence
- [x] 1.2 Bound the slice to the two refactoring skill-doc surfaces, audit, roadmap update, and OpenSpec record

## 2. Truth Source

- [x] 2.1 Re-read the current source refactoring skill wording
- [x] 2.2 Re-read the current package refactoring skill wording
- [x] 2.3 Reconfirm the current rename taxonomy uses `graph` / `text_search`

## 3. Skill-Doc Convergence

- [x] 3.1 Replace stale `ast_search` wording with `text_search`
- [x] 3.2 Keep all rename examples aligned with the current taxonomy
- [x] 3.3 Keep source skill and package skill wording aligned
- [x] 3.4 Record the convergence in a dedicated audit note and roadmap update

## 4. Finalization

- [x] 4.1 Validate the new OpenSpec change
- [x] 4.2 Re-run scoped change detection for final review

## 5. Final Verification Notes

- `openspec validate 2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence`
  returned `Change '2026-04-08-gitnexus-refactoring-skill-rename-taxonomy-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  returned `risk_level=critical`, `changed_files=110`, `changed_count=271`,
  `affected_count=56`, `path_resolution=cwd_worktree`, `fallback_reason=null`
- interpretation:
  the current worktree-wide scope review is dominated by unrelated pre-existing
  code and doc changes elsewhere in the repository; this convergence slice
  itself remains documentation-only
