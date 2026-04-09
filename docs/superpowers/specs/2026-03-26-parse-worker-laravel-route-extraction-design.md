# Parse Worker Laravel Route Extraction Design

Date: 2026-03-26  
Status: Landed on current `main`; retained as a historical design record  
Scope: `gitnexus/src/core/ingestion/workers/parse-worker.ts`

## Implementation Sync (2026-04-08)

- The Laravel route extraction slice has landed and the repository now contains:
  - `gitnexus/src/core/ingestion/routes/types.ts`
  - `gitnexus/src/core/ingestion/routes/laravel-route-extraction.ts`
  - `gitnexus/src/core/ingestion/routes/php-route-shared.ts`
  - downstream `call-processor.ts` / `parsing-processor.ts` imports from
    `routes/types.ts`
- The current technical-debt roadmap records this slice as completed in the
  `2026-03-28` progress update.
- Bounded implementation note:
  - the draft originally preferred importing shared helpers from
    `parse-worker.ts`
  - the landed implementation instead extracted those helpers into
    `routes/php-route-shared.ts`, which preserved the route-focused scope while
    keeping dependency direction cleaner

## 1. Goal

Reduce the size and responsibility overlap inside `parse-worker.ts` by extracting the Laravel route parsing block into its own focused module, without changing the worker input/output contract or the downstream route-to-CALLS pipeline.

This is a targeted `P1` hotspot-reduction slice. It is not a general parse-worker rewrite.

## 2. Current Problem

`parse-worker.ts` currently mixes:

- generic worker parsing flow
- generic symbol/call/import extraction
- PHP-specific description helpers
- a large Laravel route extraction subsystem

The Laravel route code is cohesive on its own, but it currently lives inline inside the worker file. That creates three problems:

1. it inflates a hotspot file that is already hard to review safely
2. it hides a framework-specific parser inside a general-purpose worker
3. it makes Laravel route behavior harder to test in isolation

## 3. Chosen Scope

This slice will extract only the Laravel route parsing subsystem.

Included:

- `ExtractedRoute` type
- `RouteGroupContext`
- route-chain parsing helpers
- `extractLaravelRoutes(...)`

Explicitly not included:

- PHP / Eloquent description helpers
- generic parse-worker batching flow
- route-to-CALLS resolution in `call-processor.ts`
- broader PHP or framework-detection refactors

## 4. Design Options

### Option A: Move only the implementation function

Move `extractLaravelRoutes(...)` into its own file but keep `ExtractedRoute` in `parse-worker.ts`.

Pros:

- smallest code movement

Cons:

- the new module would still depend on types defined in the old hotspot file
- keeps a backwards dependency from a focused module into a giant worker file

### Option B: Move route implementation and route types together

Create a small `routes/` area under `src/core/ingestion/`:

- `routes/types.ts`
- `routes/laravel-route-extraction.ts`

Pros:

- clean dependency direction
- `call-processor.ts` and `parsing-processor.ts` can depend on route types without importing the worker
- makes future framework-specific route extraction easier

Cons:

- touches a few more files

### Option C: Extract Laravel routes plus PHP relationship/description logic

Pros:

- biggest immediate shrink in `parse-worker.ts`

Cons:

- scope expands too quickly
- mixes two unrelated refactors
- higher regression risk

## 5. Recommendation

Use Option B.

This keeps the refactor small, but still gives a clean module boundary:

- route extraction logic no longer lives in the worker hotspot
- route types no longer depend on `parse-worker.ts`
- downstream consumers can import route types directly

## 6. Target File Structure

Add:

```text
gitnexus/src/core/ingestion/routes/
  types.ts
  laravel-route-extraction.ts
  php-route-shared.ts
```

Modify:

- `gitnexus/src/core/ingestion/workers/parse-worker.ts`
- `gitnexus/src/core/ingestion/call-processor.ts`
- `gitnexus/src/core/ingestion/parsing-processor.ts`

Recommended responsibilities:

### `routes/types.ts`

Own only:

- `ExtractedRoute`

This file should stay small and framework-neutral.

### `routes/laravel-route-extraction.ts`

Own only:

- `RouteGroupContext`
- `isRouteStaticCall`
- `getCallMethodName`
- `getArguments`
- `findClosureBody`
- `extractFirstStringArg`
- `extractMiddlewareArg`
- `extractClassArg`
- `extractControllerTarget`
- `ChainedRouteCall`
- `unwrapRouteChain`
- `parseArrayGroupArgs`
- `extractLaravelRoutes`

