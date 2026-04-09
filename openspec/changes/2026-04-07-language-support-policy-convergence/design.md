## Design

This slice removes duplicate policy ownership rather than just documenting it.

- `language-registry.ts` now owns the builtin / optional language policy
- `src/ci/language-support-report.ts` consumes that policy directly
- `ci.yml` runs the compiled reporter from `dist/ci`
- `scripts/ci/language-support-report.mjs` remains as a compatibility shim

This keeps the real runtime registry, the CI validation path, and the workflow
entrypoint on one convergence line without changing the public `doctor --json`
shape or any Claude Code / Codex host checks.
