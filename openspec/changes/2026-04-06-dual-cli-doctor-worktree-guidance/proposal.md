## Why

The repository now documents `detect_changes` multi-repo and worktree behavior
in agent context and skill files, but the primary host diagnostics surface still
stops at basic MCP readiness.

For the two main CLI hosts, users still need one more practical answer at the
point of diagnosis:

- when to pass `repo`
- when to pass `cwd`
- what to expect from Codex versus Claude Code in worktree scenarios

That guidance should live in `gitnexus doctor --host ...`, not only in audit
notes.

## What Changes

- Add host-specific `detect_changes` guidance checks to `gitnexus doctor` for
  `codex` and `claude-code`.
- Fix `doctorCommand()` option parsing so `--host`, `--repo`, and `--json` work
  correctly even when no positional path argument is provided.
- Lock the new behavior with unit tests.
- Keep the guidance scoped to targeted host inspections so general doctor output
  does not become noisy.

## Capabilities

### New Capabilities

- `dual-cli-doctor-worktree-guidance`: Expose worktree and `cwd` guidance for
  Claude Code and Codex through `gitnexus doctor`.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `gitnexus/src/cli/doctor.ts`
- Affected tests:
  - `gitnexus/test/unit/doctor.test.ts`
