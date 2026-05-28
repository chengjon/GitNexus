# language-support-policy-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL expose a stable language-support policy for downstream tooling

GitNexus SHALL provide a runtime-owned language-support policy that downstream
CI validation code can consume without re-declaring builtin and optional
language tiers.

#### Scenario: Downstream tooling validates a language-support summary

- **WHEN** the reporter validates `doctor --json` language-support rows
- **THEN** it uses the runtime-exported language-support policy as its source of truth

### Requirement: GitNexus SHALL run the compiled language-support reporter in CI

GitNexus SHALL execute the compiled language-support reporter from `dist/ci`
during CI summary generation.

#### Scenario: The language-support CI job formats the doctor summary

- **WHEN** `ci.yml` runs the language-support summary step
- **THEN** it executes `dist/ci/language-support-report.js`
- **AND** it keeps the generated markdown available for downstream PR reporting
