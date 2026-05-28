## Design

This slice stays doc-only. It does not change CLI behavior, host adapters, or
generated repo context.

The docs should mirror the behavior already locked by the earlier dual-CLI
repair slices:

- use the actual host ids `codex` and `claude-code`
- tell users to run `gitnexus doctor --host <host> --repo <repo>` when checking
  host readiness for a specific repository
- explain that `gitnexus_detect_changes` should pass `repo` in multi-repo
  sessions
- explain that `gitnexus_detect_changes` should also pass `cwd` when the active
  worktree differs from the MCP server cwd

The quick-start guides also need one additional truth-sync item: current
`analyze` defaults create `.gitnexus/` and registry metadata only, while
repo-local context files require `--with-context`.
