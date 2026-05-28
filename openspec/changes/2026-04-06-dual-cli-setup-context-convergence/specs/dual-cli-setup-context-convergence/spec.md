# dual-cli-setup-context-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL expose Codex in setup help when setup supports it

GitNexus SHALL keep the `gitnexus setup --help` output aligned with the actual
supported host list, including Codex.

#### Scenario: A user checks setup help

- **WHEN** a user runs `gitnexus setup --help`
- **THEN** the help description lists `Codex` alongside the other supported
  setup hosts

### Requirement: GitNexus SHALL keep repo-local context artifacts aligned with current detect_changes guidance

GitNexus SHALL keep repo-local context artifacts aligned with the current
multi-repo and worktree guidance for `detect_changes`.

#### Scenario: Repo-local context artifacts are refreshed

- **WHEN** maintainers refresh the `gitnexus/` repo-local AGENTS, CLAUDE, and
  packaged skill copies
- **THEN** the generated guidance includes explicit `repo` usage for multi-repo
  sessions and explicit `cwd` reminders for worktree scenarios
