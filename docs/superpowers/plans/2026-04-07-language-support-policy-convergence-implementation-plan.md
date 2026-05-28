# Language Support Policy Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge the `language-support` CI reporter onto the compiled source tree and remove the duplicate builtin/optional language policy path.

**Architecture:** Export the language-support policy from the runtime registry, move the reporter implementation into `src/ci`, keep a thin `.mjs` shim for compatibility, and run the compiled reporter from `ci.yml`.

**Tech Stack:** TypeScript, GitHub Actions workflow YAML, Vitest, Markdown audit/OpenSpec docs

---

### Task 1: Add Failing Coverage

**Files:**
- Modify: `gitnexus/test/unit/repository-governance-integration.test.ts`
- Modify: `gitnexus/test/unit/language-registry.test.ts`

- [x] **Step 1: Require `ci.yml` to execute the compiled reporter**
- [x] **Step 2: Require runtime to expose a stable language-support policy**
- [x] **Step 3: Run the focused tests and confirm they fail before implementation**

### Task 2: Converge Runtime And Reporter

**Files:**
- Modify: `gitnexus/src/core/tree-sitter/language-registry.ts`
- Add: `gitnexus/src/ci/language-support-report.ts`
- Modify: `gitnexus/scripts/ci/language-support-report.mjs`
- Modify: `.github/workflows/ci.yml`
- Modify: `gitnexus/test/unit/language-support-report.test.ts`

- [x] **Step 1: Export shared language-support policy from the runtime registry**
- [x] **Step 2: Move reporter implementation into compiled source**
- [x] **Step 3: Keep the source-script path as a thin compatibility shim**
- [x] **Step 4: Switch the CI workflow to `dist/ci/language-support-report.js`**
- [x] **Step 5: Re-run the targeted tests and confirm they pass**
- [x] **Step 6: Re-run `npm run build` and confirm the compiled reporter emits cleanly**

### Task 3: Record Governance Convergence

**Files:**
- Create: `docs/audits/2026-04-07-language-support-policy-convergence.md`
- Create: `docs/superpowers/specs/2026-04-07-language-support-policy-convergence-design.md`
- Create: `docs/superpowers/plans/2026-04-07-language-support-policy-convergence-implementation-plan.md`
- Create: `openspec/changes/2026-04-07-language-support-policy-convergence/.openspec.yaml`
- Create: `openspec/changes/2026-04-07-language-support-policy-convergence/proposal.md`
- Create: `openspec/changes/2026-04-07-language-support-policy-convergence/design.md`
- Create: `openspec/changes/2026-04-07-language-support-policy-convergence/specs/language-support-policy-convergence/spec.md`
- Create: `openspec/changes/2026-04-07-language-support-policy-convergence/tasks.md`
- Modify: `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`

- [x] **Step 1: Write the audit note**
- [x] **Step 2: Register the OpenSpec change**
- [x] **Step 3: Update the roadmap with the new P2 convergence status**

### Task 4: Final Verification

**Files:**
- Verify: `.github/workflows/ci.yml`
- Verify: `gitnexus/src/core/tree-sitter/language-registry.ts`
- Verify: `gitnexus/src/ci/language-support-report.ts`
- Verify: `gitnexus/scripts/ci/language-support-report.mjs`
- Verify: target tests and governance artifacts

- [x] **Step 1: Run focused tests**
- [x] **Step 2: Run `npm run build`**
- [x] **Step 3: Validate the OpenSpec change**
- [x] **Step 4: Re-run GitNexus change detection for final scope review**
