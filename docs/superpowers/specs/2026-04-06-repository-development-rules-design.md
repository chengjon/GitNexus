# Repository Development Rules Design

Date: 2026-04-06  
Status: Approved in conversation  
Scope: `DEVELOPMENT_RULES.md`, `README.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/workflows/ci-quality.yml`, `.github/workflows/pr-governance.yml`, `gitnexus/package.json`, `gitnexus/scripts/ci/repository-governance-check.mjs`, `gitnexus/test/unit/repository-governance-check.test.ts`, `gitnexus/test/unit/repository-governance-integration.test.ts`, `AGENTS.md`, `CLAUDE.md`, `gitnexus/AGENTS.md`, `gitnexus/CLAUDE.md`

## Goal

Add repository-wide development governance rules for migration hygiene, duplicate-layer prevention, deletion safety, metric semantics, and temporary artifact cleanup.

## Design Decision

Use a single source of truth:

- put the full repository governance policy in `DEVELOPMENT_RULES.md`
- add a short human-facing pointer in `README.md`
- add merge-time checklist prompts in `.github/PULL_REQUEST_TEMPLATE.md`
- add automated governance enforcement through one shared CI script
- add short mandatory references in the top-level `AGENTS.md` and `CLAUDE.md`
- add the same short references in `gitnexus/AGENTS.md` and `gitnexus/CLAUDE.md` so subdirectory-local work still inherits the repository policy
- keep those references outside the GitNexus-generated marker block

## Why This Design

The top-level AI context files are partially managed by GitNexus. Their generated section is replaced by marker-aware refresh logic, so repository-specific governance text should not live inside that generated block.

Duplicating the full policy in both `AGENTS.md` and `CLAUDE.md` would create the same maintenance problem that the new rules are intended to prevent. A single canonical policy document keeps repository governance coherent and easier to update.

Automation should also stay centralized. One repository-governance check script can be reused by both CI path hygiene and pull-request body validation, which avoids building separate overlapping rule implementations.

## Rejected Alternatives

### Duplicate the full rules in both top-level context files

Rejected because it creates multiple authorities for the same policy and invites drift.

### Add repository-specific governance directly to `gitnexus/src/cli/ai-context.ts`

Rejected because it would turn this repository's local governance policy into product-wide generated output for future repositories indexed by GitNexus.

## File Changes

- Create `DEVELOPMENT_RULES.md` as the canonical governance document
- Add a short development-governance section to `README.md`
- Add a PR checklist template referencing `DEVELOPMENT_RULES.md`
- Add a shared governance check script for managed-path filename hygiene and PR body metrics-section validation
- Extend the shared governance script to require inline retirement metadata for newly added compatibility-like files
- Run the path hygiene check from CI quality gates
- Run the PR body validation from a dedicated PR workflow
- Prepend a short repository-governance preamble to `AGENTS.md`
- Prepend a short repository-governance preamble to `CLAUDE.md`
- Prepend equivalent repository-governance preambles to `gitnexus/AGENTS.md` and `gitnexus/CLAUDE.md`

## Success Criteria

- The repository has one canonical development-governance document
- Human contributors can discover that document from `README.md`
- PR authors see rule-specific review prompts during submission
- Managed repository paths fail CI if they introduce backup-style or stray temporary filenames
- `*_new.*` paths are handled separately as compatibility-layer artifacts rather than generic temp-file violations
- PRs that delete managed-path files or retire managed paths through rename/move must include explicit GitNexus evidence in the governance section, and that evidence must cite a concrete GitNexus tool call or `gitnexus://repo/...` resource while naming the retired path or canonical replacement path
- `Deletion Reachability:` notes for deletions and path retirement must explicitly cover runtime, scripts or automation, config or env branches, and tests or fixtures
- `Canonical Path:` must identify exactly one stable path rather than a list of candidate paths
- For compatibility-layer changes, `Canonical Path:` must point at the stable replacement path rather than the shim, compat, or `*_new` layer itself
- For compatibility-layer changes, `Compatibility Layer / Shim:` must name the actual shim or `*_new` path rather than a generic description
- For compatibility-layer changes, `Exit Condition:` must state a concrete retirement trigger rather than a placeholder like `TBD` or `later`
- Newly added compatibility-like files must keep file-body `CANONICAL PATH:` on the stable replacement path and file-body `EXIT CONDITION:` on a concrete retirement trigger
- PRs fail governance validation if they remove explicit `Canonical Path`, `Compatibility Layer / Shim`, `Exit Condition`, `Deletion Reachability`, `Measured`, `Inferred`, or `Historical Baseline` fields from the PR body structure
- Newly added compatibility-like files fail governance validation if they omit inline `CANONICAL PATH:` or `EXIT CONDITION:` markers
- Both top-level AI entrypoint files direct readers to that document
- The `gitnexus/` subdirectory AI entrypoint files also direct readers to that document
- Each new preamble survives GitNexus context refresh behavior because it sits outside the generated marker block
