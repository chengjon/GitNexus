# kuzu-dependency-exception-pinning Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL pin the current deprecated direct `kuzu` dependency line exactly while the replacement review remains open

GitNexus SHALL keep the currently accepted deprecated direct dependency line
exact rather than version-ranged while the dedicated replacement review remains
open.

#### Scenario: A contributor inspects the direct dependency declarations

- **WHEN** a contributor reads the CLI and web package manifests
- **THEN** `kuzu` and `kuzu-wasm` are declared as exact pinned direct
  dependencies rather than `^` semver ranges

#### Scenario: A contributor inspects the current mitigation record

- **WHEN** a contributor reads the dedicated dependency review audit
- **THEN** the audit states that exact pinning is the current tracked-exception
  mitigation, not the final replacement strategy