This file should depend only on the minimum helper set it needs.

### Shared Helper Handling

`extractStringContent` and `findDescendant` are currently shared by the Laravel route extractor and other PHP-specific logic in `parse-worker.ts`.

Historical draft preference:

- keep these two helpers in `parse-worker.ts`
- import them into `routes/laravel-route-extraction.ts`
- avoid duplicating them during the first extraction

Landed implementation note:

- the final implementation extracted these helpers into
  `routes/php-route-shared.ts`
- this kept the slice narrow while also avoiding a backwards dependency from
  `routes/laravel-route-extraction.ts` into `parse-worker.ts`
- no broader PHP / Eloquent helper refactor was reopened as part of that move

### `workers/parse-worker.ts`

After extraction, it should:

- import `ExtractedRoute`
- import `extractLaravelRoutes`
- call it from the existing worker flow
- stop owning Laravel-specific route parsing internals

### Import Path Changes

Expected downstream import changes:

```ts
// Before (call-processor.ts)
import type { ExtractedRoute } from './workers/parse-worker.js';

// After
import type { ExtractedRoute } from './routes/types.js';
```

```ts
// Before (parsing-processor.ts)
import type { ParseWorkerResult, ParseWorkerInput, ExtractedImport, ExtractedCall, ExtractedHeritage, ExtractedRoute } from './workers/parse-worker.js';

// After
import type { ParseWorkerResult, ParseWorkerInput, ExtractedImport, ExtractedCall, ExtractedHeritage } from './workers/parse-worker.js';
import type { ExtractedRoute } from './routes/types.js';
```

Optional follow-up only:

- add `routes/index.ts` as a barrel export if the route area grows beyond this initial Laravel extraction
- do not require that barrel in this first slice

## 7. Behavior Requirements

The extraction must preserve:

- route HTTP method recognition
- resource / apiResource expansion
- route group middleware aggregation
- route prefix propagation
- controller inference
- invokable controller handling
- nested group behavior
- line number reporting
- returned `routes` array shape in `ParseWorkerResult`

The worker’s external behavior must remain unchanged.

## 8. Downstream Compatibility

The following downstream behavior must not change:

- `parsing-processor.ts` still aggregates `routes`
- `call-processor.ts` still consumes `ExtractedRoute[]`
- route-derived CALLS edges still resolve exactly as before

This means the refactor is successful only if route extraction is a pure relocation of behavior.

## 9. Testing Strategy

### 9.1 New Focused Unit Tests

Add a dedicated Laravel route extraction test file:

- `gitnexus/test/unit/laravel-route-extraction.test.ts`

Cover:

- simple `Route::get(...)`
- grouped routes with middleware
- grouped routes with prefix
- controller groups
- `resource(...)`
- `apiResource(...)`
- invokable controller case
- nested group composition

### 9.2 Existing Integration Preservation

Retain or rerun the current downstream tests that prove:

- parse-worker still emits route data
- call-processor still converts routes into CALLS edges correctly

### 9.3 Non-Goals for Tests

Do not use this slice to redesign framework detection or PHP AST helpers outside the route subsystem.

## 10. Risks

### Risk 1: Silent schema drift

If `ExtractedRoute` is moved carelessly, downstream code may still compile but semantics can drift.

Mitigation:

- keep the type identical on first extraction
- rerun downstream route consumers

### Risk 2: Hidden helper dependencies

Laravel route parsing currently relies on helper functions inside `parse-worker.ts`.

Mitigation:

- move only the route-specific helpers
- import shared generic helpers explicitly rather than duplicating them

### Risk 3: Scope creep into PHP-specific logic

It is tempting to extract Eloquent description helpers at the same time.

Mitigation:

- keep this slice strictly about Laravel route extraction

## 11. Success Criteria

This slice is successful when:

- `parse-worker.ts` no longer contains the Laravel route extraction subsystem
- route extraction lives in a dedicated module with a clear type boundary
- downstream route consumers still behave the same
- focused Laravel route tests exist
- no broader parse-worker behavior changes are introduced

## 12. Implementation Guidance

Implement this as a narrow module extraction, not a worker redesign.

The value of this slice is clarity:

- smaller hotspot file
- cleaner dependency direction
- isolated route extraction behavior

That makes the next `parse-worker.ts` reductions safer and easier to reason about.
