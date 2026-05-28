## Why

The `gitnexus-impact-analysis` skill still stops at telling readers to pass
`repo` and `cwd` for multi-repo or worktree scenarios, but it does not explain
which `gitnexus_detect_changes` metadata fields confirm the analysis path or
how to interpret a fallback.

That leaves both the source and package impact-analysis skill docs behind the
current `detect_changes` path-resolution contract.

## What Changes

- Update both `gitnexus-impact-analysis` skill-doc surfaces so the
  `gitnexus_detect_changes` example includes the current metadata fields
- Add checklist guidance that requires checking `git_diff_path`,
  `process_cwd`, `path_resolution`, and `fallback_reason`
- Record the convergence in audit and roadmap docs

## Capabilities

### New Capabilities

- `gitnexus-impact-analysis-detect-changes-metadata-convergence`: Keep the
  source and package `gitnexus-impact-analysis` skill docs aligned with the
  current `detect_changes` metadata contract.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md`
  - `gitnexus/skills/gitnexus-impact-analysis.md`
  - `docs/audits/2026-04-08-gitnexus-impact-analysis-detect-changes-metadata-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused truth sources:
  - current impact-analysis skill docs
  - historical skills-review note
  - current `detect_changes` metadata contract
