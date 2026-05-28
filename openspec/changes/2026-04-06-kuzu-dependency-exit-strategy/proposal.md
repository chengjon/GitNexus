## Why

The repository has already completed two dependency-governance slices:

- review-only decision framing for `kuzu` / `kuzu-wasm`
- exact direct pinning as a tracked exception

What is still missing is a concrete exit strategy. Without that, the next
operator still has to re-derive:

- whether `@kuzu/kuzu-wasm` is a real successor candidate
- how much of the local codebase each track actually touches
- what evidence is required before the repo should replace or unpin either line

That gap creates a risk of speculative migration work, especially because the
official docs, npm metadata, and repository archival state are internally
inconsistent.

## What Changes

- Add a dedicated follow-up OpenSpec change for the `kuzu` dependency exit
  strategy.
- Record verified current status for CLI `kuzu`, web `kuzu-wasm`, and the
  alternate `@kuzu/kuzu-wasm` candidate.
- Define separate exit criteria for CLI native and web wasm.
- Preserve the rule that any future CLI-side dependency change must continue to
  support both Claude Code and Codex workflows.
- Do not replace dependencies in this change.

## Capabilities

### New Capabilities

- `kuzu-dependency-exit-strategy`: Keep the deprecated `kuzu` dependency line
  pinned until explicit candidate and verification criteria are satisfied for
  the relevant track.

### Modified Capabilities

- None.

## Impact

- Affected audits:
  - `docs/audits/2026-04-06-kuzu-dependency-exit-strategy.md`
  - `docs/audits/2026-04-06-kuzu-dependency-review.md`
- Affected roadmap:
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
