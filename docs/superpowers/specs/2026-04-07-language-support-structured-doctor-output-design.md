# Language Support Structured Doctor Output Design

Date: 2026-04-07  
Status: Approved in conversation  
Scope: `gitnexus/src/cli/doctor.ts`, `gitnexus/src/ci/language-support-report.ts`, targeted tests, audit/OpenSpec/roadmap docs

## Goal

Make `doctor --json` expose structured `language-support` data so downstream CI
reporting no longer has to depend on parsing a human-oriented detail string.

## Design Decision

Use an additive JSON contract:

- keep the existing `detail` string for human readability
- add optional `data` on `DoctorCheck`
- populate `data` for the `language-support` check with the existing runtime
  `LanguageSupportSummaryEntry[]`
- make the reporter prefer `data` and fall back to parsing `detail` for older
  payloads

## Why This Design

This removes the brittle transport layer without forcing a breaking CLI change.
It keeps backward compatibility while letting CI consume the same structured
language-support rows that `runDoctor()` already has in memory.

## Rejected Alternatives

### Remove `detail` and only emit `data`

Rejected because the string is still useful for terminal output and existing
consumers.

### Keep only string parsing and rely on tests

Rejected because tests would detect drift, but the transport would still remain
needlessly fragile.

### Add a language-support-specific nested schema outside `DoctorCheck`

Rejected because an optional `data` field is the smallest extension and leaves
room for other checks to adopt the same pattern later.

## Success Criteria

- `doctor --json` emits `data` for the `language-support` check
- the reporter prefers structured `data` when present
- the reporter still works against old string-only payloads
- focused tests fail if structured output disappears
