# upstream-doc-governance-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL refresh upstream refs before doc/governance convergence review

GitNexus SHALL not record a convergence baseline for `upstream/main` from stale
remote refs when maintainers prepare doc/governance replay work.

#### Scenario: A convergence review starts

- **WHEN** maintainers begin a doc/governance convergence review against
  `upstream/main`
- **THEN** they refresh `upstream/main` first and record the resulting
  divergence baseline

### Requirement: GitNexus SHALL classify doc/governance diffs before replay

GitNexus SHALL classify doc/governance divergence into shared hotspots,
fork-local records, and upstream code-coupled docs before replaying any
wording.

#### Scenario: A file exists only on one side of the fork

- **WHEN** a doc or governance file appears only on local `main` or only on
  `upstream/main`
- **THEN** maintainers record whether it should stay local, be deferred with
  code convergence, or be considered for later selective replay

#### Scenario: A shared top-level doc differs on both sides

- **WHEN** shared files such as `README.md`, `AGENTS.md`, or `CLAUDE.md`
  diverge
- **THEN** maintainers review them as manual reconcile hotspots instead of
  bulk-replaying one side over the other
