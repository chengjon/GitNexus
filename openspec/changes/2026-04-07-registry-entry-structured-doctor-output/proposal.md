## Why

`doctor --json` still emits `registry-entry` mostly as prose even though the
doctor path already knows the current repo path and whether a matching global
registry entry exists.

This shared doctor contract needs to stay machine readable regardless of
whether the operator reaches it via Claude Code or Codex.

## What Changes

- Add structured `data` to `registry-entry` checks
- Reuse the existing repo path and matched registry entry
- Keep the current detail string unchanged
- Add focused regression coverage for matched and unmatched registry states
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `registry-entry-structured-doctor-output`: Keep registry entry diagnostics
  machine readable for shared dual-CLI doctor flows.

### Modified Capabilities

- None.

## Impact

- Affected runtime code:
  - `gitnexus/src/cli/doctor.ts`
- Affected tests:
  - `gitnexus/test/unit/doctor.test.ts`
- Affected docs:
  - `docs/audits/2026-04-07-registry-entry-structured-doctor-output.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
