# Wiki Generator Full Generation Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract `fullGeneration` out of `gitnexus/src/core/wiki/generator.ts` into a dedicated full-generation module without changing wiki generation behavior.

**Architecture:** Move the full-generation flow into `src/core/wiki/full-generation.ts`, while keeping `fullGeneration()` as a thin wrapper method on `WikiGenerator`. Keep ownership of utility helpers and page helper wrappers on `WikiGenerator`, and preserve the current call boundaries from both `run()` and incremental-update fallback.

**Tech Stack:** TypeScript, Vitest, filesystem I/O, graph queries, module-tree builder, wiki page helpers, GitNexus MCP impact/detect-changes

---

## Planned File Structure

**Create:**
- `gitnexus/src/core/wiki/full-generation.ts`
- `gitnexus/test/unit/wiki-full-generation.test.ts`

**Modify:**
- `gitnexus/src/core/wiki/generator.ts`
- `gitnexus/test/unit/wiki-generator-orchestration.test.ts`

**Reused unchanged dependency:**
- `gitnexus/src/core/wiki/generator-support.ts`

**Intentionally unchanged in this phase:**
- `gitnexus/src/core/wiki/run-pipeline.ts`
- `gitnexus/src/core/wiki/incremental-update.ts`
- `gitnexus/src/core/wiki/pages/leaf-page.ts`
- `gitnexus/src/core/wiki/pages/parent-page.ts`
- `gitnexus/src/core/wiki/pages/overview-page.ts`
- `gitnexus/src/core/wiki/module-tree/builder.ts`
- `gitnexus/src/core/wiki/graph-queries.ts`

This is a full-generation extraction only.

## Proposed API

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

Generation-count ownership stays in `runFullGeneration(...)`:

- page helpers stay `Promise<void>`
- `runFullGeneration(...)` performs existing-page short-circuit checks itself
- `runParallel(...)` callbacks continue returning `0|1`
- `pagesGenerated` is accumulated from those `0|1` decisions plus overview generation

## Behavioral Contracts To Preserve

- gather phase:
  - `onProgress('gather', 5, ...)`
  - `getFilesWithExports()`
  - `getAllFiles()`
  - `shouldIgnorePath(...)` filtering
  - throw `No source files found in the knowledge graph. Nothing to document.` on empty result
- build module tree with current `buildModuleTree(...)` option surface
- leaf generation:
  - existing-page short-circuit uses `${wikiDir}/${slug}.md`
  - successful new leaf page returns `1`
  - failure pushes to `failedModules` and returns `0`
- parent generation:
  - existing-page short-circuit uses `${wikiDir}/${slug}.md`
  - successful new parent page increments `pagesGenerated`
  - failure pushes to `failedModules`
- overview generation:
  - still orchestrated by `runFullGeneration(...)`
  - still calls injected `generateOverviewPage(...)`
  - still increments `pagesGenerated` by `1`
- finalize:
  - metadata still uses `extractModuleFiles(moduleTree)` from `generator-support.ts`
  - `saveModuleTree(...)`
  - `saveWikiMeta(...)`
  - returned `failedModules` remains a snapshot copy
- core progress phases only:
  - `gather` at `5` and `10`
  - `modules` spanning `30..85`
  - `overview` at `88`
  - `finalize` at `95`
  - `done` at `100`
- ignore downstream `stream` callbacks in focused progress assertions

## Task 1: Define Full Generation RED Contract Tests

**Files:**
- Create: `gitnexus/test/unit/wiki-full-generation.test.ts`

- [ ] **Step 1: Write the failing test file**

Create a focused unit test file that dynamically imports `../../src/core/wiki/full-generation.js`.

Cover:

- no-source-files error
- enriched file list assembly for `buildModuleTree`
- leaf/parent dispatch split
- existing-page short-circuit behavior
- overview + metadata save on success
- `failedModules` accumulation on generation failures
- core progress phase sequence and percent windows

Use pure mocks only:

- no real graph queries
- no real filesystem writes
- no real page generation

- [ ] **Step 2: Run the new test file to verify failure**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-full-generation.test.ts
```

Expected:
- failure because `src/core/wiki/full-generation.ts` does not exist yet

- [ ] **Step 3: Keep fixtures narrow**

Use small fake file lists, tiny `ModuleTreeNode[]` structures, and `vi.fn()` helper dependencies.

- [ ] **Step 4: Commit the RED full-generation contract tests**

Before committing, run:

```text
gitnexus_detect_changes({ scope: "staged", cwd: "/opt/claude/GitNexus/.worktrees/wiki-page-generation-subagents", repo: "GitNexus" })
```

Expected:
- only `wiki-full-generation.test.ts` is in scope
- risk remains `low`

```bash
git add gitnexus/test/unit/wiki-full-generation.test.ts
git commit -m "test: define wiki full generation contract"
```

## Task 2: Define Full Generation Orchestration RED Test

**Files:**
- Modify: `gitnexus/test/unit/wiki-generator-orchestration.test.ts`

- [ ] **Step 1: Add a self-contained per-test mock for `full-generation.js`**

In a new single test, use:

```ts
vi.resetModules();
const runFullGeneration = vi.fn(async () => ({
  pagesGenerated: 1,
  mode: 'full' as const,
  failedModules: [],
}));
vi.doMock('../../src/core/wiki/full-generation.js', () => ({
  runFullGeneration,
}));
const { WikiGenerator } = await import('../../src/core/wiki/generator.js');
```

- [ ] **Step 2: Assert wrapper wiring**

Verify that `WikiGenerator.fullGeneration()`:

- delegates through `runFullGeneration(...)`
- forwards current commit and key resolved dependencies

Keep this test wiring-only. Do not duplicate the branch behavior that belongs in `wiki-full-generation.test.ts`.

- [ ] **Step 3: Run RED tests**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-full-generation.test.ts test/unit/wiki-generator-orchestration.test.ts
```

