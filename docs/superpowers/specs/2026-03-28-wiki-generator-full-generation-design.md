# Wiki Generator Full Generation Design

Date: 2026-03-28  
Status: Draft for review  
Scope: `gitnexus/src/core/wiki/generator.ts`

## 1. Goal

Reduce the remaining responsibility load inside `WikiGenerator` by extracting full-generation orchestration into a dedicated module, while preserving current wiki generation behavior.

This is the next narrow `P1` hotspot-reduction slice after the leaf-page, parent-page, overview-page, incremental-update, support-helper, and run-shell extractions. It is not a redesign of page generation, metadata persistence ownership, or graph query behavior.

## 2. Current Problem

After the previous extractions, `generator.ts` still owns:

- the `fullGeneration` orchestration flow
- generator-local utility helpers
- a few remaining low-level persistence helpers

`fullGeneration` is now the largest remaining flow-heavy method in `generator.ts`. That creates three practical problems:

1. top-level full-generation orchestration is still embedded in the class file
2. the main full-generation branches are harder to test independently from the class shell
3. future cleanup of remaining utility helpers is harder while the biggest flow method is still in place

## 3. Chosen Scope

This slice extracts only:

- `fullGeneration`

Explicitly not included:

- `run()`
- `incrementalUpdate`
- `ensureHTMLViewer`
- `getCurrentCommit`
- `loadWikiMeta`
- `saveWikiMeta`
- `saveModuleTree`
- `runParallel`
- page helper ownership
- module-tree builder ownership

Those may be passed explicitly, but ownership stays on `WikiGenerator` in this slice.

## 4. Design Options

### Option A: Extract only `fullGeneration`

Move the full-generation body into `src/core/wiki/full-generation.ts`, passing generator-owned helpers explicitly.

Pros:

- smallest safe move
- preserves current call boundaries from `run()` and incremental fallback
- consistent with the previous extraction style

Cons:

- large helper option surface

### Option B: Extract `fullGeneration` and also move surrounding utility helpers

Move `fullGeneration` together with helpers like `estimateModuleTokens`, `fileExists`, or metadata save helpers.

Pros:

- larger immediate reduction in `generator.ts`

Cons:

- much wider regression surface
- blends flow extraction with utility migration

### Option C: Rework full + incremental orchestration together

Treat this slice as a broader generation-pipeline rewrite.

Pros:

- could simplify the whole wiki generation layer faster

Cons:

- too wide for a safe next step
- harder to review and verify incrementally

## 5. Recommendation

Use Option A.

This keeps the move narrow and consistent with the prior extractions: isolate one cohesive flow, preserve helper ownership, and use explicit dependencies where the helper still needs class-owned state.

## 6. Target File Structure

Add:

```text
gitnexus/src/core/wiki/
  full-generation.ts
```

Modify:

- `gitnexus/src/core/wiki/generator.ts`
- `gitnexus/test/unit/wiki-generator-orchestration.test.ts`

Add focused tests:

- `gitnexus/test/unit/wiki-full-generation.test.ts`

Reused unchanged dependency:

- `gitnexus/src/core/wiki/generator-support.ts`

Optional follow-up only:

- move remaining utility helpers later if they still form a coherent hotspot

## 7. Responsibility Split

### `full-generation.ts`

Own only:

- `runFullGeneration`

Suggested shape:

```ts
export interface RunFullGenerationOptions {
  currentCommit: string;
  wikiDir: string;
  llmConfig: LLMConfig;
  maxTokensPerModule: number;
  failedModules: string[];
  onProgress: ProgressCallback;
  slugify: (name: string) => string;
  estimateModuleTokens: (filePaths: string[]) => Promise<number>;
  streamOpts: (label: string, fixedPercent?: number) => CallLLMOptions;
  fileExists: (filePath: string) => Promise<boolean>;
  saveModuleTree: (tree: ModuleTreeNode[]) => Promise<void>;
  saveWikiMeta: (meta: WikiMeta) => Promise<void>;
  runParallel: <T>(items: T[], fn: (item: T) => Promise<number>) => Promise<number>;
}

export interface FullGenerationDeps {
  generateLeafPage: (node: ModuleTreeNode) => Promise<void>;
  generateParentPage: (node: ModuleTreeNode) => Promise<void>;
  generateOverviewPage: (moduleTree: ModuleTreeNode[]) => Promise<void>;
}

export async function runFullGeneration(
  options: RunFullGenerationOptions,
  deps: FullGenerationDeps,
): Promise<{ pagesGenerated: number; mode: 'full'; failedModules: string[] }> { ... }
```

The helper should directly import:

- from `./graph-queries.js`:
  - `getFilesWithExports`
  - `getAllFiles`
- from `./module-tree/builder.js`:
  - `buildModuleTree`
  - `countModules`
  - `flattenModuleTree`
- from `./generator-support.js`:
  - `extractModuleFiles`
- from `../../config/ignore-service.js`:
  - `shouldIgnorePath`

`extractModuleFiles` is not moved in this slice. `full-generation.ts` should directly reuse the existing `generator-support.ts` export as a stable dependency rather than receiving it via options.

Generation-count ownership remains on `runFullGeneration(...)`, not on the page helpers:

- `generateLeafPage` / `generateParentPage` / `generateOverviewPage` stay `Promise<void>`
- `runFullGeneration(...)` performs the existing-page short-circuit itself
- `runFullGeneration(...)` returns `0|1` from its internal orchestration callbacks to `runParallel(...)`
- `pagesGenerated` is accumulated only from those orchestration-level `0|1` decisions

### `generator.ts`

After extraction, `WikiGenerator` should:

