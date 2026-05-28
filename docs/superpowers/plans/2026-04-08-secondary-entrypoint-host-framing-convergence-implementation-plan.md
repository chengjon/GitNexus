# Secondary Entrypoint Host Framing Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge secondary entrypoint docs so they align with the repository's primary maintained `Claude Code + Codex` host framing.

**Architecture:** Keep the slice docs-only. Reuse the shared README framing convergence and dual-CLI host-governance conclusion as the truth source, then update the quick-start guide and eval README, record the convergence in audit/OpenSpec/roadmap artifacts, and avoid reopening any runtime behavior.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm The Truth Source

**Files:**
- Verify: `docs/gitnexus-quick-start-guide.md`
- Verify: `eval/README.md`
- Verify: `docs/audits/2026-04-08-readme-primary-dual-cli-framing-convergence.md`
- Verify: `docs/audits/2026-04-07-detect-changes-primary-dual-cli-host-convergence.md`

- [x] **Step 1: Re-read the current secondary entrypoint docs**
- [x] **Step 2: Re-read the shared README host-framing convergence**
- [x] **Step 3: Reconfirm the dual-CLI primary support conclusion**

### Task 2: Sync Secondary Entrypoints

**Files:**
- Modify: `docs/gitnexus-quick-start-guide.md`
- Modify: `eval/README.md`

- [x] **Step 1: Add explicit primary-vs-optional framing to the quick-start guide**
- [x] **Step 2: Preserve optional host setup examples without deleting them**
- [x] **Step 3: Rewrite the eval README host analogy into neutral hook-style wording**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-08-secondary-entrypoint-host-framing-convergence.md`
- Create: `docs/superpowers/specs/2026-04-08-secondary-entrypoint-host-framing-convergence-design.md`
- Create: `docs/superpowers/plans/2026-04-08-secondary-entrypoint-host-framing-convergence-implementation-plan.md`
- Create: `openspec/changes/2026-04-08-secondary-entrypoint-host-framing-convergence/.openspec.yaml`
- Create: `openspec/changes/2026-04-08-secondary-entrypoint-host-framing-convergence/proposal.md`
- Create: `openspec/changes/2026-04-08-secondary-entrypoint-host-framing-convergence/design.md`
- Create: `openspec/changes/2026-04-08-secondary-entrypoint-host-framing-convergence/specs/secondary-entrypoint-host-framing-convergence/spec.md`
- Create: `openspec/changes/2026-04-08-secondary-entrypoint-host-framing-convergence/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the secondary-entrypoint convergence**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-08-secondary-entrypoint-host-framing-convergence`
  - result: `Change '2026-04-08-secondary-entrypoint-host-framing-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: critical`
  - `changed_files: 106`
  - `changed_count: 268`
  - `affected_count: 54`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
  - note: this worktree-wide result reflects unrelated pre-existing code changes
    outside the current documentation-only convergence slice
