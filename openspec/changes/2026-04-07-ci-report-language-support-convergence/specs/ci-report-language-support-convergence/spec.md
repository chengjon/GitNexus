# ci-report-language-support-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL surface the language-support CI gate in the PR report workflow

GitNexus SHALL keep the PR sticky report aligned with the existing
`language-support` CI gate.

#### Scenario: PR metadata contains language-support status

- **WHEN** `ci.yml` writes `language_support_result` into the `pr-meta` artifact
- **THEN** `ci-report.yml` reads that field and exposes it to the report build step

#### Scenario: PR report renders pipeline status

- **WHEN** the PR report builds its pipeline status table
- **THEN** it includes a `Language Support` row alongside the other CI stages

### Requirement: GitNexus SHALL avoid locale-variable collisions when threading language-support status through shell workflows

GitNexus SHALL not reuse the conventional locale variable `LANG` as the
workflow status carrier for the language-support gate.

#### Scenario: CI or PR report shell steps carry language-support job status

- **WHEN** `ci.yml` or `ci-report.yml` passes language-support status through a
  shell `env` block
- **THEN** the workflow uses a non-locale variable name such as
  `LANG_SUPPORT`, while keeping the persisted artifact field
  `language_support_result` unchanged

### Requirement: GitNexus SHALL include language-support in the PR report overall status

GitNexus SHALL not report the PR summary as fully passing when the
`language-support` gate failed.

#### Scenario: language-support fails while other jobs pass

- **WHEN** `quality`, `unit-tests`, and `integration` succeed but
  `language-support` fails
- **THEN** the PR report overall status is rendered as failed rather than
  “All checks passed”
