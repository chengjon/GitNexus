# mini-repo-ai-context-fixture-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep mini-repo AI-context fixtures aligned with the current generated contract

GitNexus SHALL keep the checked-in `mini-repo` AI-context fixture docs aligned
with the current generated guidance contract.

#### Scenario: The checked-in mini-repo fixture docs are reviewed

- **WHEN** a maintainer reads the checked-in `mini-repo` fixture docs
- **THEN** they do not embed dynamic symbol/edge/process counts in the intro
- **AND** they include the current `detect_changes` `repo` guidance
- **AND** they retain the current Claude Code automatic versus Codex manual freshness guidance
