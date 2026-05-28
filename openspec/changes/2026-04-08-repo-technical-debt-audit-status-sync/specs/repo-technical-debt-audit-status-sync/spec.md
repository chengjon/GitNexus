# repo-technical-debt-audit-status-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep historical repository technical-debt audit baselines legible after later governance closure

GitNexus SHALL keep historical repository technical-debt audit baselines
legible after later governance slices partially close one of the original
findings.

#### Scenario: A maintainer reads the 2026-04-06 repository technical-debt audit after later host-governance closure

- **WHEN** a maintainer reads `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md`
- **THEN** the document still presents itself as a historical pre-repair baseline
- **AND** the `detect_changes` host-validation finding includes a status-sync pointer to the later closure artifacts
- **AND** any host-side current-follow-up pointer identifies that later
  status-sync note as the current host-follow-up record
- **AND** any current backlog pointer explicitly names the remediation roadmap
  as the current backlog entrypoint for stale-doc prioritization
- **AND** any stale-doc current-follow-up pointer identifies that same
  remediation-roadmap entry as the current stale-doc follow-up index
- **AND** any later stale-doc follow-up is described through remediation-roadmap-linked
  repository-local truth-sync slices rather than an unbounded set of later records
- **AND** any preserved evidence, rationale, or recommended-direction text
  that remains baseline-only context is called out as such with a reader note
- **AND** the reader is not forced to treat the old baseline finding as current blocking debt

#### Scenario: A maintainer reviews the verification notes for the status-sync slice

- **WHEN** a maintainer reads the status-sync audit note and its OpenSpec task record
- **THEN** historical baseline metrics remain labeled as historical records
- **AND** current staged `detect_changes` output is labeled as measured evidence
- **AND** the staged docs-only file inventory is recorded as measured scope
- **AND** the final writeback records that `git diff --cached --check` is clean
- **AND** the measured staged metadata includes `risk_level`,
  `path_resolution`, and `fallback_reason`
- **AND** the measured staged metadata also records `scope`,
  `git_repo_path`, `git_diff_path`, and `process_cwd`
- **AND** any difference between `changed_files` and `changed_symbols` is explained as a scope difference rather than an inconsistency
- **AND** the slice's `changed_symbols` terminology is labeled as file-level indexed entries when no code-level symbols are involved
- **AND** the recorded inventories identify their raw sources
  (`git diff --cached --name-only` and `changed_symbols[*].filePath`)
- **AND** the recorded staged file inventory is checked item-by-item against
  the same `git diff --cached --name-only` output
- **AND** the recorded indexed-entry inventory is checked item-by-item against
  the same `changed_symbols[*].filePath` output
- **AND** the recorded path-alignment notes identify the raw `metadata` source
- **AND** any reference-closure conclusion identifies that it came from a
  staged-content path scan checked against `HEAD` plus the staged path set
  after token normalization
- **AND** the slice's `docs-only` boundary is justified by the measured staged
  path inventory rather than by an unsupported assertion
- **AND** reference-closure or field-mapping notes are labeled as inference or presentation layers rather than new measured facts
