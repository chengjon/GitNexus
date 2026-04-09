# Parse Worker Laravel Route Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract Laravel route parsing out of `parse-worker.ts` into a dedicated module without changing the worker output contract or downstream route-to-CALLS behavior.

**Architecture:** Move `ExtractedRoute` into a route-specific types module and move the Laravel AST-walk subsystem into `src/core/ingestion/routes/laravel-route-extraction.ts`. Keep `parse-worker.ts` responsible for worker orchestration only, and keep downstream consumers (`parsing-processor.ts`, `call-processor.ts`) using the same route shape through the new type import path.

**Tech Stack:** TypeScript, Vitest, Tree-sitter AST traversal, worker-based ingestion pipeline

**Execution status sync (2026-04-08):** This historical implementation plan is complete. This slice predates the current OpenSpec workflow, so use [2026-03-26-parse-worker-laravel-route-extraction-design.md](/opt/claude/GitNexus/docs/superpowers/specs/2026-03-26-parse-worker-laravel-route-extraction-design.md) and [2026-03-24-gitnexus-technical-debt-remediation-roadmap.md](/opt/claude/GitNexus/docs/superpowers/plans/2026-03-24-gitnexus-technical-debt-remediation-roadmap.md) as the merged-state truth sources.

---

## Planned File Structure

**Create:**
- `gitnexus/src/core/ingestion/routes/types.ts`
- `gitnexus/src/core/ingestion/routes/laravel-route-extraction.ts`
- `gitnexus/test/unit/laravel-route-extraction.test.ts`

**Modify:**
- `gitnexus/src/core/ingestion/workers/parse-worker.ts`
- `gitnexus/src/core/ingestion/parsing-processor.ts`
- `gitnexus/src/core/ingestion/call-processor.ts`

**Intentionally unchanged in this phase:**
- `gitnexus/src/core/ingestion/framework-detection.ts`
- `gitnexus/src/core/ingestion/workers/worker-pool.ts`
- PHP / Eloquent description helpers beyond the minimum shared-helper imports

This is a narrow extraction, not a parse-worker redesign.

### Task 1: Extract Route Types

**Files:**
- Create: `gitnexus/src/core/ingestion/routes/types.ts`
- Modify: `gitnexus/src/core/ingestion/workers/parse-worker.ts`
- Modify: `gitnexus/src/core/ingestion/parsing-processor.ts`
- Modify: `gitnexus/src/core/ingestion/call-processor.ts`

- [x] **Step 1: Write the failing import-path test**

Add a minimal unit assertion in a new or existing test that imports `ExtractedRoute` from the new path:

```ts
import type { ExtractedRoute } from '../../src/core/ingestion/routes/types.js';

type _RouteShapeCheck = ExtractedRoute;
```

Use a smoke-style test file if needed so the module path must resolve at compile/import time.

- [x] **Step 2: Run the failing test to verify the new type module does not exist yet**

Run:

```bash
cd gitnexus
npx vitest run test/unit/laravel-route-extraction.test.ts
```

Expected:
- module import fails because `routes/types.ts` does not exist yet

- [x] **Step 3: Create `routes/types.ts` with `ExtractedRoute` only**

Move the `ExtractedRoute` interface out of `parse-worker.ts` unchanged.

```ts
export interface ExtractedRoute {
  filePath: string;
  httpMethod: string;
  routePath: string | null;
  controllerName: string | null;
  methodName: string | null;
  middleware: string[];
  prefix: string | null;
  lineNumber: number;
}
```

- [x] **Step 4: Update downstream imports**

Change:

- `call-processor.ts`
- `parsing-processor.ts`
- `parse-worker.ts`

to import `ExtractedRoute` from `./routes/types.js` (or the correct relative path), while leaving all runtime behavior unchanged.

- [x] **Step 5: Run focused verification and commit**

Run:

```bash
cd gitnexus
npx vitest run test/unit/laravel-route-extraction.test.ts
npm run build
```

Expected:
- route type module resolves
- build passes after import-path changes

Commit:

```bash
git add gitnexus/src/core/ingestion/routes/types.ts gitnexus/src/core/ingestion/workers/parse-worker.ts gitnexus/src/core/ingestion/parsing-processor.ts gitnexus/src/core/ingestion/call-processor.ts gitnexus/test/unit/laravel-route-extraction.test.ts
git commit -m "refactor: extract laravel route types"
```

### Task 2: Add Focused Laravel Route Extraction Tests

**Files:**
- Create: `gitnexus/test/unit/laravel-route-extraction.test.ts`

- [x] **Step 1: Write failing unit tests for the route extractor API**

Add tests that target the extracted function you plan to create:

- simple `Route::get('/users', ...)`
- `Route::middleware('auth')->group(...)`
- `Route::prefix('api')->controller(UserController::class)->group(...)`
- `Route::resource(...)`
- `Route::apiResource(...)`
- invokable controller target
- nested groups preserving middleware/prefix composition

The tests should exercise returned `ExtractedRoute[]` records, not internal AST helper behavior.

- [x] **Step 2: Run the new tests to verify they fail before implementation**

Run:

```bash
cd gitnexus
npx vitest run test/unit/laravel-route-extraction.test.ts
```

Expected:
- tests fail because `extractLaravelRoutes` is not exported from the new module yet

- [x] **Step 3: Keep the fixture style narrow**

