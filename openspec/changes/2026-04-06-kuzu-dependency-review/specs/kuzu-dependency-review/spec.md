# kuzu-dependency-review Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep deprecated `kuzu` dependency debt on an explicit review track

GitNexus SHALL keep the deprecated CLI `kuzu` and web `kuzu-wasm` dependency
line on a dedicated review track rather than leaving it only as passive audit
prose.

#### Scenario: An operator plans the next dependency mitigation wave

- **WHEN** an operator reviews current dependency debt around `kuzu` or
  `kuzu-wasm`
- **THEN** the repository provides a dedicated dependency-review change with
  bounded outcomes
- **AND** the allowed outcomes are explicit: upgrade, replacement, or
  rationale-backed pin

#### Scenario: An unrelated change touches adjacent code while the dependency review is still open

- **WHEN** the dedicated dependency review has not been completed yet
- **THEN** the current deprecated dependency line remains treated as a tracked
  exception
- **AND** unrelated changes do not implicitly expand new product surface around
  that exception without review
