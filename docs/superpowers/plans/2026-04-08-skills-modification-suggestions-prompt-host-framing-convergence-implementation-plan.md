# Skills Modification Suggestions Prompt Host Framing Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge `docs/gitnexus-skills-modification-suggestions.md` so its MCP prompt example is explicitly documented as host-specific while preserving the repository's primary `Claude Code + Codex` support framing.

**Architecture:** Keep the slice docs-only. Reuse the shared README prompt wording, the dual-CLI host-governance conclusion, and the README host-framing convergence as the truth source, then rewrite the skills suggestion doc's prompt section to make the Claude Code example boundary explicit, record the convergence in audit/OpenSpec/roadmap artifacts, and avoid reopening runtime behavior.

**Tech Stack:** Markdown, OpenSpec

---

### Task 1: Reconfirm The Truth Source

**Files:**
- Verify: `docs/gitnexus-skills-modification-suggestions.md`
- Verify: `README.md`
- Verify: `docs/audits/2026-04-07-detect-changes-primary-dual-cli-host-convergence.md`
- Verify: `docs/audits/2026-04-08-readme-primary-dual-cli-framing-convergence.md`

- [x] **Step 1: Re-read the current skills modification suggestions doc**
- [x] **Step 2: Re-read the current README prompt example wording**
- [x] **Step 3: Reconfirm the dual-CLI primary support conclusion**
- [x] **Step 4: Reconfirm the shared host-framing conclusion**

### Task 2: Sync The Prompt Host Framing

**Files:**
- Modify: `docs/gitnexus-skills-modification-suggestions.md`

- [x] **Step 1: Replace the narrow prompt heading with a host-specific example heading**
- [x] **Step 2: State explicitly that the `@gitnexus` syntax shown is Claude Code specific**
- [x] **Step 3: Clarify that Codex remains a primary maintained CLI surface without claiming equivalent prompt syntax**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence.md`
- Create: `docs/superpowers/specs/2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence-design.md`
- Create: `docs/superpowers/plans/2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence-implementation-plan.md`
- Create: `openspec/changes/2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence/.openspec.yaml`
- Create: `openspec/changes/2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence/proposal.md`
- Create: `openspec/changes/2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence/design.md`
- Create: `openspec/changes/2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence/specs/skills-modification-suggestions-prompt-host-framing-convergence/spec.md`
- Create: `openspec/changes/2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the prompt-host convergence**

### Task 4: Final Verification

**Files:**
- Verify: governance artifacts

- [x] **Step 1: Validate the new OpenSpec change**
- [x] **Step 2: Re-run GitNexus change detection for final scope review**

**Verification results:**
- `openspec validate 2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence`
  - result: `Change '2026-04-08-skills-modification-suggestions-prompt-host-framing-convergence' is valid`
- `gitnexus_detect_changes({scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus"})`
  - `risk_level: critical`
  - `changed_files: 106`
  - `changed_count: 268`
  - `affected_count: 54`
  - `path_resolution: cwd_worktree`
  - `fallback_reason: null`
  - note: this worktree-wide result reflects unrelated pre-existing code changes
    outside the current documentation-only convergence slice
