# repo-hygiene-doc-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep repository hygiene audits as durable records

GitNexus SHALL store repository-wide technical-debt and residual audits in a
stable documentation location so that cleanup work is grounded in an
authoritative artifact.

#### Scenario: A repository audit is recorded

- **WHEN** maintainers complete a repository hygiene review
- **THEN** the audit is saved under `docs/audits/` with findings, evidence, and
  recommended repair order

### Requirement: GitNexus SHALL sync stale governance status text to current merged history

GitNexus SHALL not leave debt or remediation documents claiming that already
merged work is still pending without an explicit note that the document is
historical.

#### Scenario: A document still says merged work is pending

- **WHEN** maintainers verify that the work has already landed on current
  `main`
- **THEN** they update the document to reflect present status or clearly mark it
  as historical context

### Requirement: GitNexus SHALL classify tracked residual artifacts

GitNexus SHALL give tracked draft, brainstorming, or exported analysis files an
explicit disposition instead of leaving them as ambiguous repository residue.

#### Scenario: A tracked artifact is local-only residue

- **WHEN** maintainers determine that a tracked draft or export is not a durable
  repository asset
- **THEN** they move it to a clearer archive location or stop tracking it and
  prevent accidental reintroduction

#### Scenario: A tracked artifact is intentionally durable

- **WHEN** maintainers determine that a tracked draft or export remains useful
  project documentation
- **THEN** they keep it in-repo with a location and naming convention that makes
  its purpose clear

### Requirement: GitNexus SHALL gate or reduce noisy web debug logging

GitNexus SHALL avoid unconditional or overly detailed local web logging for
normal development flows.

#### Scenario: Worker logging is only diagnostic noise

- **WHEN** a browser worker emits repetitive unconditional console logs during
  normal operation
- **THEN** maintainers gate or remove those logs

#### Scenario: Failure logging includes broad content dumps

- **WHEN** diagnostic logging would print large prompt or source-content
  excerpts by default
- **THEN** maintainers replace that output with narrower structured diagnostics
  or stronger gating

### Requirement: GitNexus SHALL record deprecated direct dependency debt

GitNexus SHALL treat deprecated direct dependencies and critical deprecated
transitive chains as explicit technical debt with an intended mitigation path.

#### Scenario: A direct dependency becomes deprecated

- **WHEN** a directly declared package used by GitNexus is marked deprecated
- **THEN** maintainers record the risk and note whether the planned response is
  upgrade, replacement, pinning, or temporary acceptance

### Requirement: GitNexus SHALL document upstream convergence direction

GitNexus SHALL document the preferred direction for future convergence toward
`upstream/main` when local `main` has become a long-lived fork.

#### Scenario: Local docs and upstream history differ

- **WHEN** maintainers prepare future upstream convergence work
- **THEN** they first align stale local docs with current merged local reality
  and use the latest accepted local document direction as the replay baseline
