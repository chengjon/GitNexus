## Why

The recent dual-CLI convergence work updated the GitNexus source entry points
for Claude Code and Codex:

- `setup --help` now includes `Codex`
- `doctor --host codex|claude-code` adds explicit worktree / `cwd` guidance
- manual MCP instructions now derive from the real `McpEntry`

However, repository docs also tell operators to run the local direct entry:

- `node /opt/claude/GitNexus/gitnexus/dist/cli/index.js ...`

Because root `.gitignore` ignores `dist/`, that local direct entry can lag
behind the source unless maintainers rebuild it explicitly. This creates a
residual “source is fixed, local dist entry is stale” gap, which matters
especially for the repository's main Claude Code and Codex workflows.

## What Changes

- Refresh the local `gitnexus/dist` entry by rebuilding `gitnexus`
- Verify the direct `dist` entry now reflects the current dual-CLI setup and
  doctor behavior for both Codex and Claude Code
- Record the residual and the operator rule in audit / roadmap docs

## Capabilities

### New Capabilities

- `dual-cli-dist-entry-convergence`: Keep the locally referenced `dist` CLI
  entry aligned with the current dual-CLI source behavior when operators use
  the direct `node dist/cli/index.js ...` path.

### Modified Capabilities

- None.

## Impact

- Affected operator workflow:
  - `gitnexus/package.json`
  - local `gitnexus/dist/cli/*` runtime entry
- Affected docs:
  - `docs/audits/2026-04-07-dual-cli-dist-entry-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
