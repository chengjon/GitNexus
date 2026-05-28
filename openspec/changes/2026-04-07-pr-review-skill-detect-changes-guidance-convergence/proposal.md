## Why

The PR review skill drifted behind the current `detect_changes` contract.

Its examples still taught a pre-convergence call shape that omitted `repo` in
multi-repo sessions, and the source skill and checked-in installed copy had
already begun to drift apart.

## What Changes

- Add a focused regression test for the PR review skill guidance contract
- Update both PR review skill copies to teach the current `repo` / `cwd`
  guidance
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `pr-review-skill-detect-changes-guidance-convergence`: Keep the PR review
  skill aligned with the current `detect_changes` contract.

### Modified Capabilities

- None.

## Impact

- Affected tests:
  - `gitnexus/test/unit/pr-review-skill.test.ts`
- Affected skill docs:
  - `gitnexus/skills/gitnexus-pr-review.md`
  - `.claude/skills/gitnexus/gitnexus-pr-review/SKILL.md`
- Affected docs:
  - `docs/audits/2026-04-07-pr-review-skill-detect-changes-guidance-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
