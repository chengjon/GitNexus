# ci-report-language-support-summary Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL persist the formatted language-support summary for downstream PR reporting

GitNexus SHALL keep the markdown summary generated from `doctor --json`
available to the PR report workflow as a CI artifact.

#### Scenario: The language-support CI job completes

- **WHEN** `ci.yml` runs the language-support job
- **THEN** it persists a `language-support-report` artifact containing the
  formatted markdown summary derived from `language-support-report.mjs`

### Requirement: GitNexus SHALL render the persisted language-support summary in the PR sticky report when available

GitNexus SHALL surface the persisted summary in the PR sticky report instead of
forcing maintainers to inspect the raw CI run.

#### Scenario: The PR report workflow finds a language-support summary artifact

- **WHEN** `ci-report.yml` downloads the `language-support-report` artifact and
  finds `language-support-summary.md`
- **THEN** the PR sticky report renders that summary in a collapsed details
  section labeled `Language Support Summary`
