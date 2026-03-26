# Wiki Generator Page Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract `generateLeafPage` and `generateParentPage` out of `gitnexus/src/core/wiki/generator.ts` into dedicated page-generation modules without changing wiki output behavior.

**Architecture:** Move leaf and parent page generation into `src/core/wiki/pages/leaf-page.ts` and `src/core/wiki/pages/parent-page.ts`. Keep `WikiGenerator` responsible for orchestration, overview generation, incremental updates, metadata persistence, and progress reporting. Pass dependencies explicitly rather than moving the whole class instance into the new modules.

**Tech Stack:** TypeScript, Vitest, filesystem I/O, LLM prompt orchestration, wiki graph queries

---

## Planned File Structure

**Create:**
- `gitnexus/src/core/wiki/pages/leaf-page.ts`
- `gitnexus/src/core/wiki/pages/parent-page.ts`
- `gitnexus/test/unit/wiki-page-generation.test.ts`

**Modify:**
- `gitnexus/src/core/wiki/generator.ts`

**Intentionally unchanged in this phase:**
- `gitnexus/src/core/wiki/module-tree/`
- `gitnexus/src/core/wiki/html-viewer.ts`
- `gitnexus/src/core/wiki/graph-queries.ts`
- `gitnexus/src/cli/wiki.ts`

This is a page-generation extraction only.

### Task 1: Define Page Generation Contract Tests

**Files:**
- Create: `gitnexus/test/unit/wiki-page-generation.test.ts`

- [ ] **Step 1: Write the failing test file**

Create focused unit tests for:

- leaf page prompt assembly from:
  - source code
  - intra-module calls
  - inter-module calls
  - processes
- token truncation path for large source input
- parent page prompt assembly from child docs + cross-module graph data
- output page path naming remains `${slug}.md`

These tests should stub:

- graph query helpers
- `callLLM`
- filesystem reads/writes where needed

Do not depend on real model output.

- [ ] **Step 2: Run the new tests to verify failure**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-page-generation.test.ts
```

Expected:
- failure because page-generation modules do not exist yet

- [ ] **Step 3: Keep fixture data narrow**

Use small inline fixture strings and fake `ModuleTreeNode` objects.

- [ ] **Step 4: Commit the contract tests**

```bash
git add gitnexus/test/unit/wiki-page-generation.test.ts
git commit -m "test: define wiki page generation contract"
```

### Task 2: Extract Leaf Page Generation

**Files:**
- Create: `gitnexus/src/core/wiki/pages/leaf-page.ts`
- Modify: `gitnexus/src/core/wiki/generator.ts`
- Modify: `gitnexus/test/unit/wiki-page-generation.test.ts`

- [ ] **Step 1: Implement `leaf-page.ts`**

Move `generateLeafPage` into a standalone exported function.

Suggested shape:

```ts
export interface GenerateLeafPageOptions {
  node: ModuleTreeNode;
  wikiDir: string;
  repoPath: string;
  llmConfig: LLMConfig;
  maxTokensPerModule: number;
  streamOpts: (label: string, fixedPercent?: number) => CallLLMOptions;
  readSourceFiles: (filePaths: string[]) => Promise<string>;
  truncateSource: (source: string, maxTokens: number) => string;
}

export async function generateLeafPage(options: GenerateLeafPageOptions): Promise<void> { ... }
```

Preserve:

- graph query usage
- token truncation behavior
- prompt template usage
- file output naming/location

- [ ] **Step 2: Rewire `generator.ts` to call the extracted leaf-page function**

Keep orchestration unchanged. `WikiGenerator` should pass explicit dependencies, not `this`.

- [ ] **Step 3: Run focused page-generation tests**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-page-generation.test.ts
```

Expected:
- leaf-page contract tests pass

- [ ] **Step 4: Run build verification**

Run:

```bash
cd gitnexus
npm run build
```

Expected:
- no import/type regressions

- [ ] **Step 5: Commit leaf-page extraction**

```bash
git add gitnexus/src/core/wiki/pages/leaf-page.ts gitnexus/src/core/wiki/generator.ts gitnexus/test/unit/wiki-page-generation.test.ts
git commit -m "refactor: extract wiki leaf page generation"
```

### Task 3: Extract Parent Page Generation

**Files:**
- Create: `gitnexus/src/core/wiki/pages/parent-page.ts`
- Modify: `gitnexus/src/core/wiki/generator.ts`
- Modify: `gitnexus/test/unit/wiki-page-generation.test.ts`

- [ ] **Step 1: Implement `parent-page.ts`**

Move `generateParentPage` into a standalone exported function.

Preserve:

- child page overview extraction
- graph query usage
- prompt template usage
- output page naming/location

- [ ] **Step 2: Rewire `generator.ts` to call the extracted parent-page function**

Keep current parent-page orchestration and failure handling intact.

- [ ] **Step 3: Run focused page-generation tests**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-page-generation.test.ts
```

Expected:
- parent-page contract tests pass

- [ ] **Step 4: Run build verification**

Run:

```bash
cd gitnexus
npm run build
```

Expected:
- build passes

- [ ] **Step 5: Commit parent-page extraction**

```bash
git add gitnexus/src/core/wiki/pages/parent-page.ts gitnexus/src/core/wiki/generator.ts gitnexus/test/unit/wiki-page-generation.test.ts
git commit -m "refactor: extract wiki parent page generation"
```

### Task 4: Verify Generator Compatibility

**Files:**
- Modify only if compatibility fixes are truly needed:
  - `gitnexus/src/core/wiki/generator.ts`

- [ ] **Step 1: Run targeted verification**

At minimum:

```bash
cd gitnexus
npx vitest run test/unit/wiki-page-generation.test.ts test/unit/wiki-module-tree.test.ts
npm run build
```

If a direct wiki generator / wiki CLI test exists and is reliable here, run it too.

- [ ] **Step 2: Fix only real compatibility issues**

Allowed fixes:

- import path cleanup
- dependency wiring cleanup
- small type fixes that preserve behavior

Do not extract `generateOverview` or `incrementalUpdate` in this slice.

- [ ] **Step 3: Commit compatibility-only fixes**

```bash
git add gitnexus/src/core/wiki/generator.ts
git commit -m "fix: preserve wiki page generation compatibility"
```

### Task 5: Final Verification and Spec Sync

**Files:**
- Modify: `docs/superpowers/specs/2026-03-26-wiki-generator-page-generation-design.md` only if implementation meaningfully differs

- [ ] **Step 1: Run final verification**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-page-generation.test.ts test/unit/wiki-module-tree.test.ts
npm run build
```

Expected:
- focused page-generation tests pass
- module-tree tests still pass
- build passes

- [ ] **Step 2: Review final diff concentration**

Run:

```bash
git diff --stat main...HEAD
git diff -- gitnexus/src/core/wiki/generator.ts gitnexus/src/core/wiki/pages
```

Expected:
- changes are concentrated in the page-generation slice
- overview and incremental update are largely untouched

- [ ] **Step 3: Sync the spec only if needed**

Update the design doc only if implementation required a bounded deviation from the approved design.

- [ ] **Step 4: Commit spec sync if needed**

```bash
git add docs/superpowers/specs/2026-03-26-wiki-generator-page-generation-design.md
git commit -m "docs: sync wiki page generation design"
```

## Execution Notes

- Keep this slice strictly about `generateLeafPage` and `generateParentPage`.
- Do not extract `generateOverview` or `incrementalUpdate`.
- Prefer explicit dependency passing over capturing the `WikiGenerator` instance.
- Preserve current prompt templates and output path behavior on the first move.
