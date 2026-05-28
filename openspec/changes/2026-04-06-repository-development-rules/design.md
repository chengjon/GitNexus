## Design

This change keeps one canonical repository-governance source of truth at the
root and avoids duplicating full policy text across multiple entrypoints.

### 1. Canonical policy stays in one root document

`DEVELOPMENT_RULES.md` is the only full governance authority. README, PR
template, and AI context files link to it rather than reproducing the full rule
set.

### 2. AI entrypoint references stay outside the generated GitNexus block

Top-level `AGENTS.md` and `CLAUDE.md`, plus the `gitnexus/` copies, prepend
their repository-governance references above the `gitnexus:start` marker. This
preserves the policy reference across `refresh-context` runs because the
generator only replaces content inside the marker block.

### 3. One shared automation path handles both CI surfaces

`gitnexus/scripts/ci/repository-governance-check.mjs` provides:

- managed-path filename hygiene checks
- compatibility-file metadata checks for newly added compatibility-like files
- PR body governance and metrics-structure validation

This avoids maintaining separate overlapping rule engines in different workflow
files.

### 4. PR validation focuses on explicit review contracts

The PR template and workflow require explicit fields for:

- canonical path
- compatibility-layer or shim note
- exit condition
- deletion reachability
- GitNexus evidence
- measured, inferred, and historical-baseline metrics classification

When managed-path deletions or rename-based path retirement occur, governance
notes must explicitly cite GitNexus evidence and cover runtime, scripts or
automation, config or env branches, and tests or fixtures.

## Success Criteria

- Contributors can find one canonical governance document from both human and AI
  entrypoints.
- Managed paths reject backup-style or stray temporary filenames in CI.
- Newly added compatibility-like files require inline `CANONICAL PATH:` and
  `EXIT CONDITION:` markers.
- PR governance validation fails if required structure or deletion evidence is
  missing.
