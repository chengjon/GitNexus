# mcp-per-repo-worker-isolation-implementation-plan-truth-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the historical MCP per-repo worker isolation implementation and status docs aligned with merged-state records

GitNexus SHALL keep the historical `mcp-per-repo-worker-isolation`
implementation and status docs aligned with the repository's current
merged-state records after the router/worker architecture has landed.

#### Scenario: A maintainer reads the historical router/worker isolation docs

- **WHEN** a maintainer reads the historical implementation plan or related
  architecture status docs
- **THEN** they do not incorrectly describe the current MCP router/worker
  architecture as still proposed
- **AND** they point readers to the current merged-state truth sources
- **AND** they do not reopen the already-landed router/worker architecture
  itself
