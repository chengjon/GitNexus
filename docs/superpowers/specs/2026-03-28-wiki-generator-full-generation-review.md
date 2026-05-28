# Wiki Generator Full Generation Design — Review

Date: 2026-03-28
Reviewer: Claude
Target: `2026-03-28-wiki-generator-full-generation-design.md`

## Status Sync (2026-04-08)

- This review is retained as a historical design-review record.
- The primary blocker captured here (`failedModules` dual-channel) has been
  resolved in the landed implementation on current `main`:
  - `gitnexus/src/core/wiki/full-generation.ts` now accumulates failures
    internally
  - `gitnexus/src/core/wiki/generator.ts` merges the returned failures back
    into `this.failedModules` at the wrapper boundary
- The `2026-03-28` technical-debt audit also records that this follow-up fix
  had already landed in the reviewed worktree code.
- The remaining comments below should be read as historical review context, not
  as current blockers for an extraction that is already merged.

Historical review note: the `Verdict`, issue list, suggestions, and `Summary`
sections below remain the 2026-03-28 design-review baseline. Read them as
historical review context unless the later truth-sync record, technical-debt
audit, current source/test anchors, or the remediation roadmap explicitly
reaffirms them as still current.

## Verdict

Historical review record; the primary blocker has been resolved in landed code.

---

## Strengths

1. **Scope discipline is excellent.** Section 3 explicitly fences what's in/out. This is the most important property for a safe extraction.

2. **Option A is clearly the right call.** Consistent with the prior 6 extractions, minimal regression surface.

3. **Behavior requirements (section 8) map precisely to the actual code.** The progress percentages (`5, 10, 30..85, 88, 95, 100`), error message, and phase names all match `generator.ts:231-359` exactly. Good fidelity.

4. **`extractModuleFiles` stays as a direct import** (section 7) — avoids unnecessary option surface inflation for a stateless function.

---

## Issues

### 1. `failedModules` dual-channel is redundant and confusing

**Severity at review time: Should fix before implementation**

The design proposes both:

- Passing `failedModules: string[]` in options (mutated in-place)
- Returning `failedModules: string[]` in the result (snapshot copy)

This means the same data flows through two channels. Looking at the current code (`generator.ts:89,304,327,358`), the class field is both mutated AND returned as `[...this.failedModules]`. After extraction, pick one pattern:

- **Recommended:** Remove `failedModules` from options, accumulate internally, return only. The wrapper in `generator.ts` can merge back: `this.failedModules.push(...result.failedModules)`. This makes `runFullGeneration` a pure function with no hidden side effects.
- **Alternative:** Keep mutable but don't return it. The caller reads its own array.

Section 11's note acknowledges the current pattern but doesn't resolve the redundancy.

**Resolution in landed implementation (2026-04-08):**

- `RunFullGenerationOptions` no longer accepts `failedModules`
- `runFullGeneration(...)` accumulates failures internally
- `generator.ts` now does `this.failedModules.push(...result.failedModules)`
  after the helper returns

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

Historical review note: the blocker/severity framing below records review-time
design feedback, not a current implementation gate on the already-landed
full-generation slice.

At review time, the design was ready to implement after resolving issue #1
(`failedModules` dual-channel). In the current landed repository state, that
issue has already been resolved in code. Issues #2-4 remain useful historical
clarifications, but they are no longer active blockers for this extraction
slice.
