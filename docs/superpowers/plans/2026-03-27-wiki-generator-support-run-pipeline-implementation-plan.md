# Wiki Generator Support And Run Pipeline Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract `readProjectInfo`, `extractModuleFiles`, and the top-level `run()` orchestration shell out of `gitnexus/src/core/wiki/generator.ts` without changing wiki generation behavior.

**Architecture:** Move pure support helpers into `src/core/wiki/generator-support.ts` and the top-level orchestration shell into `src/core/wiki/run-pipeline.ts`. Keep ownership of `ensureHTMLViewer`, `getCurrentCommit`, `loadWikiMeta`, `saveWikiMeta`, `fullGeneration`, and `runIncrementalUpdate` wiring inside `WikiGenerator`, but make `run()` a thin wrapper that passes explicit dependencies into `runWikiGeneration(...)`.

**Tech Stack:** TypeScript, Vitest, filesystem I/O, git + wiki pipeline orchestration, GitNexus MCP impact/detect-changes

---

## Planned File Structure

All paths below are relative to the `gitnexus/` submodule root unless stated otherwise.

**Create:**
- `gitnexus/src/core/wiki/generator-support.ts`
- `gitnexus/src/core/wiki/run-pipeline.ts`
- `gitnexus/test/unit/wiki-generator-support.test.ts`
- `gitnexus/test/unit/wiki-run-pipeline.test.ts`

**Modify:**
- `gitnexus/src/core/wiki/generator.ts`
- `gitnexus/test/unit/wiki-generator-orchestration.test.ts`

**Intentionally unchanged in this phase:**
- `gitnexus/src/core/wiki/incremental-update.ts`
- `gitnexus/src/core/wiki/pages/leaf-page.ts`
- `gitnexus/src/core/wiki/pages/parent-page.ts`
- `gitnexus/src/core/wiki/pages/overview-page.ts`
- `gitnexus/src/core/wiki/graph-queries.ts`
- `gitnexus/src/cli/wiki.ts`

This is a combined support-helper + run-shell extraction only.

## Proposed APIs

### `generator-support.ts`

```ts
export async function readProjectInfo(repoPath: string): Promise<string> { ... }

export function extractModuleFiles(
  tree: ModuleTreeNode[],
): Record<string, string[]> { ... }
```

### `run-pipeline.ts`

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

Use the repo’s current TS/ESM convention: source files are `.ts`, but intra-repo import specifiers use `.js`.

## Behavioral Contracts To Preserve

### `readProjectInfo(repoPath)`

- preserve the current candidate file order:
  - `package.json`
  - `Cargo.toml`
  - `pyproject.toml`
  - `go.mod`
  - `pom.xml`
  - `build.gradle`
- preserve `package.json` parsing:
  - `name`
  - `description`
  - `scripts`
- preserve `500`-char excerpt behavior for non-package config files
- preserve README lookup order:
  - `README.md`
  - `readme.md`
  - `README.txt`
- preserve `1000`-char README excerpt behavior
- preserve the leading `Project: ${path.basename(repoPath)}` line

### `extractModuleFiles(tree)`

- preserve parent-node flattening behavior
- preserve direct-leaf mapping behavior
- preserve module-name keys exactly

### `runWikiGeneration(options)`

Preserve this exact order:

1. `prepareWikiDir()`
2. `loadWikiMeta()` + `getCurrentCommit()`
3. up-to-date short-circuit
4. `cleanupForceMode()` if force mode is on
5. `initWikiDb(kuzuPath)`
6. run full or incremental generation
7. `closeWikiDb()`
8. `ensureHTMLViewer()`

Preserve these branch semantics:

- up-to-date short-circuit still returns `{ pagesGenerated: 0, mode: 'up-to-date', failedModules: [] }`
- up-to-date short-circuit still calls `ensureHTMLViewer()`
- force mode still performs cleanup before generation:
  - delete `first_module_tree.json`
  - delete all existing `*.md` pages in `wikiDir`, including `overview.md`
- incremental dispatch still happens only when:
  - `existingMeta` exists
  - `forceMode` is off
  - `existingMeta.fromCommit` is truthy
- full generation still runs otherwise
- `closeWikiDb()` must run in a `finally`-equivalent path
- `ensureHTMLViewer()` still runs on all non-up-to-date paths after generation work completes, even if `pagesGenerated` is `0`

