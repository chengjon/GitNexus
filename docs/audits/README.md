# Audits Index

This directory is the status-verification entrypoint for repository audit
records, convergence notes, and truth-sync writeups. Use the repository README
and quick-start docs first for the main product workflow, then use this index
to confirm current state or read historical convergence records.

Governance rules: [DEVELOPMENT_RULES.md](/opt/claude/GitNexus/DEVELOPMENT_RULES.md)

PR governance template:
[../.github/PULL_REQUEST_TEMPLATE.md](/opt/claude/GitNexus/.github/PULL_REQUEST_TEMPLATE.md)

Primary repository entrypoint:
[../README.md](/opt/claude/GitNexus/README.md)

Documentation navigation entrypoint:
[../README.md](/opt/claude/GitNexus/docs/README.md)

## Start Here

- [2026-05-29-upstream-version-update-summary.md](/opt/claude/GitNexus/docs/audits/2026-05-29-upstream-version-update-summary.md)
  Operator-facing summary of the 2026-05-29 upstream refresh, including new
  capabilities, architecture changes, LadybugDB migration effects, MCP
  behavior, and local-source deployment boundaries.
- [2026-05-29-upstream-update-feedback-form.md](/opt/claude/GitNexus/docs/audits/2026-05-29-upstream-update-feedback-form.md)
  Fillable maintainer feedback form for reviewing the 2026-05-29 upstream
  update and collecting actionable operator/user feedback.
- [2026-04-12-omx-stale-ralph-cancel-implementation.md](/opt/claude/GitNexus/docs/audits/2026-04-12-omx-stale-ralph-cancel-implementation.md)
  Historical local implementation and verification record for `omx cancel ralph --stale`,
  including the later root-fallback edge case where terminal scoped Ralph state
  can hide a stale legacy root entry.
- [2026-04-12-omx-stale-ralph-upstream-replay-note.md](/opt/claude/GitNexus/docs/audits/2026-04-12-omx-stale-ralph-upstream-replay-note.md)
  Historical replay checklist and upstream status note for porting the verified local
  stale-Ralph fixes into a canonical `oh-my-codex` source checkout, including
  the clean upstream commits, the closed wrong-base PR `#1505`, the later
  closed dev-targeted follow-up PR `#1509`, the verified fork-only stop point
  `46622fa`, and the live stop-hook re-verification.
- [2026-04-09-docs-governance-cleanup-summary.md](/opt/claude/GitNexus/docs/audits/2026-04-09-docs-governance-cleanup-summary.md)
  Top-level closeout for the 2026-04-08/09 docs/governance cleanup line.
- [2026-04-09-language-support-operator-availability-matrix-convergence.md](/opt/claude/GitNexus/docs/audits/2026-04-09-language-support-operator-availability-matrix-convergence.md)
  Operator-facing support-tier and availability wording convergence for Kotlin / Swift vs built-in grammars.
- [2026-04-09-docs-truth-sync-slice-classification.md](/opt/claude/GitNexus/docs/audits/2026-04-09-docs-truth-sync-slice-classification.md)
  Detailed slice-by-slice classification, cleanup execution record, and reuse rules.
- [2026-04-09-read-only-git-index-and-alternate-object-store.md](/opt/claude/GitNexus/docs/audits/2026-04-09-read-only-git-index-and-alternate-object-store.md)
  Verification baseline for isolated staged replay when the real `.git` is read-only.
- [2026-04-08-mcp-mmap-root-cause-and-runtime-drain-audit.md](/opt/claude/GitNexus/docs/audits/2026-04-08-mcp-mmap-root-cause-and-runtime-drain-audit.md)
  Runtime root-cause baseline referenced by the docs/governance cleanup line.

## Notes

- Read the 2026-04-12 OMX stale Ralph implementation audit first if you need
  the historical implementation record and shortest operator fix for a
  lingering `phase: starting` warning.
- Read the 2026-04-12 stale Ralph upstream replay note when you need the
  historical PR timeline for `#1505` / `#1509` and the verified fork-only stop
  point `46622fa`.
- Read the 2026-04-09 docs governance cleanup summary first when you need
  current documentation and governance cleanup state.
- Read the slice classification audit when you need per-commit evidence.
- If an audit or cleanup line turns into a PR on this repository, keep the PR body aligned with the lightweight governance fields: `Line Scope`, one `Workline Lane`, `Current Source of Truth`, and the `Validation` closure notes.
- Keep original commit classification separate from current worktree cleanup status.
