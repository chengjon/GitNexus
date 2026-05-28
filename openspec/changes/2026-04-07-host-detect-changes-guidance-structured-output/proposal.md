## Why

`doctor --json` still emits `host-detect-changes-guidance` only as prose even
though the guidance already has stable host-specific semantics for both Codex
and Claude Code.

This is particularly relevant because the repository must continue to support
both CLI hosts.

## What Changes

- Add structured `data` to `host-detect-changes-guidance` checks
- Reuse the existing host-specific guidance semantics
- Keep the current detail string unchanged
- Add focused regression coverage for Codex and Claude Code guidance paths
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `host-detect-changes-guidance-structured-output`: Keep host-specific
  `gitnexus_detect_changes` guidance machine readable for dual-CLI environments.

### Modified Capabilities

- None.

## Impact

- Affected runtime code:
  - `gitnexus/src/cli/doctor.ts`
- Affected tests:
  - `gitnexus/test/unit/doctor.test.ts`
- Affected docs:
  - `docs/audits/2026-04-07-host-detect-changes-guidance-structured-output.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
