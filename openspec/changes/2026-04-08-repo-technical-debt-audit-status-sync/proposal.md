## Why

The 2026-04-06 repository technical-debt audit is intentionally a historical
baseline, but one of its findings now reads like current unresolved debt:
`detect_changes` host validation.

Later governance slices closed the repository’s required primary host surface
for Codex and Claude Code. Without an explicit status sync, maintainers can
still misread the original audit finding as the current repo state.

## What Changes

- Record a docs-only status-sync slice for the 2026-04-06 technical-debt audit
- Add status-sync notes to the baseline audit so the later detect_changes host
  closure is visible without rewriting the original baseline
- Update the roadmap entry for the baseline audit so readers can follow the
  newer status-sync path
- Keep the verification writeback explicit about which statements are
  historical baseline records, which are current staged measurements, and
  which are inference-only boundary conclusions
- Keep the baseline audit explicit about which preserved reasoning remains
  capture-time context, which remediation-roadmap entry is now the current
  backlog entrypoint,
  and which remediation-roadmap entry also serves as the current stale-doc
  follow-up index
- Keep the host-validation finding explicit about which later status-sync note
  is the current host-follow-up record

## Capabilities

### New Capabilities

- `repo-technical-debt-audit-status-sync`: Keep the historical repository
  technical-debt audit legible after later governance slices partially close
  one of its original findings.

### Modified Capabilities

- None.

## Impact

- Affected docs:
  - `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md`
  - `docs/audits/2026-04-08-repo-technical-debt-audit-status-sync.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Reused evidence:
  - `2026-04-07-detect-changes-host-compatibility-matrix-baseline`
  - `2026-04-07-detect-changes-claude-code-cwd-live-probe`
  - `2026-04-07-detect-changes-primary-dual-cli-host-convergence`
- Verification semantics:
  - name the remediation roadmap explicitly when the baseline audit points
    readers to the current backlog entrypoint and current stale-doc
    follow-up index
  - phrase later stale-doc follow-up as roadmap-linked repository-local
    truth-sync slices rather than as an unbounded set of later records
  - use reader-note wording when preserved evidence/rationale/recommended
    direction text remains baseline context rather than current priority
  - preserve historical baseline metrics as historical records
  - record current staged `detect_changes` output as measured evidence
  - record the staged docs-only file inventory from `git diff --cached --name-only`
  - require a clean `git diff --cached --check` result for final writeback
  - carry through measured staged metadata such as `risk_level`,
    `path_resolution`, and `fallback_reason`
  - carry through measured path-alignment metadata such as `scope`,
    `git_repo_path`, `git_diff_path`, and `process_cwd`
  - explain that `changed_files=8` and `changed_symbols=7` use different
    scopes because staged `.openspec.yaml` counts as a file but not as an
    indexed entry
  - explain that this docs-only slice's `changed_symbols=7` refers to
    file-level indexed entries rather than function/class/method symbols
  - derive the indexed-entry inventory directly from
    `changed_symbols[*].filePath`, not from manual regrouping
  - verify that the written indexed-entry inventory is checked item-by-item
    against that same `changed_symbols[*].filePath` output
  - derive path-alignment notes directly from the JSON `metadata` object, not
    from later inference
  - verify that the written staged file inventory is checked item-by-item
    against the same `git diff --cached --name-only` output
  - derive reference-closure conclusions from a repository-local staged-content
    scan against `HEAD` plus the current staged path set, after normalizing
    extracted path tokens
  - treat the slice's `docs-only` label as justified by the staged path
    inventory itself, not as a generic label applied after the fact
  - mark reference-closure and field-mapping statements as interpretation
    layers derived from the measured output
