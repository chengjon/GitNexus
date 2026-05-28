# upstream-shared-doc-replay-review Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL refresh shared-doc replay decisions when upstream advances again

GitNexus SHALL not rely indefinitely on an earlier same-day convergence baseline
once `upstream/main` has advanced again and maintainers are reconsidering
shared-file replay.

#### Scenario: Another upstream fetch changes the replay baseline

- **WHEN** maintainers fetch `upstream/main` again and the divergence baseline changes
- **THEN** the repository records the refreshed shared replay decision from the new baseline
- **AND** maintainers do not assume the previous replay conclusion is still current without review

### Requirement: GitNexus SHALL only replay shared upstream doc wording that matches local code and governance reality

GitNexus SHALL only replay shared upstream doc wording when that wording has
been checked against the current local code surface and governance files.

#### Scenario: A shared upstream README or agent doc advertises a capability not present locally

- **WHEN** the upstream wording depends on commands, package lines, languages, or root docs that are not present locally
- **THEN** the repository records the wording as deferred
- **AND** the correct result may be to apply no new shared replay slice
