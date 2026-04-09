# upstream-shared-doc-replay-status-sync Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep shared-doc upstream replay baselines current after refreshed upstream fetches

GitNexus SHALL refresh the shared-doc replay baseline records when a later
`git fetch upstream` materially changes the live `upstream/main` commit or
divergence count used by repository-governance decisions.

#### Scenario: A later fetch advances upstream/main after an earlier replay review

- **WHEN** maintainers refresh `upstream/main` after an earlier baseline or
  replay-review report
- **THEN** the repository records the newer upstream commit and divergence
  baseline in a follow-up status-sync artifact
- **AND** the historical report remains a dated snapshot rather than being
  silently rewritten
- **AND** the latest replay decision is easy to discover from the older report