Use small PHP snippets as inline strings or lightweight helper fixtures. Do not create a large fixture corpus in this slice.

- [x] **Step 4: Re-run and confirm failures are meaningful**

Expected:
- failures point to missing extraction implementation, not bad test setup

Commit:

```bash
git add gitnexus/test/unit/laravel-route-extraction.test.ts
git commit -m "test: define laravel route extraction contract"
```

### Task 3: Extract Laravel Route Parsing Module

**Files:**
- Create: `gitnexus/src/core/ingestion/routes/laravel-route-extraction.ts`
- Modify: `gitnexus/src/core/ingestion/workers/parse-worker.ts`

- [x] **Step 1: Create the new route extraction module**

Move these route-specific pieces into `laravel-route-extraction.ts`:

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

- [x] **Step 2: Handle shared helper dependencies narrowly**

Do not duplicate `extractStringContent` and `findDescendant`.

Import them from `parse-worker.ts` only if the file structure allows it cleanly, or move them to a tiny shared PHP helper module only if necessary to break an unhealthy dependency cycle.

Preferred first move:
- keep them shared with minimal churn
- do not expand into PHP/Eloquent refactoring

- [x] **Step 3: Rewire `parse-worker.ts`**

Make `parse-worker.ts`:

- import `extractLaravelRoutes`
- call it where it currently inlines the route extraction logic
- stop owning those Laravel-specific helper definitions

- [x] **Step 4: Run the focused route extraction tests**

Run:

```bash
cd gitnexus
npx vitest run test/unit/laravel-route-extraction.test.ts
```

Expected:
- route extraction tests pass

- [x] **Step 5: Run downstream safety checks**

Run:

```bash
cd gitnexus
npx vitest run test/unit/calltool-dispatch.test.ts test/integration/local-backend.test.ts
npm run build
```

Expected:
- no import/type regressions
- build passes

Commit:

```bash
git add gitnexus/src/core/ingestion/routes/laravel-route-extraction.ts gitnexus/src/core/ingestion/workers/parse-worker.ts gitnexus/test/unit/laravel-route-extraction.test.ts
git commit -m "refactor: extract laravel route parsing module"
```

### Task 4: Verify Downstream Route Consumers

**Files:**
- Modify only if required by breakage discovered in verification:
  - `gitnexus/src/core/ingestion/call-processor.ts`
  - `gitnexus/src/core/ingestion/parsing-processor.ts`

- [x] **Step 1: Run downstream route-consumer tests**

Use the most relevant route / parse pipeline tests already in the suite. At minimum:

```bash
cd gitnexus
npx vitest run test/unit/laravel-route-extraction.test.ts
npx vitest run test/integration/local-backend.test.ts
npm run build
```

If a more directly relevant route/call-processing test exists, prefer that too.

- [x] **Step 2: Fix only true downstream breakage**

Acceptable fixes:

- import path updates
- type import cleanup
- no-op runtime wiring repairs

Do not redesign `call-processor.ts` route semantics in this slice.

- [x] **Step 3: Commit downstream compatibility fixes**

```bash
git add gitnexus/src/core/ingestion/call-processor.ts gitnexus/src/core/ingestion/parsing-processor.ts
git commit -m "fix: preserve downstream route extraction compatibility"
```

### Task 5: Final Verification and Documentation Sync

**Files:**
- Modify: `docs/superpowers/specs/2026-03-26-parse-worker-laravel-route-extraction-design.md` only if implementation meaningfully differs

- [x] **Step 1: Run final verification commands**

Run:

```bash
cd gitnexus
npx vitest run test/unit/laravel-route-extraction.test.ts test/unit/git.test.ts test/unit/calltool-dispatch.test.ts
npx vitest run --config vitest.integration.native.config.ts test/integration/local-backend.test.ts
npm run build
```

Expected:
- route extraction tests pass
- no downstream regression in the checked integration path
- build passes

- [x] **Step 2: Review the final diff**

Run:

```bash
git diff --stat main...HEAD
git diff -- gitnexus/src/core/ingestion/workers/parse-worker.ts gitnexus/src/core/ingestion/routes
```

Expected:
- changes are concentrated in the route extraction slice
- no unrelated parse-worker responsibilities moved

- [x] **Step 3: Sync the spec only if needed**

If implementation required a bounded deviation from the approved design, update the spec.

- [x] **Step 4: Commit doc sync if needed**

```bash
git add docs/superpowers/specs/2026-03-26-parse-worker-laravel-route-extraction-design.md
git commit -m "docs: sync parse worker route extraction design"
```

## Historical Verification Summary

- The technical-debt roadmap now records the Laravel route extraction slice as
  completed and landed on `main`, including the downstream move to the route
  type boundary in `call-processor.ts` and `parsing-processor.ts`.
- The repository now contains the planned extracted files plus
  `gitnexus/src/core/ingestion/routes/php-route-shared.ts`, which was the
  bounded shared-helper follow-through used to avoid a backwards dependency
  from the extracted route module into `parse-worker.ts`.
- The focused regression target named in this plan now exists as
  `gitnexus/test/unit/laravel-route-extraction.test.ts`.

## Execution Notes

- Keep this slice about Laravel route extraction only.
- Do not refactor PHP description helpers unless needed to break a hard dependency cycle.
- Do not redesign route-to-CALLS logic in `call-processor.ts`.
- Prefer preserving data shape over “cleaning up” semantics in the first move.
