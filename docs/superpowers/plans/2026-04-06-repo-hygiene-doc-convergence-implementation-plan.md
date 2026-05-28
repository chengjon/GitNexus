# Repo Hygiene And Documentation Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align repository governance docs with current `main`, classify tracked residual artifacts, and execute the first repair wave for the 2026-04-06 repository hygiene audit.

**Architecture:** Treat current local `main` as the near-term source of truth, then update stale debt documents to match merged history. Move ambiguous tracked drafts/exports into clearer archival locations and block future residue with ignore rules. Leave code-level logging cleanup and dependency mitigation as later waves once doc truth-sync is complete.

**Tech Stack:** Markdown, OpenSpec, Git, repository governance docs

---

> **Execution status sync note (2026-04-07):** Synced against `openspec/changes/2026-04-06-repo-hygiene-doc-convergence/tasks.md`.

### Task 1: Sync Stale Governance Status Documents

**Files:**
- Modify: `docs/superpowers/specs/2026-03-24-local-backend-handler-first-design.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
- Modify: `docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md`
- Reference: `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md`

- [x] **Step 1: Re-read stale status text and current merged-history evidence**

Run:

```bash
sed -n '1,40p' docs/superpowers/specs/2026-03-24-local-backend-handler-first-design.md
sed -n '250,340p' docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md
sed -n '40,90p' docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md
git log --oneline --grep='local-backend' --all | sed -n '1,20p'
git log --oneline --grep='wiki' --all | sed -n '1,40p'
```

Expected: the docs still describe merged work as pending, and the git log shows the later merged state.

- [x] **Step 2: Update the stale status language to current `main` reality**

Changes to make:

- mark the LocalBackend handler-first design as landed on current `main`
- replace obsolete “pending merge / pending push” wording in the remediation roadmap with current-state and next-step wording
- reframe incomplete `cwd` passthrough host checks as explicitly deferred follow-up compatibility validation instead of unqualified open checklist debt

- [x] **Step 3: Verify the stale phrases are gone or intentionally reframed**

Run:

```bash
rg -n 'pending merge|当前 worktree|已提交切片|其他 MCP 客户端是否传入 cwd|Cursor 在 worktree 场景下是否传入 cwd|Claude Code 在 worktree 场景下是否传入 cwd' \
  docs/superpowers/specs/2026-03-24-local-backend-handler-first-design.md \
  docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md \
  docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md
```

Expected: only intentional current-state language remains.

- [x] **Step 4: Commit the document truth-sync slice**

```bash
git add docs/superpowers/specs/2026-03-24-local-backend-handler-first-design.md \
        docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md \
        docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md
