# README Primary Dual CLI Framing Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge the shared README framing so the repository's primary maintained CLI surface is explicitly `Claude Code + Codex`, while keeping other MCP hosts as optional integrations.

**Architecture:** Keep the slice docs-only. Reuse the existing dual-CLI governance audits and roadmap conclusions as the truth source, then update the root/package READMEs, record the convergence in audit/OpenSpec/roadmap artifacts, and avoid reopening any host runtime behavior.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm The Truth Source

**Files:**
- Verify: `README.md`
- Verify: `gitnexus/README.md`
- Verify: `docs/audits/2026-04-07-detect-changes-primary-dual-cli-host-convergence.md`
- Verify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Re-read the current shared README host-support framing**
- [x] **Step 2: Re-read the dual-CLI host-governance conclusion**
- [x] **Step 3: Reconfirm the roadmap already treats `Codex + Claude Code` as the primary required pair**

### Task 2: Sync Shared README Framing

**Files:**
- Modify: `README.md`
- Modify: `gitnexus/README.md`

- [x] **Step 1: Add explicit primary-pair framing to both READMEs**
- [x] **Step 2: Reorder editor support tables so Claude Code and Codex lead**
- [x] **Step 3: Preserve Cursor / Windsurf / OpenCode as optional MCP integrations**
- [x] **Step 4: Update manual setup wording to distinguish primary vs optional hosts**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-08-readme-primary-dual-cli-framing-convergence.md`
- Create: `docs/superpowers/specs/2026-04-08-readme-primary-dual-cli-framing-convergence-design.md`
- Create: `docs/superpowers/plans/2026-04-08-readme-primary-dual-cli-framing-convergence-implementation-plan.md`
- Create: `openspec/changes/2026-04-08-readme-primary-dual-cli-framing-convergence/.openspec.yaml`
- Create: `openspec/changes/2026-04-08-readme-primary-dual-cli-framing-convergence/proposal.md`
- Create: `openspec/changes/2026-04-08-readme-primary-dual-cli-framing-convergence/design.md`
- Create: `openspec/changes/2026-04-08-readme-primary-dual-cli-framing-convergence/specs/readme-primary-dual-cli-framing-convergence/spec.md`
- Create: `openspec/changes/2026-04-08-readme-primary-dual-cli-framing-convergence/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the shared-doc convergence**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-08-readme-primary-dual-cli-framing-convergence`
  - result: `Change '2026-04-08-readme-primary-dual-cli-framing-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: critical`
  - `changed_files: 106`
  - `changed_count: 268`
  - `affected_count: 54`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
  - note: this worktree-wide result reflects unrelated pre-existing code changes
    outside the current documentation-only convergence slice
