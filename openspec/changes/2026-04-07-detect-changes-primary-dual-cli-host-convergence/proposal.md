## Why

The repository now has enough host evidence to close its required primary
support surface for `detect_changes`: Codex already had empirical evidence, and
Claude Code now has a current CLI live-probe result.

However, several governance docs still frame Cursor live probing as if it were
the next blocking residual. This repo mainly targets Claude Code and Codex, and
the current machine does not provide a directly callable Cursor CLI. Leaving
the wording unchanged creates false-open host debt.

## What Changes

- Record a docs-only convergence slice for the primary `Codex + Claude Code`
  host surface
- Update existing host-governance docs so Cursor and other clients are treated
  as optional external follow-up rather than blocking repo debt
- Keep the current host guidance conservative: explicit `repo` for multi-repo
  and explicit `cwd` when worktree and server cwd can differ

## Capabilities

### New Capabilities

- `detect-changes-primary-dual-cli-host-convergence`: Keep the repository’s
  required `detect_changes` host-support surface explicitly aligned with
  Codex and Claude Code evidence.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/audits/2026-04-07-detect-changes-primary-dual-cli-host-convergence.md`
  - `docs/audits/2026-04-07-detect-changes-host-compatibility-matrix-baseline.md`
  - `docs/audits/2026-04-07-detect-changes-claude-code-cwd-live-probe.md`
  - `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused evidence:
  - repository Codex empirical result for `cwd` passthrough assumptions
  - 2026-04-07 Claude Code CLI live-probe result
  - current-machine check showing no directly callable Cursor CLI
