## Why

The repository audit identified a recurring governance problem: migration and
cleanup decisions were being documented inconsistently across docs, AI context
files, PRs, and code review.

That inconsistency creates several concrete risks:

- duplicate implementations or long-lived compatibility layers can slip in
  without a clear retirement contract
- delete-or-rename decisions can be justified loosely without explicit
  reachability evidence
- metric claims can blur measured results, inference, and history
- temporary or backup-style files can accumulate in managed repository paths

The repository needs one canonical policy document, durable human and AI
entrypoints to it, and a lightweight automated backstop for the highest-value
rules.

## What Changes

- Add a canonical root governance document at `DEVELOPMENT_RULES.md`.
- Add short repository-governance pointers in AI entrypoint files and human
  contribution entrypoints.
- Add one shared governance-check script for managed-path hygiene and PR body
  governance validation.
- Wire the path hygiene check into quality CI and the PR body check into a
  dedicated pull-request workflow.

## Capabilities

### New Capabilities

- `repository-development-rules`: Keep repository-wide migration, deletion,
  metric, and temporary-artifact governance explicit and enforceable.

### Modified Capabilities

- None.

## Impact

- Affected governance docs:
  - `DEVELOPMENT_RULES.md`
  - `README.md`
  - `AGENTS.md`
  - `CLAUDE.md`
  - `gitnexus/AGENTS.md`
  - `gitnexus/CLAUDE.md`
  - `.github/PULL_REQUEST_TEMPLATE.md`
- Affected automation:
  - `.github/workflows/ci-quality.yml`
  - `.github/workflows/pr-governance.yml`
  - `gitnexus/scripts/ci/repository-governance-check.mjs`
  - `gitnexus/package.json`
- Affected tests:
  - `gitnexus/test/unit/repository-governance-check.test.ts`
  - `gitnexus/test/unit/repository-governance-integration.test.ts`
