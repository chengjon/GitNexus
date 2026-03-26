# Wiki Generator Page Generation Design

Date: 2026-03-26  
Status: Draft for review  
Scope: `gitnexus/src/core/wiki/generator.ts`

## 1. Goal

Reduce the responsibility load inside `WikiGenerator` by extracting the leaf-module and parent-module page generation logic into dedicated modules, while preserving current wiki output behavior.

This is the next `P1` hotspot-reduction slice after the module-tree extraction. It is not a full rewrite of the wiki pipeline.

## 2. Current Problem

After extracting module-tree construction, `generator.ts` still combines:

- orchestration
- page generation for leaf modules
- page generation for parent modules
- overview generation
- incremental update / metadata persistence

The leaf and parent page generation blocks are cohesive units, but they still sit inline in the main generator class. That creates three practical problems:

1. page-generation logic is still mixed with orchestration logic
2. prompt/data assembly for leaf vs parent pages is harder to test independently
3. future extraction of overview and incremental update remains harder because the page-generation layer is still embedded in the hotspot

## 3. Chosen Scope

This slice extracts only:

- `generateLeafPage`
- `generateParentPage`

Explicitly not included:

- `generateOverview`
- `incrementalUpdate`
- metadata persistence
- HTML viewer generation
- module-tree builder logic (already handled in the previous slice)

## 4. Design Options

### Option A: Extract only `generateLeafPage`

Pros:

- smallest move

Cons:

- leaves page-generation behavior split awkwardly across two places
- weak boundary

### Option B: Extract `generateLeafPage` and `generateParentPage` together

Create a small `core/wiki/pages/` area for the two page-generation units.

Pros:

- clear “module pages” boundary
- keeps overview generation separate
- enough value without widening into the rest of the pipeline

Cons:

- touches multiple wiki files

### Option C: Extract all three page generators, including overview

Pros:

- largest immediate reduction in `generator.ts`

Cons:

- `generateOverview` depends on broader repo-level context
- wider regression surface

## 5. Recommendation

Use Option B.

This gives a clean page-generation boundary without widening the slice too far.

## 6. Target File Structure

Add:

```text
gitnexus/src/core/wiki/pages/
  leaf-page.ts
  parent-page.ts
```

Modify:

- `gitnexus/src/core/wiki/generator.ts`

Optional follow-up only:

- `pages/index.ts` barrel export if this area grows

## 7. Responsibility Split

### `pages/leaf-page.ts`

Own only:

- `generateLeafPage`

Dependencies it should receive explicitly:

- `wikiDir`
- `repoPath`
- `llmConfig`
- `maxTokensPerModule`
- `streamOpts`
- `readSourceFiles`
- `truncateSource`
- graph query helpers:
  - `getIntraModuleCallEdges`
  - `getInterModuleCallEdges`
  - `getProcessesForFiles`

### `pages/parent-page.ts`

Own only:

- `generateParentPage`

Dependencies it should receive explicitly:

- `wikiDir`
- `llmConfig`
- `streamOpts`
- graph query helpers:
  - `getIntraModuleCallEdges`
  - `getProcessesForFiles`

### `generator.ts`

After extraction, `WikiGenerator` should:

- import the page generators
- call them from the existing orchestration flow
- stop owning the leaf/parent page generation internals
- continue owning overview generation and incremental update flow

## 8. Behavior Requirements

The extraction must preserve:

- source-file reading for leaf pages
- token-budget truncation behavior
- graph query usage for leaf and parent pages
- prompt templates and prompt fill semantics
- page file naming and write location
- child-overview extraction logic for parent pages
- failure handling and `failedModules` tracking in orchestration

No generated markdown content should change intentionally in this slice.

## 9. Testing Strategy

### 9.1 New Focused Unit Tests

Add a dedicated page-generation test file, for example:

- `gitnexus/test/unit/wiki-page-generation.test.ts`

Cover:

- leaf page receives expected prompt inputs from source + graph data
- token truncation path is exercised
- parent page reads child docs and builds the expected prompt shape
- page output path naming remains stable

Use stubs/mocks for graph queries and LLM calls. This slice is about data assembly and file-writing behavior, not model quality.

### 9.2 Existing Behavior Preservation

Retain or rerun existing wiki generator / wiki CLI verification if available.

At minimum, verify:

- build passes
- extracted functions still integrate with the generator

### 9.3 Non-Goals for Tests

Do not use this slice to redesign overview-generation assertions or incremental update behavior.

## 10. Risks

### Risk 1: Hidden dependency on `this`

Leaf and parent page generation currently rely on several `WikiGenerator` helpers.

Mitigation:

- pass dependencies explicitly
- do not pass the full `WikiGenerator` instance into the new modules

### Risk 2: File path drift

If extracted functions build output paths differently, generated wiki page names can drift silently.

Mitigation:

- keep page naming/path behavior identical
- test output path construction directly

### Risk 3: Prompt assembly drift

If extraction changes prompt-input formatting, generated content can drift without obvious compile failures.

Mitigation:

- add focused tests around prompt input assembly
- keep prompt template usage identical

## 11. Success Criteria

This slice is successful when:

- `generator.ts` no longer owns leaf and parent page generation internals
- leaf and parent page generators live in dedicated modules
- orchestration behavior is unchanged
- focused page-generation tests exist
- overview generation remains untouched

## 12. Implementation Guidance

Implement this as a narrow page-generation extraction, not a wiki-pipeline redesign.

The value of this slice is:

- a smaller `generator.ts`
- clearer boundaries between orchestration and content generation
- easier future extraction of `generateOverview` and incremental update logic
