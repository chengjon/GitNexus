## Why

The external-host compatibility matrix baseline still left Claude Code in the
“documented but not live-probed” bucket. Because GitNexus must support both
Claude Code and Codex, Claude Code is the most important remaining host to
probe directly.

## What Changes

- Record a live-probe result for Claude Code `cwd` behavior
- Update the worktree review so Claude Code no longer remains under generic
  unverified host debt
- Narrow the remaining host gap to Cursor and other clients

## Capabilities

### New Capabilities

- `detect-changes-claude-code-cwd-live-probe`: Keep a live-probe record for
  Claude Code `cwd` passthrough behavior around detect_changes-like tool calls.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/audits/2026-04-07-detect-changes-claude-code-cwd-live-probe.md`
  - `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Referenced probe evidence:
  - repo-root Claude Code MCP probe
  - temporary git worktree Claude Code MCP probe
