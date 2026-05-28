## Why

The checked-in `mini-repo` AI context fixtures drifted behind the current
generated-context contract.

Specifically, the fixture docs still embedded dynamic counts and stale
`detect_changes` examples even though the generator and the main shared docs had
already converged to the newer contract.

## What Changes

- Add focused regression coverage for the `mini-repo` fixture contract
- Update the checked-in `mini-repo` fixture docs to match the current generated
  guidance
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `mini-repo-ai-context-fixture-convergence`: Keep checked-in `mini-repo`
  AI-context fixtures aligned with the current generated guidance contract.

### Modified Capabilities

- None.

## Impact

- Affected tests:
  - `gitnexus/test/unit/ai-context.test.ts`
- Affected fixture docs:
  - `gitnexus/test/fixtures/mini-repo/AGENTS.md`
  - `gitnexus/test/fixtures/mini-repo/CLAUDE.md`
- Affected docs:
  - `docs/audits/2026-04-07-mini-repo-ai-context-fixture-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