Expected:
- `wiki-full-generation.test.ts` fails because `full-generation.ts` is missing
- the new orchestration test fails because `fullGeneration()` is still inline

- [ ] **Step 4: Commit the RED orchestration test**

Before committing, run:

```text
gitnexus_detect_changes({ scope: "staged", cwd: "/opt/claude/GitNexus/.worktrees/wiki-page-generation-subagents", repo: "GitNexus" })
```

Expected:
- only `wiki-full-generation.test.ts` and `wiki-generator-orchestration.test.ts` are in scope
- risk remains `low`

```bash
git add gitnexus/test/unit/wiki-full-generation.test.ts gitnexus/test/unit/wiki-generator-orchestration.test.ts
git commit -m "test: cover wiki full generation orchestration"
```

## Task 3: Extract Full Generation Flow

**Files:**
- Create: `gitnexus/src/core/wiki/full-generation.ts`
- Modify: `gitnexus/src/core/wiki/generator.ts`
- Modify: `gitnexus/test/unit/wiki-full-generation.test.ts`
- Modify: `gitnexus/test/unit/wiki-generator-orchestration.test.ts`

- [ ] **Step 1: Run impact analysis before editing**

Use GitNexus MCP:

```text
gitnexus_impact({ target: "fullGeneration", file_path: "gitnexus/src/core/wiki/generator.ts", direction: "upstream", repo: "GitNexus", includeTests: true })
gitnexus_impact({ target: "run", file_path: "gitnexus/src/core/wiki/generator.ts", direction: "upstream", repo: "GitNexus", includeTests: true })
```

At the time this plan was written:

- `fullGeneration` was `CRITICAL`
- `run` was `LOW`

If `gitnexus_impact(...)` returns `HIGH` or `CRITICAL`, explicitly note that before proceeding with edits and keep the rewiring minimal.

- [ ] **Step 2: Implement `full-generation.ts`**

Create `runFullGeneration(options, deps)` as a near-literal move of the current `fullGeneration()` body.

Direct imports should remain:

- `getFilesWithExports`, `getAllFiles` from `./graph-queries.js`
- `buildModuleTree`, `countModules`, `flattenModuleTree` from `./module-tree/builder.js`
- `extractModuleFiles` from `./generator-support.js`
- `shouldIgnorePath` from `../../config/ignore-service.js`

Preserve generation-count ownership on the orchestrator.

- [ ] **Step 3: Rewire `generator.ts` so `fullGeneration()` becomes a thin wrapper**

Import:

```ts
import { runFullGeneration } from './full-generation.js';
```

Then change `fullGeneration(currentCommit)` into a thin wrapper that forwards:

- current commit
- wikiDir
- llmConfig
- maxTokensPerModule
- failedModules
- onProgress
- slugify
- estimateModuleTokens
- streamOpts
- fileExists
- saveModuleTree
- saveWikiMeta
- runParallel
- page helper wrappers

Keep method name and call boundary unchanged so `run()` and incremental fallback still call `this.fullGeneration(...)`.

- [ ] **Step 4: Run focused tests**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-full-generation.test.ts test/unit/wiki-generator-orchestration.test.ts
```

Expected:
- full-generation tests pass
- orchestration wiring test passes

- [ ] **Step 5: Run broader wiki verification**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-full-generation.test.ts test/unit/wiki-generator-orchestration.test.ts test/unit/wiki-incremental-update.test.ts test/unit/wiki-page-generation.test.ts test/unit/wiki-module-tree.test.ts
npm run build
```

Expected:
- all targeted wiki tests pass
- build passes

- [ ] **Step 6: Run GitNexus scope check before commit**

Use GitNexus MCP:

```text
gitnexus_detect_changes({ scope: "all", cwd: "/opt/claude/GitNexus/.worktrees/wiki-page-generation-subagents", repo: "GitNexus" })
```

Expected:
- scope stays concentrated in:
  - `full-generation.ts`
  - `generator.ts`
  - `wiki-full-generation.test.ts`
  - `wiki-generator-orchestration.test.ts`

- [ ] **Step 7: Commit the extraction**

Before committing, run:

```text
gitnexus_detect_changes({ scope: "staged", cwd: "/opt/claude/GitNexus/.worktrees/wiki-page-generation-subagents", repo: "GitNexus" })
```

