# ci-report-language-support-summary-implementation-plan-truth-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep completed CI report language-support summary plans aligned with their OpenSpec ledgers

GitNexus SHALL keep the historical implementation plan for the completed
`ci-report-language-support-summary` slice aligned with the corresponding
OpenSpec task ledger so the plan does not continue to appear active after
delivery.

#### Scenario: A maintainer reads the historical implementation plan after the change is complete

- **WHEN** they open the historical implementation plan
- **THEN** it points to the completed OpenSpec task ledger as the
  execution-truth source
- **AND** the plan no longer reads like an unresolved active slice
