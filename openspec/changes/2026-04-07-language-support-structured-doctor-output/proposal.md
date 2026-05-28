## Why

GitNexus already unifies `language-support` policy between runtime and CI
reporting, but the transport is still string-based: `doctor --json` exposes the
check as a human-readable `detail` string, and the reporter reparses that
string back into structure.

That leaves an unnecessary fragility point. The runtime already has structured
language-support rows, so the JSON output should carry them directly.

## What Changes

- Extend `DoctorCheck` with optional structured `data`
- Emit `LanguageSupportSummaryEntry[]` on the `language-support` check
- Make the compiled reporter prefer `data` and keep a detail-string fallback
- Add focused tests for structured output and backward-compatible consumption
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `language-support-structured-doctor-output`: Keep `doctor --json` machine
  readable for the `language-support` check without breaking existing detail
  consumers.

### Modified Capabilities

- None.

## Impact

- Affected runtime code:
  - `gitnexus/src/cli/doctor.ts`
  - `gitnexus/src/ci/language-support-report.ts`
- Affected tests:
  - `gitnexus/test/unit/doctor.test.ts`
  - `gitnexus/test/unit/language-support-report.test.ts`
- Affected docs:
  - `docs/audits/2026-04-07-language-support-structured-doctor-output.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
