# Wiki Generator Module Tree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the module-tree construction subsystem out of `gitnexus/src/core/wiki/generator.ts` into a dedicated module without changing wiki generation behavior.

**Architecture:** Move `ModuleTreeNode` and the tree-building helpers (`buildModuleTree`, grouping parsing/fallback, splitting, flatten/count helpers) into `src/core/wiki/module-tree/`. Keep `WikiGenerator` responsible for orchestration, page generation, metadata persistence, and incremental update flow. This is a narrow extraction, not a wiki-pipeline redesign.

**Tech Stack:** TypeScript, Vitest, filesystem I/O, LLM prompt orchestration, Kuzu-backed wiki graph queries

---

## Planned File Structure

**Create:**
- `gitnexus/src/core/wiki/module-tree/types.ts`
- `gitnexus/src/core/wiki/module-tree/builder.ts`
- `gitnexus/test/unit/wiki-module-tree.test.ts`

**Modify:**
- `gitnexus/src/core/wiki/generator.ts`

**Intentionally unchanged in this phase:**
- `gitnexus/src/core/wiki/graph-queries.ts`
- `gitnexus/src/core/wiki/prompts.ts`
- `gitnexus/src/core/wiki/html-viewer.ts`
- `gitnexus/src/cli/wiki.ts`

This is a local hotspot reduction slice, not a CLI behavior change.

### Task 1: Extract the Module Tree Type

**Files:**
- Create: `gitnexus/src/core/wiki/module-tree/types.ts`
- Modify: `gitnexus/src/core/wiki/generator.ts`
- Test: `gitnexus/test/unit/wiki-module-tree.test.ts`

- [ ] **Step 1: Write the failing type-boundary test**

Create a minimal test file that imports `ModuleTreeNode` from the new module path and asserts the boundary resolves at runtime.

Example:

```ts
import { describe, expect, it } from 'vitest';
import * as moduleTreeTypes from '../../src/core/wiki/module-tree/types.js';
import type { ModuleTreeNode } from '../../src/core/wiki/module-tree/types.js';

describe('wiki module tree types', () => {
  it('resolves ModuleTreeNode from the new module boundary', () => {
    const nodes: ModuleTreeNode[] = [];
    expect(Array.isArray(nodes)).toBe(true);
    expect(moduleTreeTypes).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run the new test to verify failure**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-module-tree.test.ts
```

Expected:
- failure because `module-tree/types.ts` does not exist yet

- [ ] **Step 3: Create `module-tree/types.ts`**

Move `ModuleTreeNode` out of `generator.ts` unchanged.

```ts
export interface ModuleTreeNode {
  name: string;
  slug: string;
  files: string[];
  children?: ModuleTreeNode[];
}
```

- [ ] **Step 4: Update `generator.ts` imports**

Remove the inline `ModuleTreeNode` declaration and import it from `./module-tree/types.js`.

- [ ] **Step 5: Run verification and commit**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-module-tree.test.ts
npm run build
```

Expected:
- new type-boundary test passes
- build passes

Commit:

```bash
git add gitnexus/src/core/wiki/module-tree/types.ts gitnexus/src/core/wiki/generator.ts gitnexus/test/unit/wiki-module-tree.test.ts
git commit -m "refactor: extract wiki module tree types"
```

### Task 2: Define the Module Tree Builder Contract

**Files:**
- Modify: `gitnexus/test/unit/wiki-module-tree.test.ts`

- [ ] **Step 1: Add failing contract tests for tree-building behavior**

Extend `wiki-module-tree.test.ts` with focused tests for:

- parsing JSON inside markdown fences
- fallback grouping when JSON parsing fails
- assigning ungrouped files to `Other`
- splitting oversized modules by subdirectory
- flattening order: leaves first, parents second

Keep fixtures small and local to the test file.

- [ ] **Step 2: Run the tests and verify they fail meaningfully**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-module-tree.test.ts
```

Expected:
- failures point to missing builder exports / missing extracted behavior, not broken fixtures

- [ ] **Step 3: Avoid over-scoping tests**

Do not test:

- LLM network calls
- prompt text contents
- file I/O snapshot persistence

This slice is about builder logic only.

- [ ] **Step 4: Commit the contract tests**

