# Dual CLI Setup Context Convergence Design

## Goal

Remove support-surface drift for the two primary CLI hosts by keeping the setup
help output and repo-local GitNexus context aligned with current Claude Code
and Codex behavior.

## Design Principles

### 1. User-facing help must match real host support

If `getHostPlans()` and `setupCommand()` support Codex, `gitnexus setup --help`
must say so. The help text is often the first support surface a user sees.

### 2. Lock the help output with an integration test

The setup help string lives in CLI wiring, so a process-level integration test
is the most direct way to prevent future drift.

### 3. Refresh generated context instead of hand-maintaining stale copies

The repo-local `gitnexus/AGENTS.md`, `gitnexus/CLAUDE.md`, and packaged skill
copies should come from the current generator/templates so multi-repo and
worktree guidance stays consistent.

## Out Of Scope

- changing host adapter behavior
- adding new editors to setup
- redesigning `doctor`

## Verification

This change is complete when:

1. `gitnexus setup --help` explicitly mentions Codex
2. the integration test covers that help output
3. the refreshed repo-local context artifacts include current `repo` and `cwd`
   guidance for `detect_changes`
