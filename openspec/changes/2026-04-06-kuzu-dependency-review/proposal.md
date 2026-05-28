## Why

The 2026-04-06 repository audit already recorded direct dependency debt around
CLI `kuzu` and web `kuzu-wasm`, plus a deprecated transitive chain under the
current CLI install graph.

That debt is now explicit, but it is still mixed into broader repo-hygiene
notes. The next operator needs a dedicated review slice with clear decision
criteria instead of re-deriving the same questions from scattered audit prose.

## What Changes

- Add a dedicated OpenSpec change for the `kuzu` / `kuzu-wasm`
  upgrade-or-replacement review.
- Define separate CLI and web review tracks.
- Record the allowed outcomes: upgrade, replacement, or rationale-backed pin.
- Keep the current dependency line classified as a tracked exception until that
  review completes.

## Capabilities

### New Capabilities

- `kuzu-dependency-review`: Keep deprecated `kuzu` and `kuzu-wasm` dependency
  debt on an explicit review track with bounded decision outcomes.

### Modified Capabilities

- None.

## Impact

- Affected planning docs:
  - `docs/audits/2026-04-06-kuzu-dependency-review.md`
  - `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
