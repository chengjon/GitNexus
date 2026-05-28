## 1. Change Record

- [x] 1.1 Add a dedicated OpenSpec change for shared README primary dual-CLI framing convergence
- [x] 1.2 Bound the slice to README framing, audit, roadmap update, and OpenSpec record

## 2. Truth Source

- [x] 2.1 Re-read the current root README host-support framing
- [x] 2.2 Re-read the package README host-support framing
- [x] 2.3 Re-read the dual-CLI host-governance conclusion
- [x] 2.4 Reconfirm the roadmap already states `Codex + Claude Code` as the required pair

## 3. README Convergence

- [x] 3.1 Add explicit primary-pair framing to both READMEs
- [x] 3.2 Reorder editor support tables so Claude Code and Codex lead
- [x] 3.3 Preserve other hosts as optional MCP integrations
- [x] 3.4 Update manual setup wording to distinguish primary vs optional hosts
- [x] 3.5 Record the convergence in a dedicated audit note and roadmap update

## 4. Finalization

- [x] 4.1 Validate the new OpenSpec change
- [x] 4.2 Re-run scoped change detection for final review

## 5. Final Verification Notes

- `openspec validate 2026-04-08-readme-primary-dual-cli-framing-convergence`
  returned `Change '2026-04-08-readme-primary-dual-cli-framing-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  returned `risk_level=critical`, `changed_files=106`, `changed_count=268`,
  `affected_count=54`, `path_resolution=cwd_worktree`, `fallback_reason=null`
- interpretation:
  the current worktree-wide scope review is dominated by unrelated pre-existing
  code changes elsewhere in the repository; this convergence slice itself
  remains documentation-only
