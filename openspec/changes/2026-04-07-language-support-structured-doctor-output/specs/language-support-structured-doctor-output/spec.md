# language-support-structured-doctor-output Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL emit structured language-support data in doctor JSON

GitNexus SHALL expose machine-readable `language-support` rows in `doctor --json`
alongside the existing human-readable detail string.

#### Scenario: A caller requests doctor JSON for a repository

- **WHEN** `runDoctor()` emits the `language-support` check
- **THEN** the check includes structured language-support rows in `data`
- **AND** it still includes the existing summary `detail`

### Requirement: GitNexus SHALL keep reporter compatibility across structured and legacy doctor payloads

GitNexus SHALL let the CI reporter consume structured `language-support` data
when present while preserving compatibility with older string-only payloads.

#### Scenario: The reporter receives a doctor payload with structured data

- **WHEN** `language-support` includes `data`
- **THEN** the reporter uses that structure instead of reparsing `detail`

#### Scenario: The reporter receives an older doctor payload without structured data

- **WHEN** `language-support` only includes `detail`
- **THEN** the reporter still formats and validates the summary by falling back
  to legacy detail parsing
