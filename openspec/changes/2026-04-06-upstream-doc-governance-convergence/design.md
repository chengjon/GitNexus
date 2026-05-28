# Upstream Doc And Governance Convergence Design

## Goal

Turn the refreshed `upstream/main` divergence into a bounded doc/governance
review plan, without pretending that every upstream doc change should be merged
immediately.

## Design Principles

### 1. Refresh upstream before reasoning about convergence

Any convergence plan that starts from stale remote refs is untrustworthy. This
change therefore uses `git fetch upstream` first and records the refreshed
baseline of `276` upstream-only commits and `208` local-only commits.

### 2. Shared top-level docs need manual reconcile

`README.md`, `AGENTS.md`, and `CLAUDE.md` carry both local and upstream meaning.
They must be reviewed as manual reconcile hotspots, not replayed through bulk
directory copy or broad cherry-pick assumptions.

### 3. Code-coupled upstream docs stay deferred until code convergence exists

Upstream docs for COBOL support or PR626 fix waves should not be replayed into
local `main` as doc-only changes while the corresponding code paths are still
divergent.

### 4. Local governance history is allowed to stay fork-local

Superpowers plans/specs, OpenSpec archives, and repo-internal agent guides are
part of this fork's operating model. They do not need to be forced upstream to
justify their existence.

### 5. Replay order matters

Agent-behavior files come before README polish. Shared safety instructions
should be reconciled first because they influence all later changes.

## Workstreams

### Workstream A: Refresh And Record The Baseline

Capture the fetched `upstream/main` state and the current doc/governance diff
surface in a durable review artifact.

### Workstream B: Classify Local-Only Files

Separate local fork governance records from local docs that might eventually be
proposed upstream.

### Workstream C: Classify Upstream-Only Files

Separate upstream code-coupled docs that must wait from shared hotspots that
need manual reconcile now.

### Workstream D: Define Replay Sequence

Write the order and rule set for the next operator, limited to doc/governance
review rather than full branch integration.

## Out Of Scope

- full upstream merge or rebase execution
- replay of code-coupled upstream docs without matching code convergence
- normalizing every local planning artifact into upstream-compatible prose

## Verification

This change is complete when:

1. a refreshed convergence baseline report exists
2. local-only and upstream-only doc/governance surfaces are explicitly
   classified
3. shared hotspot files are named and prioritized
4. the next operator has a doc/governance-only replay order that does not rely
   on stale remote refs
