# embeddings-config-structured-doctor-output-implementation-plan-truth-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep completed embeddings-config structured doctor-output plans aligned with their OpenSpec ledgers

GitNexus SHALL keep the historical implementation plan for the completed
`embeddings-config-structured-doctor-output` slice aligned with the
corresponding OpenSpec task ledger so the plan does not continue to appear
active after delivery.

#### Scenario: A maintainer reads the historical implementation plan after the change is complete

- **WHEN** they open the historical implementation plan
- **THEN** it points to the completed OpenSpec task ledger as the
  execution-truth source
- **AND** the plan no longer reads like an unresolved active slice
