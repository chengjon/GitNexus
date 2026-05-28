## Why

`doctor --json` still emits `native-runtime` primarily as a human-readable
string even though the default implementation already has a structured
`NativeRuntimeSnapshot`.

That leaves another environment-critical check on a string contract.

## What Changes

- Add structured `data` to the default `native-runtime` check
- Reuse `nativeRuntimeManager.getSnapshot()` directly as the payload
- Keep the current detail string unchanged
- Add focused coverage that exercises the real default snapshot path
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `native-runtime-structured-doctor-output`: Keep the native runtime doctor
  check machine readable without changing the existing text summary.

### Modified Capabilities

- None.

## Impact

- Affected runtime code:
  - `gitnexus/src/cli/doctor.ts`
- Affected tests:
  - `gitnexus/test/unit/doctor.test.ts`
- Affected docs:
  - `docs/audits/2026-04-07-native-runtime-structured-doctor-output.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