git commit -m "docs: sync repository debt status with current main"
```

### Task 2: Reclassify Tracked Residual Artifacts

**Files:**
- Move: `.sisyphus/drafts/gitnexus-brainstorming.md`
- Move: `.sisyphus/drafts/noodlbox-comparison.md`
- Move: `tmp_exports/GITNEXUS_AI_CLI_MCP_PLAYBOOK_2026-03-10.md`
- Move: `tmp_exports/mystocks_spec/*`
- Modify: `.gitignore`
- Create: `docs/archive/drafts/`
- Create: `docs/archive/playbooks/`
- Create: `docs/archive/external-audits/mystocks_spec/`

- [x] **Step 1: Check whether tracked residual files are referenced elsewhere**

Run:

```bash
rg -n 'tmp_exports/|\\.sisyphus/|GITNEXUS_AI_CLI_MCP_PLAYBOOK|mystocks_spec' README.md AGENTS.md docs openspec .github
git ls-files .sisyphus tmp_exports
```

Expected: few or no hard references outside archival/planning context, and the tracked residual set is explicit.

- [x] **Step 2: Move tracked drafts and exports into clearer archive locations**

Commands:

```bash
mkdir -p docs/archive/drafts docs/archive/playbooks docs/archive/external-audits/mystocks_spec
mv .sisyphus/drafts/gitnexus-brainstorming.md docs/archive/drafts/2026-03-10-gitnexus-brainstorming.md
mv .sisyphus/drafts/noodlbox-comparison.md docs/archive/drafts/2026-03-10-noodlbox-comparison.md
mv tmp_exports/GITNEXUS_AI_CLI_MCP_PLAYBOOK_2026-03-10.md docs/archive/playbooks/2026-03-10-gitnexus-ai-cli-mcp-playbook.md
mv tmp_exports/mystocks_spec/* docs/archive/external-audits/mystocks_spec/
```

Expected: tracked residual docs now live under `docs/archive/` with clearer purpose.

- [x] **Step 3: Prevent future residue from being reintroduced in the old locations**

Changes to make in `.gitignore`:

- ignore `.sisyphus/`
- ignore `tmp_exports/`

- [x] **Step 4: Verify the new archival layout**

Run:

```bash
find docs/archive -maxdepth 3 -type f | sort
git ls-files docs/archive .sisyphus tmp_exports
```

Expected: archived files are tracked under `docs/archive/`, while the old residue directories no longer need to stay active repository surfaces.

- [x] **Step 5: Commit the residual-artifact disposition slice**

```bash
git add docs/archive .gitignore
git add -A .sisyphus tmp_exports
git commit -m "docs: archive residual drafts and exports"
```

### Task 3: Refresh Audit And OpenSpec References After The Moves

**Files:**
- Modify: `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md`
- Modify: `openspec/changes/2026-04-06-repo-hygiene-doc-convergence/proposal.md`
- Modify: `openspec/changes/2026-04-06-repo-hygiene-doc-convergence/design.md`
- Modify: `openspec/changes/2026-04-06-repo-hygiene-doc-convergence/tasks.md`

- [x] **Step 1: Update path references that still point at `.sisyphus/` and `tmp_exports/`**

Run:

```bash
rg -n '\\.sisyphus/|tmp_exports/' \
  docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md \
  openspec/changes/2026-04-06-repo-hygiene-doc-convergence
```

Expected: the audit/OpenSpec files currently still reference the old residual locations.

- [x] **Step 2: Rewrite those references to the new archive locations and policy wording**

Changes to make:

- mention `docs/archive/` as the chosen disposition
- note that `.sisyphus/` and `tmp_exports/` are no longer the preferred tracked homes for those artifacts

- [x] **Step 3: Re-run OpenSpec validation**

Run:

```bash
openspec validate --changes 2026-04-06-repo-hygiene-doc-convergence
```

Expected: `1 passed, 0 failed`.

- [x] **Step 4: Commit the reference-cleanup slice**

```bash
git add docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md \
        openspec/changes/2026-04-06-repo-hygiene-doc-convergence
git commit -m "docs: align audit and openspec archive references"
```

### Task 4: Final Verification For The Documentation Wave

**Files:**
- Verify: `docs/audits/2026-04-06-repo-technical-debt-and-residual-audit.md`
- Verify: `docs/archive/**/*`
- Verify: `openspec/changes/2026-04-06-repo-hygiene-doc-convergence/**/*`

- [x] **Step 1: Inspect the final diff concentration**

Run:

```bash
git diff --stat
git diff -- docs/audits docs/archive .gitignore openspec/changes/2026-04-06-repo-hygiene-doc-convergence docs/superpowers/specs/2026-03-24-local-backend-handler-first-design.md docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md docs/superpowers/specs/2026-03-25-detect-changes-worktree-resolution-review.md
```

Expected: only intended repository-hygiene and document-convergence changes are present.

- [x] **Step 2: Confirm repository and OpenSpec status**

Run:

```bash
git status --short --branch
openspec validate --changes 2026-04-06-repo-hygiene-doc-convergence
```

Expected: scoped git status shows only intended repo-hygiene changes, unrelated pre-existing worktree changes are called out separately, and OpenSpec validation passes.

- [x] **Step 3: Record the next execution wave**

Document in the working summary or follow-up note:

- next wave is dependency replacement review for `kuzu` / `kuzu-wasm`
- then the first `upstream/main` doc/governance-only convergence review
- and, once `gitnexus-web` dependencies are restored locally, build or type-level verification for the logging cleanup wave