## Task 1: Define Support Helper Contract Tests

**Files:**
- Create: `gitnexus/test/unit/wiki-generator-support.test.ts`

- [ ] **Step 1: Write the failing helper test file**

Create focused tests for:

- `readProjectInfo(repoPath)`:
  - package.json extraction (`name`, `description`, `scripts`)
  - fallback config excerpt behavior
  - README excerpt behavior
  - `Project: <basename>` leading line
- `extractModuleFiles(tree)`:
  - parent-node flattening
  - direct-leaf mapping

Mock filesystem reads only. Do not use snapshots.

- [ ] **Step 2: Run the new test file to verify failure**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-generator-support.test.ts
```

Expected:
- failure because `src/core/wiki/generator-support.ts` does not exist yet

- [ ] **Step 3: Keep fixtures narrow**

Use tiny inline config/README strings and small `ModuleTreeNode[]` fixtures.

- [ ] **Step 4: Commit the failing helper contract tests**

Before committing, run the required GitNexus scope check:

```text
gitnexus_detect_changes({ scope: "staged", cwd: "/opt/claude/GitNexus/.worktrees/wiki-page-generation-subagents", repo: "GitNexus" })
```

Expected:
- only `wiki-generator-support.test.ts` is in scope
- risk remains `low`

```bash
git add gitnexus/test/unit/wiki-generator-support.test.ts
git commit -m "test: define wiki generator support contract"
```

## Task 2: Define Run Pipeline RED Tests

**Files:**
- Create: `gitnexus/test/unit/wiki-run-pipeline.test.ts`
- Modify: `gitnexus/test/unit/wiki-generator-orchestration.test.ts`

- [ ] **Step 1: Write the failing run-pipeline unit test file**

Create a dedicated test file that dynamically imports `../../src/core/wiki/run-pipeline.js`.

Cover:

- up-to-date short-circuit path
- force-mode cleanup path
- incremental vs full branch selection
- graph init/close lifecycle
- post-generation `ensureHTMLViewer()` behavior on non-up-to-date paths

All shell side effects must be pure mocks:

- `prepareWikiDir`
- `cleanupForceMode`
- `loadWikiMeta`
- `getCurrentCommit`
- `initWikiDb`
- `closeWikiDb`
- `ensureHTMLViewer`
- `fullGeneration`
- `runIncrementalUpdate`

- [ ] **Step 2: Extend the existing orchestration test with a run-level wiring RED case**

In `gitnexus/test/unit/wiki-generator-orchestration.test.ts`, add one self-contained per-test mock for:

```ts
const runWikiGeneration = vi.fn(async () => ({
  pagesGenerated: 0,
  mode: 'up-to-date' as const,
  failedModules: [],
}));
vi.doMock('../../src/core/wiki/run-pipeline.js', () => ({
  runWikiGeneration,
}));
```

Follow the repo’s existing orchestration-test pattern: register a relative mock for `../../src/core/wiki/run-pipeline.js`, then dynamically import `../../src/core/wiki/generator.js` inside the same test so Vitest resolves both through the same module graph. Do not switch to an absolute module ID here.

Then dynamically import `generator.js` inside that test and assert:

- `WikiGenerator.run()` delegates through `runWikiGeneration(...)`
- key resolved dependencies are forwarded

Do not weaken or replace the existing orchestration tests in that file.

- [ ] **Step 3: Run RED tests**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-run-pipeline.test.ts test/unit/wiki-generator-orchestration.test.ts
```

Expected:
- `wiki-run-pipeline.test.ts` fails because `run-pipeline.ts` does not exist yet
- the new orchestration wiring test fails because `run()` is still inline

- [ ] **Step 4: Commit the RED tests**

Before committing, run the required GitNexus scope check:

```text
gitnexus_detect_changes({ scope: "staged", cwd: "/opt/claude/GitNexus/.worktrees/wiki-page-generation-subagents", repo: "GitNexus" })
```

Expected:
- only `wiki-run-pipeline.test.ts` and `wiki-generator-orchestration.test.ts` are in scope
- risk remains `low`

```bash
git add gitnexus/test/unit/wiki-run-pipeline.test.ts gitnexus/test/unit/wiki-generator-orchestration.test.ts
git commit -m "test: cover wiki support and run pipeline"
```

## Task 3: Extract Support Helpers

