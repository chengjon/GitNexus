# Audits Index

This directory stores repository audit records, convergence notes, and truth-sync writeups.

Governance rules: [DEVELOPMENT_RULES.md](/opt/claude/GitNexus/DEVELOPMENT_RULES.md)

## Start Here

- [2026-04-12-omx-stale-ralph-cancel-implementation.md](/opt/claude/GitNexus/docs/audits/2026-04-12-omx-stale-ralph-cancel-implementation.md)
  Local implementation and verification record for `omx cancel ralph --stale`.
- [2026-04-12-omx-stale-ralph-upstream-replay-note.md](/opt/claude/GitNexus/docs/audits/2026-04-12-omx-stale-ralph-upstream-replay-note.md)
  Replay checklist for porting the verified local stale-Ralph fix into a canonical `oh-my-codex` source checkout.
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

- Read the 2026-04-12 OMX stale Ralph audits first if you need the shortest
  operator fix for a lingering `phase: starting` warning.
- Read the 2026-04-09 summary first if you need current state.
- Read the slice classification audit if you need per-commit evidence.
- Keep original commit classification separate from current worktree cleanup status.
