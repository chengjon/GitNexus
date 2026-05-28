# mcp-mmap-root-cause-and-runtime-drain-audit Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the MCP mmap repair audit aligned with the verified runtime outcome

GitNexus SHALL keep the `Mmap for size 8796093022208 failed` governance record
aligned with the verified runtime outcome so maintainers can distinguish the
historical failure, the repaired behavior, and the remaining host boundary.

#### Scenario: A maintainer reads the MCP mmap audit after the repair is verified

- **WHEN** a maintainer reads `docs/audits/2026-04-08-mcp-mmap-root-cause-and-runtime-drain-audit.md`
- **THEN** the audit separates measured evidence, inferred root cause, and historical baseline
- **AND** it states that the repaired incident was caused by long-lived repo-worker runtime and drain behavior rather than permanent index corruption
- **AND** it records the remaining `Transport closed` behavior as a host MCP transport boundary rather than an unresolved repository runtime failure
- **AND** the technical-debt roadmap points readers to the audit and this OpenSpec change
