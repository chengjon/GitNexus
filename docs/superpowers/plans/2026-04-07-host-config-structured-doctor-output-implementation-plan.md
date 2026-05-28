# Host Config Structured Doctor Output Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add structured `data` to `host-config` doctor checks while preserving the current detail string.

**Architecture:** Reuse existing host-plan evaluation results and expose them as structured `data` on `host-config`.

**Tech Stack:** TypeScript, Vitest, Markdown audit/OpenSpec docs

---

### Task 1: Add Failing Coverage

**Files:**
- Modify: `gitnexus/test/unit/doctor.test.ts`

- [x] **Step 1: Require structured host-config data for Codex manual-path checks**
- [x] **Step 2: Require structured host-config data for Codex configured-path checks**
- [x] **Step 3: Require structured host-config data for Claude Code configured-path checks**
- [x] **Step 4: Run the focused test and confirm it fails before implementation**

### Task 2: Implement Structured Output

**Files:**
- Modify: `gitnexus/src/cli/doctor.ts`

- [x] **Step 1: Add structured `data` to evaluated host-config checks**
- [x] **Step 2: Reuse existing detection/configured/manual booleans**
- [x] **Step 3: Re-run focused tests and confirm they pass**
- [x] **Step 4: Re-run `npm run build` and confirm the additive contract compiles cleanly**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-07-host-config-structured-doctor-output.md`
- Create: `docs/superpowers/specs/2026-04-07-host-config-structured-doctor-output-design.md`
- Create: `docs/superpowers/plans/2026-04-07-host-config-structured-doctor-output-implementation-plan.md`
- Create: `openspec/changes/2026-04-07-host-config-structured-doctor-output/.openspec.yaml`
- Create: `openspec/changes/2026-04-07-host-config-structured-doctor-output/proposal.md`
- Create: `openspec/changes/2026-04-07-host-config-structured-doctor-output/design.md`
- Create: `openspec/changes/2026-04-07-host-config-structured-doctor-output/specs/host-config-structured-doctor-output/spec.md`
- Create: `openspec/changes/2026-04-07-host-config-structured-doctor-output/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the new convergence status**

### Task 4: Final Verification

**Files:**
- Verify: `gitnexus/src/cli/doctor.ts`
- Verify: target tests and governance artifacts

- [x] **Step 1: Run focused tests**
- [x] **Step 2: Run `npm run build`**
- [x] **Step 3: Validate the OpenSpec change**
- [x] **Step 4: Re-run GitNexus change detection for final scope review**
