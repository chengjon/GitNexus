## Why

The `detect_changes` worktree review still had one vague open item: an
“external host compatibility matrix” for `cwd` passthrough. That wording did
not distinguish between documented facts, partial protocol signals, and missing
live probes.

## What Changes

- Record a bounded host compatibility matrix baseline for Claude Code, Codex,
  and Cursor
- Update the review doc so the remaining open work is explicit live probing
  rather than a generic placeholder
- Record the convergence in roadmap and governance docs

## Capabilities

### New Capabilities

- `detect-changes-host-compatibility-matrix-baseline`: Keep a bounded baseline
  for external-host `cwd` passthrough research around `detect_changes`.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/audits/2026-04-07-detect-changes-host-compatibility-matrix-baseline.md`
  - `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Referenced sources:
  - Claude Code MCP / Hooks docs
  - Codex MCP docs
  - Cursor MCP docs
  - existing repo-local Codex empirical evidence
