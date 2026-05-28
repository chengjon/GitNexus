## Why

The repository is clean from a worktree perspective, but the audit found a set
of governance and maintenance problems that are now slowing safe iteration:

- `main` has long-lived bidirectional divergence from `upstream/main`
- current fork divergence baseline is `276` commits unique to `upstream/main`
  and `208` commits unique to local `main`
- several technical-debt documents no longer match merged git history
- draft/export artifacts are tracked without a clear classification policy
- `gitnexus-web` still contains noisy or overly broad debug logging
- direct dependencies (`kuzu`, `kuzu-wasm`) are marked deprecated

These are not independent issues. They all reduce operator trust in the
repository's current state. The right near-term move is to converge on the
latest merged document direction, make the repository state legible again, and
turn the remaining debt into explicit tracked work instead of ambiguous residue.

## What Changes

- Add an authoritative audit record for the current technical-debt and residual
  findings.
- Sync stale debt/remediation documents so they reflect current `main` instead
  of historical feature-branch or pending-merge states.
- Classify tracked draft/export artifacts and either keep, move, or stop
  tracking them, using `docs/archive/` as the durable in-repo destination for
  retained material.
- Reduce or gate repository-local debug logging in `gitnexus-web`.
- Record deprecated dependency debt and the current expected mitigation path,
  including the deprecated CLI transitive chain (`tar`, `npmlog`, `gauge`,
  `are-we-there-yet`, `boolean`).
- Document an explicit upstream convergence strategy that prefers aligning with
  the latest local document modifications before attempting broader backflow to
  `upstream/main`, and define the next doc/governance-only review step without
  doing the full integration in this change.

## Capabilities

### New Capabilities

- `repo-hygiene-doc-convergence`: Keep repository governance artifacts, tracked
  residual assets, and convergence planning aligned with current merged state.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md`
  - `docs/superpowers/specs/2026-03-24-local-backend-handler-first-design.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
  - `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`
- Affected tracked residual artifacts:
  - legacy staging dirs `.sisyphus/drafts/*` and `tmp_exports/*`
  - archived replacements under `docs/archive/**/*`
- Affected code:
  - `gitnexus-web/src/core/llm/agent.ts`
  - `gitnexus-web/src/workers/ingestion.worker.ts`
  - `gitnexus-web/src/core/ingestion/import-processor.ts`
- Affected governance/spec assets:
  - `openspec/changes/2026-04-06-repo-hygiene-doc-convergence/specs/repo-hygiene-doc-convergence/spec.md`
