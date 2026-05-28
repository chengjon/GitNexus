## Why

GitNexus now surfaces the `language-support` gate in the PR sticky report, but
the report still only shows the gate status. Maintainers cannot see the actual
language support summary there, even though CI already generates that markdown
from `doctor --json`.

This leaves an operator-feedback gap: the PR report says whether the gate
passed, but not what Kotlin / Swift or other optional language states actually
were.

## What Changes

- Persist the formatted language-support summary as a dedicated CI artifact
- Download that artifact in `ci-report.yml`
- Render the summary in a collapsed section of the PR sticky report
- Add workflow-text regression coverage for the artifact and rendering path
- Record the residual and convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `ci-report-language-support-summary`: Keep the PR sticky report aligned with
  the existing language-support summary generated during CI.

### Modified Capabilities

- None.

## Impact

- Affected workflows:
  - `.github/workflows/ci.yml`
  - `.github/workflows/ci-report.yml`
- Affected tests:
  - `gitnexus/test/unit/repository-governance-integration.test.ts`
- Affected docs:
  - `docs/audits/2026-04-07-ci-report-language-support-summary.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
