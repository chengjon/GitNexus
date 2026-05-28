## Why

GitNexus already reports language support from the runtime registry, but the CI
reporter still validates that output against its own hard-coded builtin and
optional language lists. That leaves a policy drift risk: runtime and CI can
silently diverge.

At the same time, `ci.yml` still executes the source reporter script instead of
the compiled reporter path, which cuts against the broader dist-entry
convergence direction already established for dual CLI safety.

## What Changes

- Export a stable language-support policy from the runtime registry
- Move the reporter implementation into compiled source under `src/ci`
- Switch `ci.yml` to execute `dist/ci/language-support-report.js`
- Keep the old `.mjs` script only as a compatibility shim
- Add focused regression coverage for both the workflow path and policy export
- Record the convergence in audit / roadmap docs

## Capabilities

### New Capabilities

- `language-support-policy-convergence`: Keep CI validation and runtime
  language-support classification on the same policy source.

### Modified Capabilities

- None.

## Impact

- Affected workflows:
  - `.github/workflows/ci.yml`
- Affected runtime code:
  - `gitnexus/src/core/tree-sitter/language-registry.ts`
  - `gitnexus/src/ci/language-support-report.ts`
  - `gitnexus/scripts/ci/language-support-report.mjs`
- Affected tests:
  - `gitnexus/test/unit/repository-governance-integration.test.ts`
  - `gitnexus/test/unit/language-registry.test.ts`
  - `gitnexus/test/unit/language-support-report.test.ts`
- Affected docs:
  - `docs/audits/2026-04-07-language-support-policy-convergence.md`
  - `docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md`