**Files:**
- Create: `gitnexus/src/core/wiki/generator-support.ts`
- Modify: `gitnexus/src/core/wiki/generator.ts`
- Modify: `gitnexus/test/unit/wiki-generator-support.test.ts`

- [ ] **Step 1: Run impact analysis before editing symbols**

Use GitNexus MCP:

```text
gitnexus_impact({ target: "readProjectInfo", file_path: "gitnexus/src/core/wiki/generator.ts", direction: "upstream", repo: "GitNexus", includeTests: true })
gitnexus_impact({ target: "extractModuleFiles", file_path: "gitnexus/src/core/wiki/generator.ts", direction: "upstream", repo: "GitNexus", includeTests: true })
```

Record the actual output in notes. At the time this plan was written, both helper symbols were effectively high-blast-radius because they sit under overview/full/incremental flows.

If either `gitnexus_impact(...)` result is `HIGH` or `CRITICAL`, stop and explicitly note that before proceeding with edits. Do not continue silently past a high-risk blast radius.

- [ ] **Step 2: Implement `generator-support.ts`**

Move `readProjectInfo` and `extractModuleFiles` into the new module as top-level exports.

Preserve:

- file order
- excerpt lengths
- output formatting
- parent/leaf flattening behavior

- [ ] **Step 3: Rewire `generator.ts` to import the new support helpers**

Replace internal helper usage with imports from `./generator-support.js`.

Do not move any other helper ownership in this task.

- [ ] **Step 4: Run focused helper tests**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-generator-support.test.ts test/unit/wiki-page-generation.test.ts test/unit/wiki-incremental-update.test.ts
```

Expected:
- support helper tests pass
- existing overview/incremental tests still pass

- [ ] **Step 5: Run build verification**

Run:

```bash
cd gitnexus
npm run build
```

Expected:
- build passes

- [ ] **Step 6: Commit support extraction**

Before committing, run the required GitNexus scope check:

```text
gitnexus_detect_changes({ scope: "staged", cwd: "/opt/claude/GitNexus/.worktrees/wiki-page-generation-subagents", repo: "GitNexus" })
```

Expected:
- scope stays inside `generator-support.ts`, `generator.ts`, and `wiki-generator-support.test.ts`

```bash
git add gitnexus/src/core/wiki/generator-support.ts gitnexus/src/core/wiki/generator.ts gitnexus/test/unit/wiki-generator-support.test.ts
git commit -m "refactor: extract wiki generator support helpers"
```

## Task 4: Extract Run Pipeline Shell

**Files:**
- Create: `gitnexus/src/core/wiki/run-pipeline.ts`
- Modify: `gitnexus/src/core/wiki/generator.ts`
- Modify: `gitnexus/test/unit/wiki-run-pipeline.test.ts`
- Modify: `gitnexus/test/unit/wiki-generator-orchestration.test.ts`

- [ ] **Step 1: Run impact analysis before editing `run()`**

Use GitNexus MCP:

```text
gitnexus_impact({ target: "run", file_path: "gitnexus/src/core/wiki/generator.ts", direction: "upstream", repo: "GitNexus", includeTests: true })
```

Record the actual output in notes. At the time this plan was written, `run` had low upstream blast radius but remains globally important because it is the shell entry point.

If `gitnexus_impact(...)` returns `HIGH` or `CRITICAL`, stop and explicitly note that before proceeding with edits. Do not continue silently past a high-risk blast radius.

- [ ] **Step 2: Implement `run-pipeline.ts`**

Create `runWikiGeneration(options)` as a near-literal move of the current `run()` shell.

Import types explicitly from the same places used today, using type-only imports to avoid runtime cycles:

- `import type { WikiMeta, ProgressCallback } from './generator.js'`
- `ModuleTreeNode` from `./module-tree/types.js` when needed

Keep the pipeline pure via injected dependencies:

- `prepareWikiDir`
- `cleanupForceMode`
- `loadWikiMeta`
- `getCurrentCommit`
- `initWikiDb`
- `closeWikiDb`
- `ensureHTMLViewer`
- `fullGeneration`
- `runIncrementalUpdate`

Do not move `ensureHTMLViewer`, `loadWikiMeta`, or `getCurrentCommit` ownership.

- [ ] **Step 3: Rewire `generator.ts` so `run()` becomes a thin wrapper**

Import:

```ts
import { runWikiGeneration } from './run-pipeline.js';
```

Then implement `run()` as a thin wrapper that forwards:

- current class state
- bound shell helpers
- bound generation callbacks

Preserve the existing return type exactly.

Normalize force mode explicitly in the wrapper:

```ts
forceMode: !!this.options.force
```

Do not pass `this.options.force` through as `boolean | undefined`.

- [ ] **Step 4: Run focused shell tests**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-run-pipeline.test.ts test/unit/wiki-generator-orchestration.test.ts
```

