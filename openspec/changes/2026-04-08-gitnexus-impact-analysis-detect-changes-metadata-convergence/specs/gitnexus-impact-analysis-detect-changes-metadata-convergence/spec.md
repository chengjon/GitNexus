# gitnexus-impact-analysis-detect-changes-metadata-convergence Specification Delta

## ADDED Requirements

### Requirement: GitNexus SHALL keep `gitnexus-impact-analysis` detect-changes guidance aligned with the current metadata contract

GitNexus SHALL keep both `gitnexus-impact-analysis` skill-doc surfaces aligned
with the current `gitnexus_detect_changes` metadata and path-verification
contract.

#### Scenario: A maintainer reads either `gitnexus-impact-analysis` skill doc

- **WHEN** they read `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md`
  or `gitnexus/skills/gitnexus-impact-analysis.md`
- **THEN** the docs show that `gitnexus_detect_changes` returns
  `git_repo_path`, `git_diff_path`, `process_cwd`, `path_resolution`, and
  `fallback_reason`
- **AND** the checklist tells readers to verify those fields during pre-commit
  impact review
- **AND** `path_resolution = registry_repo` is described as a fallback that
  needs interpretation rather than the default happy path