- import `runFullGeneration`
- keep `fullGeneration()` as a thin wrapper method so existing callers do not change
- continue owning `estimateModuleTokens`, `fileExists`, `saveModuleTree`, `saveWikiMeta`, `runParallel`, `streamOpts`, and page-helper wrappers
- keep overview-page ownership on the already-extracted top-level `generateOverviewPage(...)` helper from `./pages/overview-page.js`, but pass it into `runFullGeneration(...)` via `FullGenerationDeps`

This slice should reduce `generator.ts` body size without changing its public or internal call boundaries.

## 8. Behavior Requirements

The extraction must preserve:

### 8.1 Full generation flow

- phase 0 graph gather:
  - `onProgress('gather', 5, ...)`
  - `getFilesWithExports()`
  - `getAllFiles()`
  - `shouldIgnorePath(...)` source filtering
  - throw `No source files found in the knowledge graph. Nothing to document.` when empty

- enriched file list assembly:
  - merge exports into all source files exactly as today

- phase 1 module tree build:
  - `buildModuleTree(...)` inputs and progress behavior

- phase 2 page generation:
  - `countModules(...)`
  - `flattenModuleTree(...)`
  - leaf processing stays parallel
  - parent processing stays sequential
  - existing-page short-circuit still uses `fileExists(...)`
  - `runFullGeneration(...)` continues to own output path computation for that short-circuit (`${node.slug}.md` under `wikiDir`)
  - failures still append to `failedModules`
  - `pagesGenerated` increments only for newly generated leaf/parent pages, not for existing-page short-circuit paths

- phase 3 overview:
  - `runFullGeneration(...)` still owns the orchestration decision to trigger overview generation
  - it does so by calling the injected `generateOverviewPage(...)` dependency
  - overview generation still increments `pagesGenerated` by `1`

- finalize:
  - still calls `saveModuleTree(...)`
  - still calls `saveWikiMeta(...)`
  - metadata still uses `extractModuleFiles(moduleTree)` from generator-support
  - final return shape stays `{ pagesGenerated, mode: 'full', failedModules: [...] }`
  - `failedModules` continues to be the mutable array owned by the caller during execution, and the return value remains a snapshot copy (`[...failedModules]`) rather than the same reference

### 8.2 Progress behavior

Preserve the existing core progress shape:

- gather `5` and `10`
- modules progress spanning `30..85`
- overview `88`
- finalize `95`
- done `100`

`ProgressCallback` shape remains:

```ts
(phase: string, percent: number, detail?: string) => void
```

Expected phase names in this flow remain:

- `gather`
- `modules`
- `overview`
- `finalize`
- `done`

For this slice's focused tests, verify core phases only. Do not require a strict sequence over downstream helper-emitted `stream` callbacks (or outer-shell phases such as `init` / `html`), because those are not owned by `runFullGeneration(...)` itself.

### 8.3 Call boundaries

- `run()` still calls `this.fullGeneration(currentCommit)` through the existing wrapper path
- incremental-update fallback still calls `this.fullGeneration(currentCommit)` through the existing wrapper path

No user-visible wiki behavior should change intentionally in this slice.

## 9. Testing Strategy

### 9.1 New Focused Full Generation Tests

Add:

- `gitnexus/test/unit/wiki-full-generation.test.ts`

Cover:

- no-source-files error
- enriched file list assembly for `buildModuleTree`
- leaf/parent dispatch split
- existing-page short-circuit behavior
- overview + metadata save on success
- `failedModules` accumulation on page-generation failures
- progress phase sequence and expected percent windows for core phases only (`gather`, `modules`, `overview`, `finalize`, `done`, with module progress spanning `30..85`)

Use pure mocks only: no real graph, no real filesystem writes, no real page generation.

### 9.2 Existing Orchestration Test

Extend `gitnexus/test/unit/wiki-generator-orchestration.test.ts` so it verifies:

- `WikiGenerator.fullGeneration()` delegates through `runFullGeneration(...)`

This should be a thin wiring assertion only.

### 9.3 Existing Regression Verification

Retain or rerun the current worktree's existing wiki-focused verification.

At minimum, verify:

- `test/unit/wiki-full-generation.test.ts`
- `test/unit/wiki-generator-orchestration.test.ts`
- `test/unit/wiki-incremental-update.test.ts`
- `test/unit/wiki-page-generation.test.ts`
- `test/unit/wiki-module-tree.test.ts`
- `npm run build`

## 10. Risks

### Risk 1: High-blast-radius flow drift

`fullGeneration` has CRITICAL upstream impact and is on the main wiki generation path.

Mitigation:

- keep the extraction near-literal
- keep wrapper call boundaries unchanged
- add focused branch tests before implementation

### Risk 2: Progress/reporting drift

Small changes in progress math or timing will regress user-visible CLI behavior.

Mitigation:

- test the progress phases and module progress shape explicitly

### Risk 3: Over-widening the slice

It will be tempting to move more helpers once `fullGeneration` is being touched.

Mitigation:

- keep utility/helper ownership on `WikiGenerator`
- limit the helper to direct flow orchestration only

## 11. Success Criteria

This slice is successful when:

- `generator.ts` no longer owns the `fullGeneration` internals
- `runFullGeneration(...)` lives in `full-generation.ts`
- `fullGeneration()` remains as a thin wrapper in `generator.ts`
- focused full-generation tests exist
- existing wiki regressions still pass

`failedModules` continues to start from the `WikiGenerator` instance-owned array, which is expected to be empty at the start of a normal full-generation run and to accumulate only failures encountered during that run.

## 12. Implementation Guidance

Implement this as a narrow flow extraction, not a generation-pipeline rewrite.

The value of this slice is:

- a smaller `generator.ts`
- clearer separation between the full-generation flow and the remaining class-owned utilities
- a cleaner base for any later decision about the remaining utility/helper ownership
