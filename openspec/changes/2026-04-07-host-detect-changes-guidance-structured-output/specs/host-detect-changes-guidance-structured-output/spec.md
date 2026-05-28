# host-detect-changes-guidance-structured-output Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL emit structured host detect-changes guidance in doctor JSON

GitNexus SHALL expose machine-readable host-specific `gitnexus_detect_changes`
guidance alongside the existing human-readable `host-detect-changes-guidance`
detail string.

#### Scenario: A caller requests doctor JSON for Codex host guidance

- **WHEN** `runDoctor()` includes Codex detect-changes guidance
- **THEN** the corresponding `host-detect-changes-guidance` check includes structured `data`
- **AND** the data identifies the `gitnexus_detect_changes` command and Codex-specific `repo` / `cwd` guidance conditions

#### Scenario: A caller requests doctor JSON for Claude Code host guidance

- **WHEN** `runDoctor()` includes Claude Code detect-changes guidance
- **THEN** the corresponding `host-detect-changes-guidance` check includes structured `data`
- **AND** the data identifies the `gitnexus_detect_changes` command and Claude Code-specific `repo` / `cwd` guidance conditions
