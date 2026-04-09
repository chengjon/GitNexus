# mcp-process-management-implementation-plan-truth-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the historical mcp-process-management implementation plan aligned with merged-state records

GitNexus SHALL keep the historical `mcp-process-management` implementation plan
aligned with the repository's current merged-state records after the feature has
landed.

#### Scenario: A maintainer reads the historical mcp-process-management implementation plan

- **WHEN** a maintainer reads
  `2026-04-05-mcp-process-management-implementation-plan.md`
- **THEN** the plan does not incorrectly present the landed implementation as
  still open
- **AND** it points readers to the archived OpenSpec change, historical design
  record, and roadmap as the merged-state truth source
- **AND** it does not reopen the already-landed MCP process-management feature
  itself
