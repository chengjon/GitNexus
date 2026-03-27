# Wiki Generator Support And Run Pipeline Design

Date: 2026-03-27  
Status: Draft for review  
Scope: `gitnexus/src/core/wiki/generator.ts`

## 1. Goal

Reduce the remaining responsibility load inside `WikiGenerator` by:

- extracting generator support helpers (`readProjectInfo`, `extractModuleFiles`)
- extracting the top-level `run()` orchestration shell into a dedicated pipeline module

while preserving current wiki generation behavior.

This is a combined `P1` hotspot-reduction slice after the leaf-page, parent-page, overview-page, and incremental-update extractions. It is not a redesign of metadata persistence, HTML viewer generation ownership, or graph query behavior.

## 2. Current Problem

After the previous extractions, `generator.ts` still owns three different categories of responsibility:

- top-level orchestration in `run()`
- support/helper logic for overview and metadata preparation
- a collection of remaining low-level utilities

The most meaningful remaining hotspot is the combination of:

- `readProjectInfo`
- `extractModuleFiles`
- `run()`

That creates three practical problems:

1. support helpers are still trapped inside the class even though they no longer need class state beyond explicit inputs
2. `run()` still mixes state lookup, branching, graph lifecycle, and post-processing in one method
3. future refactors of `generator.ts` are harder because support helpers and run-shell logic are still coupled to the same file

## 3. Chosen Scope

This slice extracts only:

- `readProjectInfo`
- `extractModuleFiles`
- `run()`

Explicitly not included:

- `ensureHTMLViewer`
- `getCurrentCommit`
- `loadWikiMeta`
- `saveWikiMeta`
- `fullGeneration`
- `runParallel`
- page-generation helpers
- incremental-update internals

These may be passed as explicit dependencies, but ownership stays in `WikiGenerator` for this slice.

## 4. Design Options

### Option A: Extract support helpers only

Move `readProjectInfo` and `extractModuleFiles` to a standalone helper module, but leave `run()` inline.

Pros:

- smallest move
- lowest immediate regression surface

Cons:

- leaves the top-level orchestration shell in the hotspot

### Option B: Extract support helpers and `run()` shell together

Move helper logic to `generator-support.ts` and top-level orchestration to `run-pipeline.ts`.

Pros:

- clean separation between support logic and orchestration shell
- keeps helper migration and run-shell cleanup aligned
- avoids needing two closely related follow-up slices

Cons:

- slightly wider than helper-only extraction

### Option C: Broader shell rewrite

Use this slice to also migrate `ensureHTMLViewer`, `getCurrentCommit`, and `loadWikiMeta` ownership.

Pros:

- largest immediate reduction in `generator.ts`

Cons:

- wider regression surface
- mixes shell extraction with ownership migration for unrelated helpers

## 5. Recommendation

Use Option B.

This is the cleanest combined move that still respects the existing “narrow slice” rule. It removes the last obvious shell/support hotspot without widening into a general generator redesign.

## 6. Target File Structure

Add:

```text
gitnexus/src/core/wiki/
  generator-support.ts
  run-pipeline.ts
```

Modify:

- `gitnexus/src/core/wiki/generator.ts`
- `gitnexus/test/unit/wiki-generator-orchestration.test.ts`

In the current worktree, `gitnexus/test/unit/wiki-generator-orchestration.test.ts` already exists and should be extended rather than replaced.

Add focused tests:

- `gitnexus/test/unit/wiki-generator-support.test.ts`
- `gitnexus/test/unit/wiki-run-pipeline.test.ts`

Optional follow-up only:

- move remaining shell helpers later if they still form a coherent slice

## 7. Responsibility Split

### `generator-support.ts`

Own only:

- `readProjectInfo(repoPath)`
- `extractModuleFiles(tree)`

Suggested shape:

```ts
export async function readProjectInfo(repoPath: string): Promise<string> { ... }

export function extractModuleFiles(
  tree: ModuleTreeNode[],
): Record<string, string[]> { ... }
```

### `run-pipeline.ts`

Own only:

- `runWikiGeneration`

Use the repo's existing TS/ESM convention for source imports: source files are `.ts`, but intra-repo import specifiers should use `.js`.

Suggested shape:

```ts
export interface RunWikiGenerationOptions {
  forceMode: boolean;
  repoPath: string;
  wikiDir: string;
  kuzuPath: string;
  onProgress: ProgressCallback;
  prepareWikiDir: () => Promise<void>;
  cleanupForceMode: () => Promise<void>;
  loadWikiMeta: () => Promise<WikiMeta | null>;
  getCurrentCommit: () => string;
  initWikiDb: (kuzuPath: string) => Promise<void>;
  closeWikiDb: () => Promise<void>;
  ensureHTMLViewer: () => Promise<void>;
  fullGeneration: (currentCommit: string) => Promise<{ pagesGenerated: number; mode: 'full'; failedModules: string[] }>;
  runIncrementalUpdate: (existingMeta: WikiMeta, currentCommit: string) => Promise<{ pagesGenerated: number; mode: 'incremental'; failedModules: string[] }>;
}

export async function runWikiGeneration(
  options: RunWikiGenerationOptions,
): Promise<{ pagesGenerated: number; mode: 'full' | 'incremental' | 'up-to-date'; failedModules: string[] }> { ... }
```

