## Why

Shared GitNexus guidance currently documents Claude Code automatic post-mutation
freshness handling but does not state the current Codex behavior.

Because the repository explicitly supports both Claude Code and Codex, the
shared guidance should distinguish:

- Claude Code automatic freshness handling via PostToolUse
- Codex manual rerun of `gitnexus analyze`

## What Changes

- Update generated AI context guidance to document both Claude Code and Codex
  post-mutation freshness behavior
- Add focused regression coverage for the dual-CLI wording
- Align the quick-start guide and mini-repo fixture docs to the same wording
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `dual-cli-post-mutation-freshness-guidance`: Shared GitNexus docs keep
  Claude Code automatic and Codex manual freshness handling explicit.

### Modified Capabilities

- None.

## Impact

- Affected runtime code:
  - `gitnexus/src/cli/ai-context.ts`
- Affected tests:
  - `gitnexus/test/unit/ai-context.test.ts`
- Affected docs:
  - `docs/gitnexus-quick-start-guide.md`
  - `docs/audits/2026-04-07-dual-cli-post-mutation-freshness-guidance.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
