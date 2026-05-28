## Design

This slice updates only governance and audit documents.

- keep the 2026-04-06 audit as a historical pre-repair baseline
- add explicit status-sync notes instead of replacing the original finding text
- point readers from the baseline audit and roadmap to the later detect_changes
  host-governance closure documents
- name the remediation roadmap explicitly when the baseline audit points to
  the current backlog entrypoint and current stale-doc follow-up index
- name the later status-sync note explicitly when the host-validation finding
  points to the current host-follow-up record
- describe later stale-doc follow-up through the remediation roadmap's linked
  repository-local truth-sync slices rather than through a generic "later
  records" bucket
- use reader-note wording where preserved baseline reasoning could otherwise be
  mistaken for the current repository priority
- separate verification writeback into:
  - historical baseline records
  - current staged measured output
  - inference-only boundary conclusions
- include the staged docs-only workset inventory as explicit measured scope
- require a clean `git diff --cached --check` result before treating the final
  audit writeback as complete
- include measured staged metadata (`risk_level`, `path_resolution`,
  `fallback_reason`) in the verification writeback instead of leaving them
  implicit in raw tool output
- include measured path-alignment metadata (`scope`, `git_repo_path`,
  `git_diff_path`, `process_cwd`) so the staged workset provenance is explicit
- document that `changed_files` and `changed_symbols` intentionally use
  different scopes for this slice because `.openspec.yaml` is staged text
  inventory but not an indexed entry
- document field-mapping explicitly when the raw tool summary names
  (`changed_count`, `affected_count`) are rendered in more readable audit prose
  (`changed_symbols`, `affected_processes`)
- document that the resulting `changed_symbols` count refers to file-level
  indexed entries for this docs-only slice, not code-level symbols
- document the source mapping explicitly:
  - staged file inventory comes from `git diff --cached --name-only`
  - indexed-entry inventory comes from `changed_symbols[*].filePath`
  - path-alignment metadata comes from the staged JSON `metadata` object
  - reference-closure conclusions come from a staged-content path scan checked
    against `HEAD` plus the current staged path set after token normalization
- document inventory coherence explicitly:
  - the written staged file inventory is checked item-by-item against the same
    `git diff --cached --name-only` output
  - the written indexed-entry inventory is checked item-by-item against the
    same `changed_symbols[*].filePath` output
- document the scope boundary explicitly:
  - the `docs-only` label is justified by the measured staged path inventory
  - no `gitnexus/src/**`, `gitnexus-web/src/**`, test, or dependency-manifest
    paths appear in the staged set
