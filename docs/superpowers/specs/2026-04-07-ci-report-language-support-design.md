# CI Report Language Support Design

Date: 2026-04-07
Status: Approved in conversation
Scope: `.github/workflows/ci.yml`, `.github/workflows/ci-report.yml`, `gitnexus/test/unit/repository-governance-integration.test.ts`, `docs/audits/`, `openspec/changes/`, `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

## Goal

Close the residual gap where GitNexus CI already runs a dedicated `language-support`
gate, but the PR report workflow does not read or display that gate in the sticky
comment summary.

## Design Decision

Use the narrowest possible repair:

- keep the existing `CI` workflow and `pr-meta` artifact contract
- update `ci-report.yml` to read `language_support_result`
- add `Language Support` to the PR report status table
- include language support in the report's overall pass/fail decision
- rename shell-carried status variables from `LANG` to `LANG_SUPPORT` where
  this gate flows through workflow env blocks
- add a workflow-oriented regression test that reads the workflow text directly

## Why This Design

The missing piece is not a product defect in `doctor` or the language-support job
itself. The `CI` workflow already:

- runs the `language-support` job
- persists `language_support_result` into `pr-meta`
- uses that result in the required CI gate

The only functional drift is in the report consumer. Fixing the consumer keeps
the change small, avoids artifact churn, and preserves the current operator
mental model.

During implementation, the same gate also turned out to be threaded through
workflow shell env blocks as `LANG`, which collides with the conventional locale
variable. Renaming that carrier to `LANG_SUPPORT` is still a narrow fix because
it does not change artifact shape or job semantics.

## Rejected Alternatives

### Add a new artifact carrying the rendered language summary

Rejected because it expands the workflow contract for a reporting-only gap. The
current residual is a missing status line, not missing raw data.

### Refactor the entire PR report assembly into a new script

Rejected because this is larger than the residual justifies. The current shell
workflow is acceptable if its coverage is tightened with a focused regression
test.

## File Changes

- Modify `.github/workflows/ci.yml` to use `LANG_SUPPORT` instead of `LANG` for
  the language-support gate in shell steps
- Modify `.github/workflows/ci-report.yml` to read and render `language_support_result`
- Modify `gitnexus/test/unit/repository-governance-integration.test.ts` to lock the
  workflow behavior in text form
- Add a dedicated audit note for the residual and repair
- Add an OpenSpec change for the PR report convergence slice
- Update the technical-debt roadmap with the new residual-fix status

## Success Criteria

- `ci-report.yml` reads `language_support_result` from the `pr-meta` artifact
- `ci.yml` and `ci-report.yml` both avoid using locale variable `LANG` as the
  language-support gate carrier
- the PR report table includes a `Language Support` row
- the PR report overall status fails whenever `language-support` failed
- a focused regression test fails if the workflow stops surfacing that gate
- audit and roadmap docs capture the residual and the chosen minimal fix
