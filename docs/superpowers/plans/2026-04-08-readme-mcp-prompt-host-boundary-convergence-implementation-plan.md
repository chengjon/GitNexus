# README MCP Prompt Host Boundary Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge the root `README.md` MCP prompt section so it explicitly marks direct prompt syntax as host-specific while preserving the repository's primary maintained `Claude Code + Codex` support framing.

**Architecture:** Keep the slice docs-only. Reuse the shared README host-framing convergence, the dual-CLI host-governance conclusion, and the skills-suggestion prompt-host convergence as the truth source, then add an explicit boundary note to the root README prompt section, record the convergence in audit/OpenSpec/roadmap artifacts, and avoid reopening runtime behavior.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm The Truth Source

**Files:**
- Verify: `README.md`
- Verify: `docs/audits/2026-04-07-detect-changes-primary-dual-cli-host-convergence.md`
- Verify: `docs/audits/2026-04-08-readme-primary-dual-cli-framing-convergence.md`
- Verify: `docs/audits/2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence.md`

- [x] **Step 1: Re-read the current README prompt section**
- [x] **Step 2: Reconfirm the dual-CLI primary support conclusion**
- [x] **Step 3: Reconfirm the shared README host-framing conclusion**
- [x] **Step 4: Reconfirm the host-specific prompt-example conclusion**

### Task 2: Sync The README Prompt Boundary

**Files:**
- Modify: `README.md`

- [x] **Step 1: Add an explicit host-boundary note to the Claude Code prompt example**
- [x] **Step 2: Preserve Codex as part of the primary maintained CLI surface**
- [x] **Step 3: Avoid inventing equivalent prompt syntax claims for other hosts**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-08-readme-mcp-prompt-host-boundary-convergence.md`
- Create: `docs/superpowers/specs/2026-04-08-readme-mcp-prompt-host-boundary-convergence-design.md`
- Create: `docs/superpowers/plans/2026-04-08-readme-mcp-prompt-host-boundary-convergence-implementation-plan.md`
- Create: `openspec/changes/2026-04-08-readme-mcp-prompt-host-boundary-convergence/.openspec.yaml`
- Create: `openspec/changes/2026-04-08-readme-mcp-prompt-host-boundary-convergence/proposal.md`
- Create: `openspec/changes/2026-04-08-readme-mcp-prompt-host-boundary-convergence/design.md`
- Create: `openspec/changes/2026-04-08-readme-mcp-prompt-host-boundary-convergence/specs/readme-mcp-prompt-host-boundary-convergence/spec.md`
- Create: `openspec/changes/2026-04-08-readme-mcp-prompt-host-boundary-convergence/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the README prompt-boundary convergence**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-08-readme-mcp-prompt-host-boundary-convergence`
  - result: `Change '2026-04-08-readme-mcp-prompt-host-boundary-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: critical`
  - `changed_files: 106`
  - `changed_count: 268`
  - `affected_count: 54`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
  - note: this worktree-wide result reflects unrelated pre-existing code changes
    outside the current documentation-only convergence slice
