# GitNexus Personal Fork Workflow

## Purpose

This repository is maintained as a personal research and usage fork.

- Local working repository: `/opt/claude/GitNexus`
- Personal GitHub repository: `chengjon/GitNexus`
- Official upstream repository: `abhigyanpatwari/GitNexus`

The goal is to keep `chengjon/GitNexus` usable for personal experiments, documentation, workflow changes, and local optimizations without treating every change as upstream-bound.

## Remote Roles

### `origin`

`origin` is the primary working remote.

- Points to `chengjon/GitNexus`
- Accepts local commits and long-lived personal modifications
- May contain research-oriented docs, local automation, workflow changes, and experimental branches
- `main` on this remote is the actual personal canonical branch

### `upstream`

`upstream` is a reference remote.

- Points to `abhigyanpatwari/GitNexus`
- Used for tracking official changes
- Used for diffing, cherry-picking, and understanding upstream direction
- Not a default push target

## Working Rules

1. Daily development happens against `origin/main` or personal feature branches.
2. Do not assume changes should be proposed upstream.
3. `upstream/main` is for comparison and selective intake only.
4. Temporary upstream-sync branches are disposable and should be cleaned up after use.
5. Personal documentation and local process artifacts are valid on `origin`, even if they would not belong upstream.

## Recommended Update Workflow

When upstream publishes changes:

1. `git fetch upstream`
2. Compare `upstream/main...origin/main`
3. Create an isolated sync branch or temporary worktree
4. Cherry-pick or manually port only the changes worth adopting
5. Run verification locally
6. Merge the adopted changes back into `origin/main`
7. Push only to `origin`

## When To Consider Upstream Submission

Only consider preparing upstream-facing material when all of the following are true:

- the change is generally useful beyond personal usage
- it is not tied to local workflow assumptions
- it does not depend on personal docs or research exports
- it is cleanly separable from personal modifications

If those conditions are not met, keep the change in `origin` only.

## Temporary Sync Artifacts

For future upstream comparison work, temporary resources may be created under `.worktrees/`.

Examples:

- temporary worktrees
- standalone sync clones
- patch bundles
- `request-pull` exports

These are operational artifacts, not permanent project state. Clean them after the sync decision is made.

## Current Repository Policy

As of `2026-03-18`:

- `main` is the active personal branch
- `origin/main` is the push target
- upstream PR creation is not part of the default workflow
- upstream sync is optional and selective

## Practical Default

If there is any ambiguity, prefer this behavior:

- fetch from `upstream`
- merge or cherry-pick into `origin`
- push to `origin`
- stop there
