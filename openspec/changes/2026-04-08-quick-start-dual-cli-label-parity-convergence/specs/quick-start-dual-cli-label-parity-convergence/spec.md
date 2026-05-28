# quick-start-dual-cli-label-parity-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep quick-start host labels aligned with the dual-CLI primary support framing

GitNexus SHALL keep the per-host labels in
`docs/gitnexus-quick-start-guide.md` aligned with the repository's current
`Claude Code + Codex` primary maintained CLI framing.

#### Scenario: A maintainer reads the quick-start host setup section

- **WHEN** they read the `配置 AI 编辑器` section in
  `docs/gitnexus-quick-start-guide.md`
- **THEN** the page does not single out Claude Code as a higher support tier
  than Codex
- **AND** it explicitly states that any current differences are host UX /
  automation differences rather than support-tier differences
- **AND** the existing command examples remain available
