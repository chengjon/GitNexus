## Why

GitNexus already supports both Claude Code and Codex in its host adapter layer,
but two support-surface artifacts were still lagging behind:

- `gitnexus setup --help` still claimed it configured only `Cursor`, `Claude Code`,
  and `OpenCode`
- the repo-local `gitnexus/AGENTS.md` / `gitnexus/CLAUDE.md` generation outputs
  still reflected older `detect_changes` guidance that omitted explicit
  multi-repo `repo` usage and worktree `cwd` reminders

For a repository whose main CLI workflows are Claude Code and Codex, those
support-surface mismatches create unnecessary ambiguity.

## What Changes

- Add an integration test that locks `gitnexus setup --help` to the actual dual-CLI support list.
- Update the setup command description so `Codex` appears alongside the other supported editors.
- Refresh the repo-local `gitnexus/` agent context artifacts and packaged skill copies so they carry the current `repo` + `cwd` guidance.

## Capabilities

### New Capabilities

- `dual-cli-setup-context-convergence`: Keep the setup help output and repo-local GitNexus context aligned with the current Claude Code and Codex support surface.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `gitnexus/src/cli/index.ts`
- Affected tests:
  - `gitnexus/test/integration/cli-e2e.test.ts`
- Affected generated context artifacts:
  - `gitnexus/AGENTS.md`
  - `gitnexus/CLAUDE.md`
  - `gitnexus/.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md`
  - `gitnexus/.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md`