### `generator.ts`

After extraction, `WikiGenerator` should:

- import `readProjectInfo` and `extractModuleFiles` from `generator-support.ts`
- import `runWikiGeneration` from `run-pipeline.ts`
- keep helper ownership for `ensureHTMLViewer`, `getCurrentCommit`, `loadWikiMeta`, `saveWikiMeta`, and other low-level utilities
- make `run()` a thin wrapper that passes current state and bound helpers into `runWikiGeneration(...)`

## 8. Behavior Requirements

The extraction must preserve:

### 8.1 `readProjectInfo`

- same candidate config-file order
- same package.json field extraction
- same `500`-char excerpt behavior for non-package config files
- same README lookup order
- same `1000`-char README excerpt behavior
- same `Project: ${path.basename(repoPath)}` leading line

### 8.2 `extractModuleFiles`

- same parent-node flattening behavior
- same direct-leaf mapping behavior
- same key naming based on module names

### 8.3 `run()`

- still creates `wikiDir`
- still short-circuits to `up-to-date` when commit matches and force mode is off
- still regenerates the HTML viewer on up-to-date short-circuit
- still performs force-mode snapshot/page cleanup before running generation
  - deletes `first_module_tree.json`
  - deletes all existing `*.md` files in `wikiDir`, including `overview.md`
- still initializes and closes wiki DB around generation
- still dispatches to incremental mode only when:
  - `existingMeta` exists
  - `forceMode` is off
  - `existingMeta.fromCommit` is truthy
- still calls `ensureHTMLViewer()` on all non-up-to-date paths after generation work completes, even when `pagesGenerated` ends up `0`; `ensureHTMLViewer()` itself may early-return if no `*.md` files exist
- still returns the same result shape

Ordering must remain:

1. prepare `wikiDir`
2. load metadata + current commit
3. up-to-date short-circuit
4. force-mode cleanup
5. init wiki DB
6. run full or incremental generation
7. close wiki DB
8. call `ensureHTMLViewer()`

No user-visible wiki behavior should change intentionally in this slice.

## 9. Testing Strategy

### 9.1 New Focused Support Tests

Add:

- `gitnexus/test/unit/wiki-generator-support.test.ts`

Cover:

- `readProjectInfo` package.json extraction
- fallback config excerpt behavior
- README excerpt behavior
- `extractModuleFiles` for parent/leaf trees

Use pure unit tests with filesystem mocks.

### 9.2 New Run Pipeline Tests

Add:

- `gitnexus/test/unit/wiki-run-pipeline.test.ts`

Cover:

- up-to-date short-circuit path
- force-mode cleanup path
- incremental vs full branch selection
- graph init/close lifecycle
- post-generation `ensureHTMLViewer()` behavior on all non-up-to-date paths

Use pure mocks; no real graph or filesystem writes.

`runWikiGeneration(...)` should receive shell side effects as injected callbacks (`prepareWikiDir`, `cleanupForceMode`, `initWikiDb`, `closeWikiDb`) rather than importing them directly, so the pipeline tests stay pure and deterministic.

### 9.3 Existing Orchestration Test

Extend the existing `gitnexus/test/unit/wiki-generator-orchestration.test.ts` so it verifies:

- `WikiGenerator.run()` dispatches through `runWikiGeneration(...)`

This should remain a thin wiring assertion, not a duplication of pipeline behavior tests.

### 9.4 Existing Regression Verification

Retain or rerun the current worktree's existing wiki-focused verification.

At minimum, verify:

- `test/unit/wiki-generator-support.test.ts`
- `test/unit/wiki-run-pipeline.test.ts`
- `test/unit/wiki-generator-orchestration.test.ts`
- `test/unit/wiki-incremental-update.test.ts`
- `test/unit/wiki-page-generation.test.ts`
- `test/unit/wiki-module-tree.test.ts`
- `npm run build`

## 10. Risks

### Risk 1: Run-shell drift

`run()` controls initialization, branching, cleanup, and post-processing. Small changes here can affect every wiki mode.

Mitigation:

- keep `runWikiGeneration(...)` a near-literal move
- keep helper ownership stable
- add dedicated shell tests

### Risk 2: Support-helper drift

If `readProjectInfo` or `extractModuleFiles` change behavior while moving, overview output or metadata shape can silently drift.

Mitigation:

- add exact helper tests
- preserve string formatting and flattening behavior

### Risk 3: Over-widening the slice

It will be tempting to move more helpers once `run()` is being touched.

Mitigation:

- explicitly leave `ensureHTMLViewer`, `getCurrentCommit`, `loadWikiMeta`, and `saveWikiMeta` where they are
- treat this as shell/support extraction only

## 11. Success Criteria

This slice is successful when:

- `generator.ts` no longer owns `readProjectInfo`, `extractModuleFiles`, or the `run()` shell internals
- support helpers live in `generator-support.ts`
- top-level orchestration lives in `run-pipeline.ts`
- helper and pipeline tests exist
- existing wiki regression tests still pass

## 12. Implementation Guidance

Implement this as a combined support/shell extraction, not a generator rewrite.

The value of this slice is:

- a smaller and more legible `generator.ts`
- clearer separation between support helpers, orchestration shell, and generation internals
- a cleaner base for any later decision about remaining utility/helper ownership
