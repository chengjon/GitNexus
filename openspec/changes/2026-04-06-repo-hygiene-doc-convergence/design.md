# Repo Hygiene And Documentation Convergence Design

## Goal

Turn the audit findings into a bounded cleanup program that improves repository
truthfulness without over-scoping into unrelated refactors.

The key principle is: converge on current merged reality first, then decide how
to carry that reality forward toward `upstream/main`. Do not revive stale
"pending merge" narratives once the work has already landed on local `main`.

## Design Principles

### 1. Current `main` is the immediate source of truth

For debt tracking and remediation docs, the nearest operational truth is the
currently indexed and merged local `main`, not old feature-branch status text.

This change therefore updates stale documents by comparing them against current
history, not by replaying older assumptions.

### 2. Residual artifacts must be classified, not hand-waved

Tracked files under the legacy `.sisyphus/` and `tmp_exports/` staging
locations need an explicit decision:

- durable repository artifact
- archived supporting material
- local-only material that should stop being tracked

Leaving them in place without classification creates ongoing confusion for
agents and humans.

### 3. Debug logging should be explicit and intentionally scoped

`gitnexus-web` development logs should help with local diagnosis without
dumping prompts, file snippets, or repetitive state churn by default.

The cleanup direction is:

- keep logs that are rare and materially useful
- gate verbose logs behind explicit dev checks
- remove unconditional logs
- avoid content-dump logging where a concise structured message is enough

### 4. Dependency debt must be visible even if not fixed immediately

The `kuzu` and `kuzu-wasm` line is core to the product. Because those packages
are already marked deprecated, the repository needs an explicit debt record and
decision path rather than passive lockfile drift.

Current recorded baseline:

- `gitnexus/package-lock.json` marks `node_modules/kuzu@0.11.3` deprecated
- `gitnexus-web/package-lock.json` marks `node_modules/kuzu-wasm@0.11.3`
  deprecated
- the current CLI-side install graph also marks `tar@6.2.1`,
  `npmlog@6.0.2`, `gauge@4.0.4`, `are-we-there-yet@3.0.1`, and
  `boolean@3.2.0` deprecated

Near-term mitigation rule:

- accept the current line only as an explicit tracked exception
- evaluate supported upgrade or replacement paths in a dedicated follow-up
- if that follow-up cannot land immediately, pin the known-working versions with
  rationale instead of treating the lockfile warnings as ambient noise

### 5. Upstream convergence needs a documented strategy

Because the repository is now a long-lived fork, "just merge upstream later" is
not a strategy. This change records a near-term convergence rule:

- the current divergence baseline is `276` commits unique to `upstream/main`
  and `208` commits unique to local `main`
- first align stale governance/docs with current local merged state
- then compare against the latest `upstream/main`
- prefer forward-porting the latest accepted document direction instead of
  replaying obsolete intermediate wording
- do the next review as a doc/governance-only checklist before attempting any
  broader code-path integration

## Workstreams

### Workstream A: Audit Artifact

Create a durable audit MD under `docs/audits/` as the baseline record for the
current review.

### Workstream B: Documentation Truth Sync

Update stale debt/remediation/spec-review documents where git history already
proves the old status text is obsolete.

### Workstream C: Residual Artifact Disposition

Review the legacy `.sisyphus/` and `tmp_exports/` locations and decide which
files remain in-repo, which should move to `docs/archive/`, and which should
become ignored local material.

### Workstream D: Web Logging Cleanup

Reduce unconditional browser-worker logs and narrow high-detail error logging
in `gitnexus-web`.

### Workstream E: Dependency Debt Registry

Record deprecated dependency risk and assign the expected next decision:
upgrade, replace, pin, or accept temporarily with rationale. The recorded
baseline must include both direct deprecated packages and the current critical
deprecated transitive chain.

### Workstream F: Upstream Convergence Plan

Capture a documented fork-convergence approach that uses the latest local docs
as the baseline for any future replay to `upstream/main`. The next operator step
is a clean-branch review of doc and governance paths before any broader code
integration attempt.

## Out Of Scope

- broad runtime or architecture refactors unrelated to the audit
- immediate dependency replacement unless the mitigation is already clear
- a full upstream rebase/merge execution in this change
- cleanup of every historical planning document in the repository

## Verification

This change is complete when:

1. the audit MD exists and is referenced by the OpenSpec change
2. stale debt docs no longer claim obviously merged work is pending
3. tracked residual artifacts have an explicit disposition
4. `gitnexus-web` no longer emits the identified unconditional/noisy logs
5. deprecated dependency debt is explicitly recorded
6. the repository has a written upstream convergence strategy aligned to the
   latest local document direction
