## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for secondary entrypoint host-framing convergence
- [x] 1.2 Bound the slice to the quick-start guide, eval README, audit, roadmap update, and OpenSpec record

## 2. Truth Source

- [x] 2.1 Re-read the current quick-start guide
- [x] 2.2 Re-read the current eval README
- [x] 2.3 Re-read the shared README host-framing convergence
- [x] 2.4 Reconfirm the dual-CLI primary support conclusion

## 3. Secondary Entrypoint Convergence

- [x] 3.1 Add explicit primary-vs-optional framing to the quick-start guide
- [x] 3.2 Preserve optional host setup examples without deleting them
- [x] 3.3 Rewrite the eval README host analogy into neutral hook-style wording
- [x] 3.4 Record the convergence in a dedicated audit note and roadmap update

## 4. Finalization

- [x] 4.1 Validate the new OpenSpec change
- [x] 4.2 Re-run scoped change detection for final review

## 5. Final Verification Notes

- `openspec validate 2026-04-08-secondary-entrypoint-host-framing-convergence`
  returned `Change '2026-04-08-secondary-entrypoint-host-framing-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  returned `risk_level=critical`, `changed_files=106`, `changed_count=268`,
  `affected_count=54`, `path_resolution=cwd_worktree`, `fallback_reason=null`
- interpretation:
  the current worktree-wide scope review is dominated by unrelated pre-existing
  code changes elsewhere in the repository; this convergence slice itself
  remains documentation-only
