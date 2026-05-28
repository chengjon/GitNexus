# dual-cli-post-mutation-freshness-guidance Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL document dual-CLI post-mutation freshness behavior explicitly

GitNexus SHALL make shared freshness guidance explicitly distinguish Claude Code
automatic post-mutation handling from Codex manual post-mutation handling.

#### Scenario: Generated AI context documents shared freshness guidance

- **WHEN** GitNexus generates shared AI context content
- **THEN** the content includes the existing Claude Code PostToolUse note
- **AND** the content also states that Codex users must rerun `gitnexus analyze` manually when they need a fresh index after `git commit` or `git merge`

#### Scenario: Quick-start guidance explains the same host split

- **WHEN** a reader follows the shared quick-start guidance
- **THEN** the guide distinguishes Claude Code automatic handling from Codex manual handling
