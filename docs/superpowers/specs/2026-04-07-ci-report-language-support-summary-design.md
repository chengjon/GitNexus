# CI Report Language Support Summary Design

Date: 2026-04-07  
Status: Approved in conversation  
Scope: `.github/workflows/ci.yml`, `.github/workflows/ci-report.yml`, `gitnexus/test/unit/repository-governance-integration.test.ts`, `docs/audits/`, `openspec/changes/`, `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

## Goal

Extend the PR sticky report so it not only shows the `language-support` gate as
pass/fail, but also exposes the existing language support summary that CI
already computes from `doctor --json`.

## Design Decision

Use the smallest end-to-end path that reuses existing data:

- keep `doctor --json` and `language-support-report.mjs` unchanged
- in `ci.yml`, tee the language-support summary into a file
- upload a dedicated `language-support-report` artifact containing:
  - `doctor-output.json`
  - `language-support-summary.md`
- in `ci-report.yml`, download that artifact and render the summary in a
  collapsed details block
- lock the workflow contract with text-oriented integration tests

## Why This Design

The summary content already exists today:

- `doctor --json` produces the raw data
- `language-support-report.mjs` formats it into readable markdown
- GitHub step summary already receives that markdown

The remaining gap is that the PR sticky report cannot access that summary after
the original CI job finishes. Persisting the existing markdown as an artifact is
the lightest way to bridge the workflows without redesigning the report system.

## Rejected Alternatives

### Recompute the summary inside `ci-report.yml`

Rejected because that would duplicate the language-support reporting path and
risk drift from the real CI gate logic.

### Parse `doctor-output.json` directly in the PR report workflow

Rejected because `language-support-report.mjs` already owns the formatting and
policy validation. Reusing its output is cleaner than rebuilding the same logic
inside shell.

### Add the full doctor JSON to the PR comment

Rejected because the operator need is a concise summary, not raw JSON noise.

## File Changes

- Modify `.github/workflows/ci.yml` to persist a language-support artifact
- Modify `.github/workflows/ci-report.yml` to download and render that artifact
- Modify `gitnexus/test/unit/repository-governance-integration.test.ts` to lock
  the workflow contract
- Add a dedicated audit note for the residual and follow-up repair
- Add an OpenSpec change for this report-summary slice
- Update the technical-debt roadmap with the new convergence status

## Success Criteria

- `ci.yml` persists a `language-support-report` artifact
- the artifact contains `language-support-summary.md`
- `ci-report.yml` downloads the artifact and renders the summary in the PR
  comment when present
- the summary stays derived from `language-support-report.mjs`
- a regression test fails if the artifact or rendering path disappears
