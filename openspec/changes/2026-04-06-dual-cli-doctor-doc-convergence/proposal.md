## Why

The dual-CLI repair waves already converged the actual host adapters, setup help,
repo-local context files, and `gitnexus doctor` behavior for `Codex` and
`Claude Code`.

The remaining drift is now in the main user-entry documentation:

- several docs still show `gitnexus doctor --host claude` instead of the real
  `claude-code` host id
- the top-level entry docs do not explain that `gitnexus doctor --host
  codex|claude-code --repo <path>` is the intended readiness check shape
- `detect_changes` examples still omit the current multi-repo `repo` and
  worktree `cwd` guidance in the most visible quick-start docs
- one quick-start guide still describes `analyze` as generating repo context
  files by default, which no longer matches current behavior

Because this repository mainly supports Claude Code and Codex workflows, those
entry docs should converge together instead of drifting host-by-host.

## What Changes

- Add a dedicated OpenSpec change for the remaining dual-CLI doc convergence
  slice.
- Update the shared README surfaces to use `claude-code` and document the
  intended `doctor --host ... --repo ...` workflow.
- Update the quick-start guides so `detect_changes` examples mention the current
  `repo` plus `cwd` guidance for multi-repo and worktree scenarios.
- Align quick-start `analyze` output expectations with current default
  `--with-context` behavior.

## Capabilities

### New Capabilities

- `dual-cli-doctor-doc-convergence`: Keep the main GitNexus entry docs aligned
  with the current Claude Code and Codex doctor and `detect_changes` workflow.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `README.md`
  - `gitnexus/README.md`
  - `docs/gitnexus-quick-start-guide.md`
  - `docs/ai-cli-local-quick-start.md`
