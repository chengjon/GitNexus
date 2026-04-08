# secondary-entrypoint-host-framing-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep secondary entrypoint docs aligned with the primary dual-CLI host framing

GitNexus SHALL keep secondary entrypoint docs aligned with the repository's
primary maintained `Claude Code + Codex` host framing while preserving optional
host references where they are still useful.

#### Scenario: A maintainer reads the quick-start guide or eval README

- **WHEN** they read `docs/gitnexus-quick-start-guide.md` or `eval/README.md`
- **THEN** the docs do not blur the repository's primary maintained CLI pair
  with optional or analogy-only external hosts
- **AND** they still preserve optional host examples or neutral host analogies
  where those are useful to the reader
