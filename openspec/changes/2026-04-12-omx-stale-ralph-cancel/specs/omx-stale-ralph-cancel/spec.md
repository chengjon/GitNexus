# omx-stale-ralph-cancel Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep a formal operator record for safe stale Ralph cleanup

GitNexus SHALL keep a local governance record for the shortest safe OMX command
that clears a stale Ralph startup session without presenting it as a generic
force-clear.

#### Scenario: A maintainer encounters Ralph stuck in `starting`

- **WHEN** they consult the repository record for the recurring local warning
- **THEN** the record points them to `omx cancel ralph --stale` as the shortest
  safe operator command
- **AND** the record explains that the command is intended only for stale Ralph
  startup state, not general mode termination

#### Scenario: A maintainer checks the safety boundary for stale cleanup

- **WHEN** they read the design and implementation record
- **THEN** the repository explains that stale cleanup is session-scoped by
  default
- **AND** it records refusal cases for fresh or actively executing Ralph runs
- **AND** it records that successful cleanup terminalizes Ralph state and clears
  the matching skill-active state

#### Scenario: A maintainer audits the root-fallback edge case

- **WHEN** they inspect the follow-up audit evidence for stale cleanup
- **THEN** they can see that a terminal session-scoped Ralph entry does not
  prevent safe cleanup of a stale legacy root Ralph entry
- **AND** they can see that the matching root `skill-active-state` is cleared
  when the session-scoped copy is already inactive

### Requirement: GitNexus SHALL retain verification and replay evidence for stale Ralph cleanup

GitNexus SHALL keep repository-local evidence showing that the documented stale
Ralph cleanup command was implemented and verified in the local OMX runtime
environment.

#### Scenario: A maintainer audits whether the command actually worked

- **WHEN** they inspect the implementation audit
- **THEN** they can find focused compiled test evidence
- **AND** they can find live workspace command output
- **AND** they can find proof that the stop-hook no longer blocks after stale
  cleanup

#### Scenario: A maintainer wants to upstream the local fix

- **WHEN** they inspect the replay note
- **THEN** they can find the installed-package file anchors and test anchors
- **AND** they can see the minimum replay checklist for porting the fix into the
  canonical `oh-my-codex` source repository
- **AND** they can see the two local upstream replay commits that captured the
  original stale-cancel fix and the later root-fallback follow-up
