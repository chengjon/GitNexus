## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for README MCP prompt-host boundary convergence
- [x] 1.2 Bound the slice to the root README wording, audit, roadmap update, and OpenSpec record

## 2. Truth Source

- [x] 2.1 Re-read the current root README prompt section
- [x] 2.2 Reconfirm the dual-CLI primary support conclusion
- [x] 2.3 Reconfirm the shared README host-framing conclusion
- [x] 2.4 Reconfirm the host-specific prompt-example conclusion

## 3. README Prompt Boundary Convergence

- [x] 3.1 Add an explicit host-boundary note to the Claude Code prompt example
- [x] 3.2 Preserve Codex as a primary maintained CLI surface
- [x] 3.3 Avoid inventing equivalent prompt syntax claims for other hosts
- [x] 3.4 Record the convergence in a dedicated audit note and roadmap update

## 4. Finalization

- [x] 4.1 Validate the new OpenSpec change
- [x] 4.2 Re-run scoped change detection for final review

## 5. Final Verification Notes

- `openspec validate 2026-04-08-readme-mcp-prompt-host-boundary-convergence`
  returned `Change '2026-04-08-readme-mcp-prompt-host-boundary-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  returned `risk_level=critical`, `changed_files=106`, `changed_count=268`,
  `affected_count=54`, `path_resolution=cwd_worktree`, `fallback_reason=null`
- interpretation:
  the current worktree-wide scope review is dominated by unrelated pre-existing
  code changes elsewhere in the repository; this convergence slice itself
  remains documentation-only