Expected:
- only intended full-generation files remain in scope

```bash
git add gitnexus/src/core/wiki/full-generation.ts gitnexus/src/core/wiki/generator.ts gitnexus/test/unit/wiki-full-generation.test.ts gitnexus/test/unit/wiki-generator-orchestration.test.ts
git commit -m "refactor: extract wiki full generation flow"
```

## Task 4: Compatibility Verification

**Files:**
- Modify only if compatibility fixes are truly needed:
  - `gitnexus/src/core/wiki/generator.ts`
  - `gitnexus/src/core/wiki/full-generation.ts`
  - `gitnexus/test/unit/wiki-full-generation.test.ts`
  - `gitnexus/test/unit/wiki-generator-orchestration.test.ts`

- [ ] **Step 1: Run compatibility verification**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-full-generation.test.ts test/unit/wiki-generator-orchestration.test.ts test/unit/wiki-incremental-update.test.ts test/unit/wiki-page-generation.test.ts test/unit/wiki-module-tree.test.ts
npm run build
```

Expected:
- all targeted wiki tests pass
- build passes

- [ ] **Step 2: Fix only real compatibility issues**

Allowed fixes:

- import path cleanup
- explicit dependency wiring cleanup
- small type fixes that preserve behavior
- test fixture cleanup for exact branch preservation

Do not widen scope into utility/helper migration.

- [ ] **Step 3: Commit compatibility-only fixes**

Before committing, run:

```text
gitnexus_detect_changes({ scope: "staged", cwd: "/opt/claude/GitNexus/.worktrees/wiki-page-generation-subagents", repo: "GitNexus" })
```

Expected:
- only intended compatibility fixes remain in scope

```bash
git add gitnexus/src/core/wiki/generator.ts gitnexus/src/core/wiki/full-generation.ts gitnexus/test/unit/wiki-full-generation.test.ts gitnexus/test/unit/wiki-generator-orchestration.test.ts
git commit -m "fix: preserve wiki full generation compatibility"
```

## Task 5: Final Verification And Index Refresh

**Files:**
- Modify: `docs/superpowers/specs/2026-03-28-wiki-generator-full-generation-design.md` only if implementation meaningfully differs

- [ ] **Step 1: Run final verification**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-full-generation.test.ts test/unit/wiki-generator-orchestration.test.ts test/unit/wiki-incremental-update.test.ts test/unit/wiki-page-generation.test.ts test/unit/wiki-module-tree.test.ts
npm run build
node dist/cli/index.js status
```

Expected:
- targeted wiki tests pass
- build passes
- local CLI reports the repo cleanly

- [ ] **Step 2: Refresh the local GitNexus index**

Before choosing `analyze` vs `analyze --embeddings`, inspect whether embeddings already exist. If `../.gitnexus/meta.json` reports `stats.embeddings > 0`, preserve them by using `--embeddings`.

Run:

```bash
cd gitnexus
if command -v jq >/dev/null 2>&1 && jq -e '.stats.embeddings > 0' ../.gitnexus/meta.json >/dev/null 2>&1; then
  node dist/cli/index.js analyze --embeddings
elif node -e "const fs=require('fs');const p='../.gitnexus/meta.json';if(fs.existsSync(p)){const m=JSON.parse(fs.readFileSync(p,'utf8'));process.exit((m.stats?.embeddings||0)>0?0:1)}process.exit(1)"; then
  node dist/cli/index.js analyze --embeddings
else
  node dist/cli/index.js analyze
fi
node dist/cli/index.js status
```

Expected:
- `Indexed commit` matches `Current commit`
- repo health is fresh or only dirty for analyze-generated context noise

- [ ] **Step 3: Review final diff concentration**

Run:

```bash
FULL_GENERATION_SLICE_BASE=${FULL_GENERATION_SLICE_BASE:-$(git merge-base HEAD main)}
git diff --stat "$FULL_GENERATION_SLICE_BASE"..HEAD
```

And use GitNexus MCP:

```text
gitnexus_detect_changes({ scope: "compare", base_ref: "<FULL_GENERATION_SLICE_BASE>", cwd: "/opt/claude/GitNexus/.worktrees/wiki-page-generation-subagents", repo: "GitNexus" })
```

Expected:
- changes stay concentrated in full-generation extraction and its tests

- [ ] **Step 4: Commit final doc or verification-driven cleanup**

Before committing, run:

```text
gitnexus_detect_changes({ scope: "staged", cwd: "/opt/claude/GitNexus/.worktrees/wiki-page-generation-subagents", repo: "GitNexus" })
```

Expected:
- only intended doc/final-cleanup files remain in scope

```bash
git add docs/superpowers/specs/2026-03-28-wiki-generator-full-generation-design.md gitnexus/src/core/wiki/generator.ts gitnexus/src/core/wiki/full-generation.ts gitnexus/test/unit/wiki-full-generation.test.ts gitnexus/test/unit/wiki-generator-orchestration.test.ts
git commit -m "chore: finalize wiki full generation extraction"
```