Expected:
- run-pipeline tests pass
- orchestration wiring test passes

- [ ] **Step 5: Run broader wiki verification**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-generator-support.test.ts test/unit/wiki-run-pipeline.test.ts test/unit/wiki-generator-orchestration.test.ts test/unit/wiki-incremental-update.test.ts test/unit/wiki-page-generation.test.ts test/unit/wiki-module-tree.test.ts
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
  - `generator-support.ts`
  - `run-pipeline.ts`
  - `generator.ts`
  - `wiki-generator-support.test.ts`
  - `wiki-run-pipeline.test.ts`
  - `wiki-generator-orchestration.test.ts`

- [ ] **Step 7: Commit shell extraction**

Before committing, run the required GitNexus scope check:

```text
gitnexus_detect_changes({ scope: "staged", cwd: "/opt/claude/GitNexus/.worktrees/wiki-page-generation-subagents", repo: "GitNexus" })
```

Expected:
- scope stays concentrated in:
  - `generator-support.ts`
  - `run-pipeline.ts`
  - `generator.ts`
  - `wiki-generator-support.test.ts`
  - `wiki-run-pipeline.test.ts`
  - `wiki-generator-orchestration.test.ts`

```bash
git add gitnexus/src/core/wiki/generator-support.ts gitnexus/src/core/wiki/run-pipeline.ts gitnexus/src/core/wiki/generator.ts gitnexus/test/unit/wiki-generator-support.test.ts gitnexus/test/unit/wiki-run-pipeline.test.ts gitnexus/test/unit/wiki-generator-orchestration.test.ts
git commit -m "refactor: extract wiki support and run pipeline"
```

## Task 5: Compatibility Verification And Finalization

**Files:**
- Modify only if compatibility fixes are truly needed:
  - `gitnexus/src/core/wiki/generator.ts`
  - `gitnexus/src/core/wiki/generator-support.ts`
  - `gitnexus/src/core/wiki/run-pipeline.ts`
  - affected test files
- Modify: `docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design.md` only if implementation meaningfully differs

- [ ] **Step 1: Run final verification**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-generator-support.test.ts test/unit/wiki-run-pipeline.test.ts test/unit/wiki-generator-orchestration.test.ts test/unit/wiki-incremental-update.test.ts test/unit/wiki-page-generation.test.ts test/unit/wiki-module-tree.test.ts
npm run build
node dist/cli/index.js status
```

Expected:
- all targeted wiki tests pass
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
SUPPORT_RUN_SLICE_BASE=${SUPPORT_RUN_SLICE_BASE:-$(git merge-base HEAD main)}
git diff --stat "$SUPPORT_RUN_SLICE_BASE"..HEAD
```

And use GitNexus MCP:

```text
gitnexus_detect_changes({ scope: "compare", base_ref: "<SUPPORT_RUN_SLICE_BASE>", cwd: "/opt/claude/GitNexus/.worktrees/wiki-page-generation-subagents", repo: "GitNexus" })
```

Expected:
- changes stay concentrated in support/run-shell extraction and its tests

- [ ] **Step 4: Commit final doc or verification-driven cleanup**

Before committing, run the required GitNexus scope check:

```text
gitnexus_detect_changes({ scope: "staged", cwd: "/opt/claude/GitNexus/.worktrees/wiki-page-generation-subagents", repo: "GitNexus" })
```

Expected:
- only intended doc/final-cleanup files remain in scope

```bash
git add docs/superpowers/specs/2026-03-27-wiki-generator-support-run-pipeline-design.md gitnexus/src/core/wiki/generator.ts gitnexus/src/core/wiki/generator-support.ts gitnexus/src/core/wiki/run-pipeline.ts gitnexus/test/unit/wiki-generator-support.test.ts gitnexus/test/unit/wiki-run-pipeline.test.ts gitnexus/test/unit/wiki-generator-orchestration.test.ts
git commit -m "chore: finalize wiki support and run pipeline extraction"
```