```bash
git add gitnexus/test/unit/wiki-module-tree.test.ts
git commit -m "test: define wiki module tree builder contract"
```

### Task 3: Extract the Module Tree Builder

**Files:**
- Create: `gitnexus/src/core/wiki/module-tree/builder.ts`
- Modify: `gitnexus/src/core/wiki/generator.ts`

- [ ] **Step 1: Create `builder.ts` and move the module-tree helpers**

Move these methods/behaviors into the builder module:

- `buildModuleTree`
- `parseGroupingResponse`
- `fallbackGrouping`
- `splitBySubdirectory`
- `countModules`
- `flattenModuleTree`

Do not move page-generation methods.

- [ ] **Step 2: Make dependencies explicit**

The builder must not capture the whole `WikiGenerator` instance.

Pass only the dependencies it needs, for example:

- `wikiDir`
- `llmConfig`
- `maxTokensPerModule`
- `onProgress`
- `slugify`
- `estimateModuleTokens`

If a helper only needs data, pass data; do not pass `this`.

- [ ] **Step 3: Rewire `generator.ts` to call the extracted builder**

Keep `WikiGenerator.run()`, `fullGeneration()`, and `incrementalUpdate()` behavior stable.

The call site should remain easy to read:

```ts
const moduleTree = await buildModuleTree({
  files: enrichedFiles,
  wikiDir: this.wikiDir,
  llmConfig: this.llmConfig,
  maxTokensPerModule: this.maxTokensPerModule,
  onProgress: this.onProgress,
  ...
});
```

- [ ] **Step 4: Run focused builder tests**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-module-tree.test.ts
```

Expected:
- builder contract tests pass

- [ ] **Step 5: Run downstream compile verification**

Run:

```bash
cd gitnexus
npm run build
```

Expected:
- no import/type breakage in `generator.ts` or downstream wiki code

Commit:

```bash
git add gitnexus/src/core/wiki/module-tree/builder.ts gitnexus/src/core/wiki/generator.ts gitnexus/test/unit/wiki-module-tree.test.ts
git commit -m "refactor: extract wiki module tree builder"
```

### Task 4: Verify Generator Compatibility

**Files:**
- Modify only if compatibility fixes are truly needed:
  - `gitnexus/src/core/wiki/generator.ts`

- [ ] **Step 1: Run targeted wiki verification**

At minimum:

```bash
cd gitnexus
npx vitest run test/unit/wiki-module-tree.test.ts
npm run build
```

If a direct wiki generator / wiki CLI test exists and is reliable in this repo, run it too.

- [ ] **Step 2: Fix only real compatibility issues**

Allowed fixes:

- import path cleanup
- dependency wiring cleanup
- type adjustments that preserve current behavior

Do not redesign incremental update or page generation here.

- [ ] **Step 3: Commit any compatibility-only fixes**

```bash
git add gitnexus/src/core/wiki/generator.ts
git commit -m "fix: preserve wiki generator module tree compatibility"
```

### Task 5: Final Verification and Spec Sync

**Files:**
- Modify: `docs/superpowers/specs/2026-03-26-wiki-generator-module-tree-design.md` only if implementation meaningfully differs

- [ ] **Step 1: Run final verification**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-module-tree.test.ts
npm run build
```

Expected:
- focused builder tests pass
- build passes

- [ ] **Step 2: Review final diff concentration**

Run:

```bash
git diff --stat main...HEAD
git diff -- gitnexus/src/core/wiki/generator.ts gitnexus/src/core/wiki/module-tree
```

Expected:
- changes are concentrated in the module-tree slice
- page-generation logic is largely untouched

- [ ] **Step 3: Sync the spec only if needed**

Update the design doc only if implementation required a bounded deviation from the approved design.

- [ ] **Step 4: Commit spec sync if needed**

```bash
git add docs/superpowers/specs/2026-03-26-wiki-generator-module-tree-design.md
git commit -m "docs: sync wiki module tree design"
```

## Execution Notes

- Keep this slice about module-tree construction only.
- Do not extract `generateLeafPage`, `generateParentPage`, or `incrementalUpdate`.
- Prefer explicit dependency passing over passing the entire generator instance.
- Preserve the current tree shape and grouping semantics on the first extraction.
