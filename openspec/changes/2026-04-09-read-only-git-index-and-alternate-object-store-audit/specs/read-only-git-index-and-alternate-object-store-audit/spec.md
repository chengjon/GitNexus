# read-only-git-index-and-alternate-object-store-audit Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep the `.git` read-only boundary audit aligned with the current validation workflow

GitNexus SHALL keep the `.git` read-only boundary audit aligned with the
current validation workflow so maintainers can distinguish a repaired runtime
failure from a separate host/filesystem policy boundary.

#### Scenario: A maintainer hits a docs-only staged verification failure while `.git` is read-only

- **WHEN** a maintainer reads `docs/audits/2026-04-09-read-only-git-index-and-alternate-object-store.md`
- **THEN** the audit explains that the current blocker is the read-only `.git` submount rather than a fresh `Mmap for size 8796093022208 failed` regression
- **AND** it records that alternate staged verification requires both a temporary `GIT_INDEX_FILE` and a temporary `GIT_OBJECT_DIRECTORY`
- **AND** it keeps the real `.git/objects` path in read-only fallback via `GIT_ALTERNATE_OBJECT_DIRECTORIES`

## MODIFIED Requirements

### Requirement: GitNexus SHALL keep the MCP mmap repair audit aligned with the verified runtime outcome

The existing repaired mmap audit SHALL point readers to the newer `.git`
read-only audit when current verification is blocked by filesystem policy
rather than by a runtime regression.

#### Scenario: A maintainer reads the MCP mmap audit after the repaired incident is already understood

- **WHEN** a maintainer reads `docs/audits/2026-04-08-mcp-mmap-root-cause-and-runtime-drain-audit.md`
- **THEN** the audit still states that the original incident was repaired
- **AND** it points to `docs/audits/2026-04-09-read-only-git-index-and-alternate-object-store.md` for the current `.git` read-only validation boundary
