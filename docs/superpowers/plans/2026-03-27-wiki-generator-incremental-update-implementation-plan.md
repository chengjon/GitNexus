# Wiki Generator Incremental Update Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract `incrementalUpdate` out of `gitnexus/src/core/wiki/generator.ts` into a dedicated incremental-update module without changing wiki update behavior.

**Architecture:** Move incremental-update flow logic into `src/core/wiki/incremental-update.ts`, but keep helper ownership on `WikiGenerator`. `run()` continues to branch exactly as it does today; the extracted helper receives explicit dependencies for git diff detection, module lookup, page helper calls, overview updates, metadata save, and progress reporting.

**Tech Stack:** TypeScript, Vitest, filesystem I/O, git diff helpers, wiki page generators, GitNexus MCP impact/detect-changes

---

## Planned File Structure

**Create:**
- `gitnexus/src/core/wiki/incremental-update.ts`
- `gitnexus/test/unit/wiki-incremental-update.test.ts`

**Modify:**
- `gitnexus/src/core/wiki/generator.ts`
- `gitnexus/test/unit/wiki-generator-orchestration.test.ts`

**Intentionally unchanged in this phase:**
- `gitnexus/src/core/wiki/pages/leaf-page.ts`
- `gitnexus/src/core/wiki/pages/parent-page.ts`
- `gitnexus/src/core/wiki/pages/overview-page.ts`
- `gitnexus/src/core/wiki/graph-queries.ts`
- `gitnexus/src/cli/wiki.ts`

This is an incremental-update extraction only.

## Proposed Helper API

The extracted helper should always return incremental mode.

Suggested shape:

```ts
export interface RunIncrementalUpdateOptions {
  existingMeta: WikiMeta;
  currentCommit: string;
  wikiDir: string;
  repoPath: string;
  llmConfig: LLMConfig;
  maxTokensPerModule: number;
  failedModules: string[];
  onProgress: ProgressCallback;
  streamOpts: (label: string, fixedPercent?: number) => CallLLMOptions;
  getChangedFiles: (fromCommit: string, toCommit: string) => string[];
  slugify: (name: string) => string;
  findNodeBySlug: (tree: ModuleTreeNode[], slug: string) => ModuleTreeNode | null;
  saveWikiMeta: (meta: WikiMeta) => Promise<void>;
  deleteSnapshot: () => Promise<void>;
  fullGeneration: (currentCommit: string) => Promise<{ pagesGenerated: number; mode: 'full'; failedModules: string[] }>;
  runParallel: <T>(items: T[], fn: (item: T) => Promise<number>) => Promise<number>;
  readSourceFiles: (filePaths: string[]) => Promise<string>;
  truncateSource: (source: string, maxTokens: number) => string;
}

export interface IncrementalUpdateDeps {
  generateLeafPage: (node: ModuleTreeNode) => Promise<void>;
  generateParentPage: (node: ModuleTreeNode) => Promise<void>;
  generateOverviewPage: (moduleTree: ModuleTreeNode[]) => Promise<void>;
}

export async function runIncrementalUpdate(
  options: RunIncrementalUpdateOptions,
  deps: IncrementalUpdateDeps,
): Promise<{ pagesGenerated: number; mode: 'incremental'; failedModules: string[] }> { ... }
```

## Behavioral Contracts To Preserve

- `changedFiles.length === 0`:
  - update metadata only
  - return `{ pagesGenerated: 0, mode: 'incremental', failedModules: [] }`
- `newFiles.length > 5`:
  - emit incremental progress `15`
  - delete `first_module_tree.json` before fallback
  - call `fullGeneration(currentCommit)`
  - return the same `pagesGenerated` / `failedModules`, but normalize `mode` to `'incremental'`
- New files still go under `Other`
- Only nodes found by `findNodeBySlug(...)` enter regeneration
- Parent nodes still use `generateParentPage`
- Leaf nodes still use `generateLeafPage`
- Overview regeneration happens only when `pagesGenerated > 0`
- Final metadata save still writes updated `fromCommit`, `generatedAt`, and `model`
- Progress phases remain:
  - `5` detect changes
  - `10` changed-file count
  - `15` full-generation fallback messaging
  - `20` module-regeneration start
  - regeneration progress `20..80`
  - overview `85`
  - metadata save `95`
  - done `100`

### Task 1: Define Focused Incremental Update Contract Tests

**Files:**
- Create: `gitnexus/test/unit/wiki-incremental-update.test.ts`

- [ ] **Step 1: Write the failing test file**

Create a dedicated unit test file that dynamically imports `../../src/core/wiki/incremental-update.js`.

Cover these branches with narrow inline fixtures and mocked dependencies:

- no changed files → metadata-only update, `pagesGenerated: 0`
- many new files → fallback to `fullGeneration`, normalized to incremental mode
- many new files → deletes `first_module_tree.json` before fallback
- affected parent/leaf nodes regenerate through injected helpers
- overview helper runs only when pages were regenerated
- no overview helper when changed files exist but no module nodes are regenerated

Do not use real git commands, real filesystem writes, or real page helper behavior.

- [ ] **Step 2: Run the new test file to verify failure**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-incremental-update.test.ts
```

Expected:
- failure because `src/core/wiki/incremental-update.ts` does not exist yet

- [ ] **Step 3: Keep fixtures narrow**

Use small fake `WikiMeta`, small `ModuleTreeNode` arrays, and `vi.fn()` dependencies only.

- [ ] **Step 4: Commit the contract tests**

```bash
git add gitnexus/test/unit/wiki-incremental-update.test.ts
git commit -m "test: define wiki incremental update contract"
```

### Task 2: Add Failing Incremental Update Orchestration Tests

**Files:**
- Modify: `gitnexus/test/unit/wiki-generator-orchestration.test.ts`

- [ ] **Step 1: Add a per-test mock for the new helper**

Do **not** add a file-scope `vi.mock('../../src/core/wiki/incremental-update.js', ...)`, because that would replace the incremental-update implementation for every test in the file and break the existing real-behavior orchestration assertions.

Instead, confine the wiring-only mock to the new dispatch test itself using:

- `vi.resetModules()`
- a local `const runIncrementalUpdate = vi.fn(...)`
- `vi.doMock('../../src/core/wiki/incremental-update.js', () => ({ runIncrementalUpdate }), { virtual: true })`
- dynamic import of `../../src/core/wiki/generator.js` after the mock is registered

```ts
vi.resetModules();
const runIncrementalUpdate = vi.fn(async () => ({
  pagesGenerated: 0,
  mode: 'incremental' as const,
  failedModules: [],
}));
vi.doMock('../../src/core/wiki/incremental-update.js', () => ({
  runIncrementalUpdate,
}), { virtual: true });
const { WikiGenerator } = await import('../../src/core/wiki/generator.js');
```

- [ ] **Step 2: Add a run-level wiring test**

Add a wiring-level test proving:

- when metadata exists
- current commit differs
- force mode is off

then `run()` dispatches through `runIncrementalUpdate(...)`.

Assert helper payload shape, not only call count.

This new test should be self-contained and must not weaken the existing orchestration tests that still exercise real incremental behavior.

- [ ] **Step 3: Run the orchestration file to verify failure**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-generator-orchestration.test.ts
```

Expected:
- failure because `run()` still calls the inline `incrementalUpdate` method instead of the mocked helper

- [ ] **Step 4: Commit the orchestration RED test**

```bash
git add gitnexus/test/unit/wiki-generator-orchestration.test.ts
git commit -m "test: cover wiki incremental update orchestration"
```

### Task 3: Extract Incremental Update Flow

**Files:**
- Create: `gitnexus/src/core/wiki/incremental-update.ts`
- Modify: `gitnexus/src/core/wiki/generator.ts`
- Modify: `gitnexus/test/unit/wiki-incremental-update.test.ts`
- Modify: `gitnexus/test/unit/wiki-generator-orchestration.test.ts`

- [ ] **Step 1: Run impact analysis before editing symbols**

Use GitNexus MCP:

```text
gitnexus_impact({ target: "incrementalUpdate", direction: "upstream", repo: "GitNexus", includeTests: true })
gitnexus_impact({ target: "run", direction: "upstream", repo: "GitNexus", includeTests: true })
```

Record the actual output in notes. At the time this plan was written, `incrementalUpdate` was `LOW` risk with direct caller `run`.

- [ ] **Step 2: Implement `incremental-update.ts`**

Create `runIncrementalUpdate(options, deps)` as a standalone exported function.

Preserve all current branch behavior, including:

- metadata-only early return
- `newFiles.length > 5` full-generation fallback
- deleting `first_module_tree.json` before that fallback
- `Other` handling
- page deletion before regeneration
- overview gating on `pagesGenerated > 0`
- final metadata save and return shape

- [ ] **Step 3: Rewire `generator.ts`**

Import:

```ts
import { runIncrementalUpdate } from './incremental-update.js';
```

Then replace the inline `incrementalUpdate` body with the extracted helper call at the existing `run()` branch only.

Pass explicit helpers from the class:

- `getChangedFiles`
- `slugify`
- `findNodeBySlug`
- `saveWikiMeta`
- `deleteSnapshot`
- `fullGeneration`
- `runParallel`
- `readSourceFiles`
- `truncateSource`

and page helpers:

- `generateLeafPage`
- `generateParentPage`
- `generateOverviewPage`

Do not pass unbound instance methods if they rely on `this`. Use wrappers or `.bind(this)` style preservation. For example:

```ts
deleteSnapshot: async () => {
  try {
    await fs.unlink(path.join(this.wikiDir, 'first_module_tree.json'));
  } catch {}
}
```

and:

```ts
generateOverviewPage: async (moduleTree) => {
  await generateOverviewPage({
    moduleTree,
    wikiDir: this.wikiDir,
    repoPath: this.repoPath,
    llmConfig: this.llmConfig,
    streamOpts: (label, fixedPercent) => this.streamOpts(label, fixedPercent),
    readProjectInfo: () => this.readProjectInfo(),
    extractModuleFiles: (tree) => this.extractModuleFiles(tree),
  });
}
```

Do not move helper ownership in this task.

- [ ] **Step 4: Run focused tests**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-incremental-update.test.ts test/unit/wiki-generator-orchestration.test.ts
```

Expected:
- incremental-update tests pass
- orchestration test passes

- [ ] **Step 5: Run broader wiki verification**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-incremental-update.test.ts test/unit/wiki-generator-orchestration.test.ts test/unit/wiki-page-generation.test.ts test/unit/wiki-module-tree.test.ts
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
  - `incremental-update.ts`
  - `generator.ts`
  - `wiki-incremental-update.test.ts`
  - `wiki-generator-orchestration.test.ts`

- [ ] **Step 7: Commit the extraction**

```bash
git add gitnexus/src/core/wiki/incremental-update.ts gitnexus/src/core/wiki/generator.ts gitnexus/test/unit/wiki-incremental-update.test.ts gitnexus/test/unit/wiki-generator-orchestration.test.ts
git commit -m "refactor: extract wiki incremental update flow"
```

### Task 4: Verify Generator Compatibility

**Files:**
- Modify only if compatibility fixes are truly needed:
  - `gitnexus/src/core/wiki/generator.ts`
  - `gitnexus/src/core/wiki/incremental-update.ts`
  - `gitnexus/test/unit/wiki-incremental-update.test.ts`
  - `gitnexus/test/unit/wiki-generator-orchestration.test.ts`

- [ ] **Step 1: Run compatibility verification**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-incremental-update.test.ts test/unit/wiki-generator-orchestration.test.ts test/unit/wiki-page-generation.test.ts test/unit/wiki-module-tree.test.ts
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

Do not widen scope into helper migration.

- [ ] **Step 3: Commit compatibility-only fixes**

```bash
git add gitnexus/src/core/wiki/generator.ts gitnexus/src/core/wiki/incremental-update.ts gitnexus/test/unit/wiki-incremental-update.test.ts gitnexus/test/unit/wiki-generator-orchestration.test.ts
git commit -m "fix: preserve wiki incremental update compatibility"
```

### Task 5: Final Verification and Index Refresh

**Files:**
- Modify: `docs/superpowers/specs/2026-03-27-wiki-generator-incremental-update-design.md` only if implementation meaningfully differs

- [ ] **Step 1: Run final verification**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-incremental-update.test.ts test/unit/wiki-generator-orchestration.test.ts test/unit/wiki-page-generation.test.ts test/unit/wiki-module-tree.test.ts
npm run build
node dist/cli/index.js status
```

Expected:
- targeted wiki tests pass
- build passes
- local CLI reports the repo and current commit cleanly

- [ ] **Step 2: Refresh the local GitNexus index**

Run:

```bash
cd gitnexus
node dist/cli/index.js analyze
node dist/cli/index.js status
```

Expected:
- index refresh succeeds
- `Indexed commit` matches `Current commit`
- repo health is fresh or only dirty for intentional generated-context updates

- [ ] **Step 3: Review final diff concentration**

Run:

```bash
INCREMENTAL_SLICE_BASE=${INCREMENTAL_SLICE_BASE:-$(git merge-base HEAD main)}
git diff --stat "$INCREMENTAL_SLICE_BASE"..HEAD
```

And use GitNexus MCP:

```text
gitnexus_detect_changes({ scope: "compare", base_ref: "<INCREMENTAL_SLICE_BASE>", cwd: "/opt/claude/GitNexus/.worktrees/wiki-page-generation-subagents", repo: "GitNexus" })
```

Expected:
- changes remain concentrated in the incremental-update slice and its tests

- [ ] **Step 4: Sync the spec only if needed**

If implementation meaningfully differs from the design, update:

- `docs/superpowers/specs/2026-03-27-wiki-generator-incremental-update-design.md`

Otherwise leave the spec untouched.

- [ ] **Step 5: Commit final doc or verification-driven cleanup**

```bash
git add docs/superpowers/specs/2026-03-27-wiki-generator-incremental-update-design.md gitnexus/src/core/wiki/generator.ts gitnexus/src/core/wiki/incremental-update.ts gitnexus/test/unit/wiki-incremental-update.test.ts gitnexus/test/unit/wiki-generator-orchestration.test.ts
git commit -m "chore: finalize wiki incremental update extraction"
```
