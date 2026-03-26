# Wiki Generator Overview Page Design

Date: 2026-03-27  
Status: Draft for review  
Scope: `gitnexus/src/core/wiki/generator.ts`

## 1. Goal

Reduce the responsibility load inside `WikiGenerator` by extracting overview-page generation into a dedicated module, while preserving current wiki output behavior.

This is the next narrow `P1` hotspot-reduction slice after the leaf-page and parent-page extractions. It is not a redesign of incremental update or metadata persistence.

## 2. Current Problem

After extracting module page generation, `generator.ts` still combines:

- orchestration
- overview-page generation
- incremental update decisions
- metadata persistence
- HTML viewer generation

The overview block is cohesive, but it still sits inline inside the main generator class. That creates three practical problems:

1. overview prompt/data assembly is still mixed with orchestration logic
2. overview behavior has no focused contract test around prompt inputs and `overview.md` output
3. future incremental-update refactors still have to work around overview-generation internals embedded in the hotspot

## 3. Chosen Scope

This slice extracts only:

- `generateOverview`

Explicitly not included:

- `incrementalUpdate`
- metadata persistence
- HTML viewer generation
- module-tree builder logic
- module leaf/parent page generation (already handled in the previous slice)

## 4. Design Options

### Option A: Extract `generateOverview` only

Move only the overview generation body into a dedicated page module, with explicit dependencies for the generator-owned helpers it still needs.

Pros:

- smallest safe move
- keeps `fullGeneration` and `incrementalUpdate` call sites stable
- fits the current extraction pattern used by leaf and parent page generators

Cons:

- `readProjectInfo` and `extractModuleFiles` remain on `WikiGenerator`

### Option B: Extract `generateOverview` and also move helper methods it uses

Move overview generation plus `readProjectInfo` and `extractModuleFiles` into the new module.

Pros:

- bigger immediate reduction in `generator.ts`
- overview page module becomes more self-contained

Cons:

- noticeably wider regression surface
- blends “overview generation” with “generator utility migration”

### Option C: Extract overview generation together with incremental-update changes

Use this slice to start moving overview generation and incremental update into a broader orchestration split.

Pros:

- larger immediate hotspot reduction

Cons:

- too wide for a safe next slice
- mixes two different responsibilities
- harder to test and review cleanly

## 5. Recommendation

Use Option A.

This keeps the change narrow and consistent with the extraction style already established for `leaf-page.ts` and `parent-page.ts`.

## 6. Target File Structure

Add:

```text
gitnexus/src/core/wiki/pages/
  overview-page.ts
```

Modify:

- `gitnexus/src/core/wiki/generator.ts`
- `gitnexus/test/unit/wiki-page-generation.test.ts`
- `gitnexus/test/unit/wiki-generator-orchestration.test.ts`

Optional follow-up only:

- move `readProjectInfo` or `extractModuleFiles` later if a future slice still needs them

## 7. Responsibility Split

### `pages/overview-page.ts`

Own only:

- `generateOverviewPage`

Dependencies it should receive explicitly:

- `moduleTree`
- `wikiDir`
- `repoPath`
- `llmConfig`
- `streamOpts`
- `readProjectInfo`
- `extractModuleFiles`
- graph query helpers:
  - `getInterModuleEdgesForOverview`
  - `getAllProcesses`

### `generator.ts`

After extraction, `WikiGenerator` should:

- import the overview page generator
- call it from the existing orchestration flow
- stop owning the overview-generation internals
- continue owning incremental update flow, metadata persistence, and helper methods such as `readProjectInfo` / `extractModuleFiles`

## 8. Behavior Requirements

The extraction must preserve:

- module overview extraction from child/module pages
- the `### Architecture` trim boundary
- the `600`-character fallback trim behavior
- `(Documentation pending)` fallback when a module page cannot be read
- inter-module edge lookup for overview diagrams
- top-process lookup using `getAllProcesses(5)`
- prompt template and prompt fill semantics
- overview file naming as `overview.md`
- overview page title format: `# ${path.basename(repoPath)} — Wiki`
- existing orchestration behavior in both `fullGeneration` and `incrementalUpdate`

No generated markdown content should change intentionally in this slice.

## 9. Testing Strategy

### 9.1 Focused Contract Test

Extend `gitnexus/test/unit/wiki-page-generation.test.ts` to cover overview-page prompt assembly and output behavior.

Cover:

- reading module pages and building `MODULE_SUMMARIES`
- trimming content at `### Architecture`
- fallback to `(Documentation pending)` when a page is missing
- formatting edge fallback as `No inter-module call edges detected`
- writing output to `overview.md`
- preserving the repository-title prefix in the generated page

Use stubs/mocks for graph queries, prompt helpers, `callLLM`, and filesystem I/O.

### 9.2 Orchestration Test

Extend `gitnexus/test/unit/wiki-generator-orchestration.test.ts` so it verifies:

- `fullGeneration` dispatches overview work through the extracted helper
- `incrementalUpdate` still triggers overview regeneration only when pages changed

This test should stay at orchestration wiring level, not re-test detailed prompt assembly.

### 9.3 Existing Verification

Retain or rerun existing wiki-focused verification.

At minimum, verify:

- `test/unit/wiki-page-generation.test.ts`
- `test/unit/wiki-generator-orchestration.test.ts`
- `test/unit/wiki-module-tree.test.ts`
- `npm run build`

## 10. Risks

### Risk 1: Hidden dependency on generator helpers

Overview generation depends on `readProjectInfo`, `extractModuleFiles`, `repoPath`, and streaming behavior.

Mitigation:

- pass generator-owned helpers explicitly
- do not pass the full `WikiGenerator` instance

### Risk 2: Prompt assembly drift

If module summaries, edge fallback text, or title formatting drift, generated top-level wiki content changes silently.

Mitigation:

- add focused contract assertions around prompt inputs and output path/title

### Risk 3: Incremental-update behavior drift

If rewiring changes when overview regeneration happens, incremental updates could overrun or skip expected work.

Mitigation:

- keep call sites in `fullGeneration` and `incrementalUpdate` intact
- add orchestration-level tests around overview dispatch

## 11. Success Criteria

This slice is successful when:

- `generator.ts` no longer owns overview-generation internals
- overview generation lives in `pages/overview-page.ts`
- overview contract coverage exists
- orchestration behavior is unchanged in both full and incremental flows
- incremental update itself remains otherwise untouched

## 12. Implementation Guidance

Implement this as a narrow overview-page extraction, not a broader orchestration redesign.

The value of this slice is:

- a smaller `generator.ts`
- clearer separation between orchestration and overview content generation
- safer future work on incremental-update refactors because the overview behavior is isolated and tested
