# Upstream Shared Doc Replay Review Design

## Goal

Decide whether the latest shared upstream doc changes can be replayed safely
after the refreshed `upstream/main` fetch, without reopening full
doc/governance convergence work.

## Design Principles

### 1. Refresh before every replay decision

The earlier baseline was correct when written, but not after `upstream/main`
advanced again. This follow-up therefore starts from a fresh fetch and a new
divergence count.

### 2. Shared files require code-truth cross-checks

Shared docs can only be replayed when the claims they make still match current
local code and governance reality. Diff review alone is not enough.

### 3. Prior safe replay slices stay landed

The earlier safe slices for `Codex` support wording and structured local agent
headers remain part of the accepted local direction. This change only asks
whether any additional shared replay is safe now.

### 4. "No replay" is a valid outcome

If the latest upstream doc changes remain code-coupled or reference absent
local docs, the correct result is to record that no new replay should land.

## Verification

This change is complete when:

1. the latest divergence baseline is recorded
2. the shared replay hotspots are reviewed against current local source
3. the repo has an explicit answer on whether any new shared replay is safe now
