## Why

GitNexus CI already runs a dedicated `language-support` gate and persists its
result into the `pr-meta` artifact. The required CI gate also includes that
job in the final pass/fail decision.

However, the PR report workflow still reads only quality, unit, and
integration results. This means the sticky PR comment can omit a real merge
gate and present an incomplete view of CI status.

Because this repository relies on CI reports as governance-facing operator
feedback, the report must converge with the actual gate set instead of
silently drifting.

## What Changes

- Update `ci-report.yml` to read `language_support_result`
- Include `Language Support` in the PR report status table
- Include that gate in the PR report overall pass/fail decision
- Rename workflow shell status variables from `LANG` to `LANG_SUPPORT` where
  this gate is threaded through CI/report shell steps, while keeping the
  persisted artifact field name unchanged
- Add a workflow-text regression test to prevent future omission
- Record the residual and fix in audit / roadmap docs

## Capabilities

### New Capabilities

- `ci-report-language-support-convergence`: Keep the PR sticky report aligned
  with the real `language-support` CI gate.

### Modified Capabilities

- None.

## Impact

- Affected workflow:
  - `.github/workflows/ci.yml`
  - `.github/workflows/ci-report.yml`
- Affected tests:
  - `gitnexus/test/unit/repository-governance-integration.test.ts`
- Affected docs:
  - `docs/audits/2026-04-07-ci-report-language-support-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
