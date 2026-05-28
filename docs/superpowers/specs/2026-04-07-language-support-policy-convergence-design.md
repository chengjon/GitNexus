# Language Support Policy Convergence Design

Date: 2026-04-07
Status: Approved in conversation
Scope: `gitnexus/src/core/tree-sitter/language-registry.ts`, `gitnexus/src/ci/language-support-report.ts`, `gitnexus/scripts/ci/language-support-report.mjs`, `.github/workflows/ci.yml`, targeted tests, audit/OpenSpec/roadmap docs

## Goal

Remove the duplicate builtin/optional language policy split between runtime
language support reporting and the CI reporter validation path.

## Design Decision

Use the runtime language registry as the source of truth and move the reporter
implementation into compiled source:

- export a stable `getLanguageSupportPolicy()` from `language-registry.ts`
- move the reporter implementation into `src/ci/language-support-report.ts`
- make `ci.yml` execute `node dist/ci/language-support-report.js`
- keep `scripts/ci/language-support-report.mjs` only as a thin compatibility shim
- lock the convergence with focused workflow and unit tests

## Why This Design

The previous slice solved visibility, but not policy drift:

- `doctor --json` already depended on the runtime registry
- the CI reporter still validated against its own hard-coded lists
- the workflow still executed a source script instead of the compiled reporter

This design removes both residuals without changing the actual `doctor --json`
output contract or any Claude Code / Codex host behavior.

## Rejected Alternatives

### Keep the current source script and only add a comparison test

Rejected because it would detect drift later, but not actually remove the
duplicate policy source.

### Import TypeScript source directly from the `.mjs` reporter

Rejected because the CI path should stay on built JavaScript, not rely on
runtime TypeScript loading behavior.

### Rebuild the policy inside the reporter from parsed detail rows

Rejected because that still leaves the runtime registry and reporter on
separate policy ownership paths.

## Success Criteria

- runtime exposes a stable language support policy for downstream tooling
- CI validation consumes that shared policy
- `ci.yml` runs the compiled reporter from `dist/ci`
- focused tests fail if the workflow falls back to the source script or if the
  shared policy export disappears
