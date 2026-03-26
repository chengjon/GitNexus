# Wiki Generator Module Tree Design

Date: 2026-03-26  
Status: Draft for review  
Scope: `gitnexus/src/core/wiki/generator.ts`

## 1. Goal

Reduce the responsibility load inside `WikiGenerator` by extracting the module-tree construction subsystem into a dedicated module, without changing full-generation or incremental wiki behavior.

This is a focused `P1` hotspot-reduction slice. It is not a full rewrite of the wiki generation pipeline.

## 2. Current Problem

`generator.ts` currently mixes three distinct concerns:

- module tree construction
- page generation
- incremental update / metadata persistence

The module-tree section is cohesive on its own, but it currently lives inline in the same class as:

- LLM page generation
- incremental update decisions
- HTML viewer generation
- wiki metadata storage

That creates three practical problems:

1. changes to grouping logic require reviewing an oversized multi-purpose file
2. the LLM grouping step is harder to test or evolve independently
3. later refactors of incremental update and page generation remain tangled with tree-building concerns

## 3. Chosen Scope

This slice will extract only the module-tree construction subsystem.

Included:

- `ModuleTreeNode` type
- grouping-response parsing
- fallback grouping
- large-module splitting
- module-tree counting / flattening helpers that directly support tree construction

Explicitly not included:

- leaf page generation
- parent page generation
- overview generation
- incremental update orchestration
- HTML viewer generation
- metadata load/save logic

## 4. Design Options

### Option A: Extract only `buildModuleTree()`

Move just `buildModuleTree()` and keep all its helpers in `generator.ts`.

Pros:

- smallest code movement

Cons:

- leaves most of the complexity in the hotspot
- weak module boundary

### Option B: Extract a coherent module-tree builder unit

Create a small `core/wiki/module-tree/` area that owns:

- `ModuleTreeNode`
- `buildModuleTree`
- `parseGroupingResponse`
- `fallbackGrouping`
- `splitBySubdirectory`
- tree-shape helpers such as `countModules` / `flattenModuleTree`

Pros:

- clear boundary around one responsibility
- easier to unit test grouping logic
- directly benefits both full generation and incremental update

Cons:

- touches a few more files

### Option C: Extract module tree + incremental update together

Pros:

- bigger immediate shrink in `generator.ts`

Cons:

- significantly wider regression surface
- mixes stateful wiki update policy with pure-ish tree construction

## 5. Recommendation

Use Option B.

This gives the cleanest first split while still keeping the refactor narrow:

- one focused module tree subsystem
- no page-generation behavior changes
- no metadata/update-policy redesign

## 6. Target File Structure

Add:

```text
gitnexus/src/core/wiki/module-tree/
  types.ts
  builder.ts
```

Modify:

- `gitnexus/src/core/wiki/generator.ts`

Optional follow-up only:

- `module-tree/index.ts` barrel export if the area grows

## 7. Responsibility Split

### `module-tree/types.ts`

Own only:

- `ModuleTreeNode`

This keeps the core tree type reusable without forcing imports from `generator.ts`.

### `module-tree/builder.ts`

Own:

- `buildModuleTree`
- `parseGroupingResponse`
- `fallbackGrouping`
- `splitBySubdirectory`
- `countModules`
- `flattenModuleTree`
- any tiny local helper strictly needed by those methods

This module should focus on:

- grouping files into modules
- validating LLM grouping output
- splitting oversized modules
- turning a tree into processing layers

### `generator.ts`

After extraction, `WikiGenerator` should:

- import the module-tree type(s)
- call the extracted builder
- stop owning module-tree internals directly
- continue orchestrating full/incremental wiki generation

## 8. Behavior Requirements

The extraction must preserve:

- snapshot reuse from `first_module_tree.json`
- LLM grouping prompt behavior
- fallback grouping on invalid JSON / invalid grouping output
- assignment of ungrouped files into `Other`
- token-budget-driven submodule splitting
- the current `slugify` semantics used by module-tree consumers
- leaf/parent flattening order

No user-visible wiki generation behavior should change in this slice.

## 9. Testing Strategy

### 9.1 New Focused Unit Tests

Add a dedicated unit test file for module-tree construction, for example:

- `gitnexus/test/unit/wiki-module-tree.test.ts`

Cover:

- valid grouping response parsing
- markdown-fenced JSON handling
- fallback grouping when JSON is invalid
- unassigned files moving to `Other`
- submodule splitting when token budget is exceeded
- flatten order: leaves first, parents second

### 9.2 Existing Behavior Preservation

Retain or rerun existing wiki command / generator tests if present.

If no focused wiki tests exist yet, at minimum verify:

- build passes
- imports remain valid
- downstream code using `ModuleTreeNode` continues to compile

### 9.3 Non-Goals for Tests

Do not use this slice to redesign LLM prompts or page content generation assertions.

## 10. Risks

### Risk 1: Tree type drift

If `ModuleTreeNode` is moved carelessly, downstream code may compile but behave differently.

Mitigation:

- move the type unchanged first
- keep tree shape identical

### Risk 2: Hidden coupling to generator instance state

Some helpers currently depend on `this` members like:

- `wikiDir`
- `llmConfig`
- `maxTokensPerModule`
- `slugify`
- `onProgress`

Mitigation:

- make the builder take explicit inputs/dependencies
- do not smuggle large portions of `WikiGenerator` into the new module

### Risk 3: Scope creep into page generation

It is tempting to extract `generateLeafPage()` and `generateParentPage()` at the same time.

Mitigation:

- keep this slice strictly about module-tree construction

## 11. Success Criteria

This slice is successful when:

- `generator.ts` no longer owns the module-tree construction subsystem
- `ModuleTreeNode` no longer lives in `generator.ts`
- full generation and incremental update still use the same tree shape
- focused module-tree tests exist
- no wiki content behavior changes are introduced

## 12. Implementation Guidance

Implement this as a narrow extraction, not a wiki pipeline redesign.

The value of this slice is:

- smaller hotspot file
- better isolation of grouping logic
- easier future refactors of page generation and incremental update

That sets up the next `WikiGenerator` reductions with lower risk.
