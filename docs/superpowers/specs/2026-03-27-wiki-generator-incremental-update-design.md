# Wiki Generator Incremental Update Design

Date: 2026-03-27  
Status: Draft for review  
Scope: `gitnexus/src/core/wiki/generator.ts`

## 1. Goal

Reduce the responsibility load inside `WikiGenerator` by extracting incremental-update orchestration into a dedicated module, while preserving current wiki update behavior.

This is the next narrow `P1` hotspot-reduction slice after the leaf-page, parent-page, and overview-page extractions. It is not a redesign of metadata persistence or helper ownership.

## 2. Current Problem

After extracting page generation and overview generation, `generator.ts` still combines:

- top-level orchestration in `run()`
- incremental update decisions
- module regeneration scheduling
- metadata persistence
- helper methods used by both full and incremental flows

The `incrementalUpdate` block is now one of the last large flow-heavy responsibilities left in `generator.ts`. That creates three practical problems:

1. change-detection and regeneration flow is still mixed with the rest of generator orchestration
2. the main incremental branches are harder to test independently from the class shell
3. future helper migrations remain harder because the incremental flow is still embedded in the hotspot

## 3. Chosen Scope

This slice extracts only:

- `incrementalUpdate`

Explicitly not included:

- `run()`
- `fullGeneration()`
- metadata persistence helper ownership
- `getChangedFiles`
- `findNodeBySlug`
- `slugify`
- `saveWikiMeta`
- `runParallel`
- page generator helper ownership

Those helpers may be passed explicitly, but they should remain owned by `WikiGenerator` in this slice.

## 4. Design Options

### Option A: Extract only `incrementalUpdate`

Move the incremental-update body into `src/core/wiki/incremental-update.ts`, passing generator-owned helpers explicitly.

Pros:

- smallest safe move
- preserves the current `run()` branching shape
- keeps helper migration out of scope

Cons:

- many explicit dependencies in the helper signature

### Option B: Extract `incrementalUpdate` and move its helper methods too

Move helper methods such as `getChangedFiles`, `findNodeBySlug`, `slugify`, and `saveWikiMeta` into the same new module.

Pros:

- larger immediate reduction in `generator.ts`

Cons:

- noticeably wider regression surface
- mixes flow extraction with utility migration

### Option C: Rework `run()` and `incrementalUpdate()` together

Treat this slice as a broader orchestration rewrite.

Pros:

- could simplify the overall generator shape faster

Cons:

- too wide for a safe next step
- harder to review and verify incrementally

## 5. Recommendation

Use Option A.

This keeps the change narrow and consistent with the previous extractions: move one cohesive responsibility, keep surrounding ownership stable, and pass dependencies explicitly.

## 6. Target File Structure

Add:

```text
gitnexus/src/core/wiki/
  incremental-update.ts
```

Modify:

- `gitnexus/src/core/wiki/generator.ts`
- `gitnexus/test/unit/wiki-generator-orchestration.test.ts`

Add focused tests:

- `gitnexus/test/unit/wiki-incremental-update.test.ts`

Optional follow-up only:

- move helper methods in a later slice if they still form a coherent hotspot

## 7. Responsibility Split

### `incremental-update.ts`

Own only:

- `runIncrementalUpdate`

Suggested output shape:

```ts
export interface IncrementalUpdateResult {
  pagesGenerated: number;
  mode: 'incremental';
  failedModules: string[];
}
```

Dependencies it should receive explicitly:

- `existingMeta`
- `currentCommit`
- `wikiDir`
- `repoPath`
- `llmConfig`
- `maxTokensPerModule`
- `failedModules`
- `onProgress`
- `streamOpts`
- `getChangedFiles`
- `slugify`
- `findNodeBySlug`
- `saveWikiMeta`
- `fullGeneration`
- `generateLeafPage`
- `generateParentPage`
- `generateOverviewPage`
- `runParallel`
- `readSourceFiles`
- `truncateSource`

### `generator.ts`

After extraction, `WikiGenerator` should:

- import `runIncrementalUpdate`
- continue owning `run()`
- continue owning helper methods such as `getChangedFiles`, `findNodeBySlug`, `slugify`, `saveWikiMeta`, `runParallel`, `readSourceFiles`, and `truncateSource`
- call the extracted incremental-update helper from the existing `run()` branch

## 8. Behavior Requirements

The extraction must preserve:

- `changedFiles.length === 0` updates metadata only and returns `{ pagesGenerated: 0, mode: 'incremental' }`
- `newFiles.length > 5` falls back to `fullGeneration(currentCommit)` and returns its result as incremental mode
- new files are added under `Other`
- affected module pages are deleted before regeneration
- parent nodes still use `generateParentPage`
- leaf nodes still use `generateLeafPage`
- overview regeneration happens only when `pagesGenerated > 0`
- metadata save at the end still writes updated `fromCommit`, `generatedAt`, and `model`
- `failedModules` tracking remains unchanged
- progress messages and percent ranges remain behaviorally unchanged

No user-visible wiki behavior should change intentionally in this slice.

## 9. Testing Strategy

### 9.1 New Focused Unit Test File

Add:

- `gitnexus/test/unit/wiki-incremental-update.test.ts`

Cover the main branches:

- no changed files → metadata-only update
- many new files → fallback to `fullGeneration`
- affected leaf/parent nodes regenerate through the injected page helpers
- overview helper runs only when pages were regenerated
- metadata save happens with updated commit/timestamp/model

Use narrow inline fixtures and mocks. This should test the extracted flow logic, not real git or LLM behavior.

### 9.2 Orchestration Test

Extend `gitnexus/test/unit/wiki-generator-orchestration.test.ts` so it verifies:

- `run()` dispatches incremental-update work through the extracted helper when metadata is present and force mode is off

This test should stay at wiring level, not re-test all incremental branches.

### 9.3 Existing Verification

Retain or rerun existing wiki-focused verification.

At minimum, verify:

- `test/unit/wiki-incremental-update.test.ts`
- `test/unit/wiki-generator-orchestration.test.ts`
- `test/unit/wiki-page-generation.test.ts`
- `test/unit/wiki-module-tree.test.ts`
- `npm run build`

## 10. Risks

### Risk 1: Hidden orchestration drift

`incrementalUpdate` coordinates multiple helpers and fallback branches. Small rewiring mistakes can change which branch runs or when overview regeneration happens.

Mitigation:

- keep `run()` branch structure intact
- add focused unit tests for each major branch

### Risk 2: Helper ownership drift

If helper methods start moving during this slice, the change will widen and become harder to verify.

Mitigation:

- keep helper ownership on `WikiGenerator`
- pass helpers explicitly instead of migrating them

### Risk 3: Metadata / progress regressions

Incremental flow writes metadata and drives progress messages. Small differences here can silently regress UX or state freshness.

Mitigation:

- assert metadata save behavior and overview gating explicitly in tests
- preserve existing progress ranges and message shapes

## 11. Success Criteria

This slice is successful when:

- `generator.ts` no longer owns the incremental-update internals
- `runIncrementalUpdate` lives in its own module
- `run()` behavior is unchanged
- focused incremental-update tests exist
- helper ownership remains intentionally unchanged

## 12. Implementation Guidance

Implement this as a narrow incremental-update extraction, not a generator redesign.

The value of this slice is:

- a smaller `generator.ts`
- clearer separation between top-level orchestration and incremental flow logic
- safer future refactors of helper ownership because the flow itself is isolated first
