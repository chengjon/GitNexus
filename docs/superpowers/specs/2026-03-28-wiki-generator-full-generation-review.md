# Wiki Generator Full Generation Design — Review

Date: 2026-03-28
Reviewer: Claude
Target: `2026-03-28-wiki-generator-full-generation-design.md`

## Verdict

Solid, well-scoped — a few issues to address before implementation.

---

## Strengths

1. **Scope discipline is excellent.** Section 3 explicitly fences what's in/out. This is the most important property for a safe extraction.

2. **Option A is clearly the right call.** Consistent with the prior 6 extractions, minimal regression surface.

3. **Behavior requirements (section 8) map precisely to the actual code.** The progress percentages (`5, 10, 30..85, 88, 95, 100`), error message, and phase names all match `generator.ts:231-359` exactly. Good fidelity.

4. **`extractModuleFiles` stays as a direct import** (section 7) — avoids unnecessary option surface inflation for a stateless function.

---

## Issues

### 1. `failedModules` dual-channel is redundant and confusing

**Severity: Should fix before implementation**

The design proposes both:

- Passing `failedModules: string[]` in options (mutated in-place)
- Returning `failedModules: string[]` in the result (snapshot copy)

This means the same data flows through two channels. Looking at the current code (`generator.ts:89,304,327,358`), the class field is both mutated AND returned as `[...this.failedModules]`. After extraction, pick one pattern:

- **Recommended:** Remove `failedModules` from options, accumulate internally, return only. The wrapper in `generator.ts` can merge back: `this.failedModules.push(...result.failedModules)`. This makes `runFullGeneration` a pure function with no hidden side effects.
- **Alternative:** Keep mutable but don't return it. The caller reads its own array.

Section 11's note acknowledges the current pattern but doesn't resolve the redundancy.

### 2. `RunFullGenerationOptions` has 12 fields — document which feed `buildModuleTree`

**Severity: Clarification**

The options bundle parameters for at least 3 distinct concerns:

- **Graph gather:** `wikiDir`, `onProgress` (indirectly)
- **`buildModuleTree` call:** `wikiDir`, `llmConfig`, `maxTokensPerModule`, `onProgress`, `slugify`, `estimateModuleTokens`, `streamOpts`
- **Page orchestration:** `wikiDir`, `onProgress`, `fileExists`, `slugify`, `runParallel`, `failedModules`
- **Finalize:** `saveModuleTree`, `saveWikiMeta`

The design doesn't show the `buildModuleTree(...)` call inside `runFullGeneration`. It's implied, but worth an explicit note in section 7 showing which options are forwarded to `buildModuleTree` vs consumed directly. This matters for anyone implementing the function — they need to know the contract.

### 3. Missing `ProgressCallback` type ownership

**Severity: Clarification**

The design references `ProgressCallback` in options but doesn't specify where it's imported from. Currently it's defined in `generator.ts:70`. After extraction:

- Move the type to a shared location (e.g., `generator-support.ts` or a new `types.ts`), OR
- Re-export from `full-generation.ts` with a comment noting the canonical definition

Don't leave it as an implicit dependency on `generator.ts`.

### 4. `concurrency` is encapsulated in `runParallel` — confirm this is intentional

**Severity: Minor**

The design passes `runParallel` as a function option, which internally uses `this.concurrency`. This is good (hides the concurrency detail from `runFullGeneration`), but it means `runFullGeneration` cannot independently control parallelism. Confirm this is acceptable for the overview page generation in phase 3 — currently it's sequential (single await), so this is fine, but worth a brief note.

### 5. Section 9.3 test list references the new test file twice

**Severity: Editorial**

Section 9.3 lists `test/unit/wiki-full-generation.test.ts` both as a new file to add (section 9.1) and in the regression verification list (section 9.3). The regression list should be "existing tests that must still pass," not include the new test being added.

---

## Suggestions (non-blocking)

- **Consider a `WikiPaths` helper** — `wikiDir` is used to construct `${wikiDir}/${slug}.md`, `${wikiDir}/meta.json`, `${wikiDir}/module_tree.json`. After extraction, path construction is split between `full-generation.ts` (page paths) and the injected `saveModuleTree`/`saveWikiMeta` (metadata paths). A small shared helper would keep path logic centralized. Not for this slice, but note it for follow-up.

- **Section 7 interface shape** — the `streamOpts` type `(label: string, fixedPercent?: number) => CallLLMOptions` creates a dependency on `CallLLMOptions` from `llm-client.ts`. This is fine, just make sure the import is explicit.

---

## Summary

The design is ready to implement after resolving issue #1 (`failedModules` dual-channel). Issues #2-4 are documentation clarifications that would help the implementer but don't affect correctness. The scope, behavior preservation, and risk mitigation are all well-considered.
