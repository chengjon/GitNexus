# dual-cli-dist-entry-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL expose current dual-CLI behavior through the documented local `dist` CLI entry

GitNexus SHALL keep the documented local direct `dist` entry aligned with the
current dual-CLI source behavior for both Codex and Claude Code.

#### Scenario: A maintainer or operator uses the local setup help entry

- **WHEN** they run `node dist/cli/index.js setup --help`
- **THEN** the help description lists `Codex` alongside `Cursor`, `Claude Code`,
  and `OpenCode`

#### Scenario: A maintainer or operator checks Codex readiness via the local `dist` entry

- **WHEN** they run `node dist/cli/index.js doctor --json --host codex --repo .`
- **THEN** the output includes the current `host-detect-changes-guidance`
  explaining explicit `repo` and `cwd` usage for Codex worktree scenarios

#### Scenario: A maintainer or operator checks Claude Code readiness via the local `dist` entry

- **WHEN** they run `node dist/cli/index.js doctor --json --host claude-code --repo .`
- **THEN** the output includes the current `host-detect-changes-guidance`
  explaining when Claude Code operators must pass explicit `cwd`

### Requirement: GitNexus SHALL treat local `dist` refresh as required follow-up after dual-CLI CLI source changes

GitNexus SHALL require a local rebuild before relying on the documented direct
`dist` entry whenever dual-CLI CLI source files have changed.

#### Scenario: Dual-CLI CLI source changes land before a local direct-entry check

- **WHEN** `gitnexus/src/cli/index.ts`, `gitnexus/src/cli/doctor.ts`, or
  `gitnexus/src/cli/host-adapters/*` change in ways that affect Claude Code or
  Codex behavior
- **THEN** maintainers rebuild `gitnexus` before claiming that
  `node dist/cli/index.js ...` reflects the current source behavior
