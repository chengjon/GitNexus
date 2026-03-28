# Wiki Generator Overview Page Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract `generateOverview` out of `gitnexus/src/core/wiki/generator.ts` into a dedicated overview-page module without changing wiki output behavior.

**Architecture:** Move overview generation into `src/core/wiki/pages/overview-page.ts`, keeping `WikiGenerator` responsible for orchestration, incremental-update decisions, metadata persistence, and helper methods such as `readProjectInfo` / `extractModuleFiles`. Pass generator-owned dependencies explicitly rather than moving the whole class or widening the slice into incremental-update refactors.

**Tech Stack:** TypeScript, Vitest, filesystem I/O, LLM prompt orchestration, wiki graph queries

---

## Planned File Structure

**Create:**
- `gitnexus/src/core/wiki/pages/overview-page.ts`

**Modify:**
- `gitnexus/src/core/wiki/generator.ts`
- `gitnexus/test/unit/wiki-page-generation.test.ts`
- `gitnexus/test/unit/wiki-generator-orchestration.test.ts`

**Intentionally unchanged in this phase:**
- `gitnexus/src/core/wiki/graph-queries.ts`
- `gitnexus/src/core/wiki/prompts.ts`
- `gitnexus/src/core/wiki/html-viewer.ts`
- `gitnexus/src/core/wiki/module-tree/`
- `gitnexus/src/cli/wiki.ts`

This is an overview-generation extraction only.

## Proposed Helper API

The extracted helper should write `overview.md` itself and return `Promise<void>`.

Suggested shape:

```ts
export interface GenerateOverviewPageOptions {
  moduleTree: ModuleTreeNode[];
  wikiDir: string;
  repoPath: string;
  llmConfig: LLMConfig;
  streamOpts: (label: string, fixedPercent?: number) => CallLLMOptions;
  readProjectInfo: () => Promise<string>;
  extractModuleFiles: (tree: ModuleTreeNode[]) => Record<string, string[]>;
}

export async function generateOverviewPage(
  options: GenerateOverviewPageOptions,
): Promise<void> { ... }
```

## Behavioral Contracts To Preserve

- Module summary trimming must stay exactly:
  - use content up to the first `### Architecture` if present
  - otherwise use `content.slice(0, 600).trim()`
  - do not append ellipses or other markers
- Missing module page fallback remains `(Documentation pending)`
- Empty inter-module edge fallback remains `No inter-module call edges detected`
- Overview output path remains `overview.md`
- Overview title remains `# ${path.basename(repoPath)} — Wiki`
- Top processes remain `getAllProcesses(5)`
- `fullGeneration` and `incrementalUpdate` keep their current overview call timing
- Tests should use targeted string assertions, not snapshots

### Task 1: Define Overview Contract Tests

**Files:**
- Modify: `gitnexus/test/unit/wiki-page-generation.test.ts`

- [ ] **Step 1: Add the failing overview contract test**

Extend the existing page-generation contract file with a focused overview test that dynamically imports `../../src/core/wiki/pages/overview-page.js`.

Cover:

- `MODULE_SUMMARIES` assembly from module pages
- `### Architecture` trim boundary
- `content.slice(0, 600).trim()` fallback when no architecture heading exists
- `(Documentation pending)` fallback for unreadable pages
- `No inter-module call edges detected` fallback when no module edges exist
- `overview.md` output path and repository-title prefix

Update existing mocks in the same file so they also support:

- `getAllProcesses`
- `getInterModuleEdgesForOverview`
- `OVERVIEW_SYSTEM_PROMPT`
- `OVERVIEW_USER_PROMPT`

Keep assertions targeted and string-based.

- [ ] **Step 2: Run the contract file to verify failure**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-page-generation.test.ts
```

Expected:
- failure because `src/core/wiki/pages/overview-page.ts` does not exist yet

- [ ] **Step 3: Keep fixtures narrow**

Use tiny inline strings and a small fake `ModuleTreeNode[]` tree. Avoid snapshots and avoid real graph/model behavior.

- [ ] **Step 4: Commit the failing contract coverage**

```bash
git add gitnexus/test/unit/wiki-page-generation.test.ts
git commit -m "test: define wiki overview page contract"
```

### Task 2: Add Failing Overview Orchestration Tests

**Files:**
- Modify: `gitnexus/test/unit/wiki-generator-orchestration.test.ts`

- [ ] **Step 1: Extend orchestration mocks for overview dispatch**

Add a virtual mock for `../../src/core/wiki/pages/overview-page.js` so the test does not require the real file to exist yet.

Use the same mocking pattern already used in this file, but make the overview helper mock virtual:

```ts
generateOverviewPage: vi.fn(async () => undefined)
```

Example shape:

```ts
vi.mock('../../src/core/wiki/pages/overview-page.js', () => ({
  generateOverviewPage: mocks.generateOverviewPage,
}), { virtual: true });
```

Then add two tests that expect the mocked helper to be called:

- full generation dispatches overview work through `generateOverviewPage`
- incremental update dispatches overview work through `generateOverviewPage` when at least one module page was regenerated
- incremental update does **not** dispatch overview work when no module page was regenerated and `pagesGenerated` stays `0`

Keep these tests wiring-focused. Do not re-test detailed prompt assembly here.

- [ ] **Step 2: Run the orchestration test file to verify failure**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-generator-orchestration.test.ts
```

Expected:
- failure because `generator.ts` still uses the inline `generateOverview` method instead of the mocked helper

- [ ] **Step 3: Commit the failing orchestration coverage**

```bash
git add gitnexus/test/unit/wiki-generator-orchestration.test.ts
git commit -m "test: cover wiki overview orchestration"
```

### Task 3: Extract Overview Page Generation

**Files:**
- Create: `gitnexus/src/core/wiki/pages/overview-page.ts`
- Modify: `gitnexus/src/core/wiki/generator.ts`
- Modify: `gitnexus/test/unit/wiki-page-generation.test.ts`
- Modify: `gitnexus/test/unit/wiki-generator-orchestration.test.ts`

- [ ] **Step 1: Run impact analysis before editing symbols**

Use GitNexus MCP:

```text
gitnexus_impact({ target: "generateOverview", direction: "upstream", repo: "GitNexus", includeTests: true })
```

Record the actual tool output in your working notes.

At the time this plan was written, the likely result was:

- direct callers: `fullGeneration` and `incrementalUpdate`
- upstream risk: `CRITICAL`

If you end up editing those call sites, also inspect:

```text
gitnexus_impact({ target: "fullGeneration", direction: "upstream", repo: "GitNexus", includeTests: true })
gitnexus_impact({ target: "incrementalUpdate", direction: "upstream", repo: "GitNexus", includeTests: true })
```

Proceed based on the actual tool output. If any symbol comes back `HIGH` or `CRITICAL`, explicitly note that before editing and keep the rewiring narrow.

- [ ] **Step 2: Implement `overview-page.ts`**

Create `generateOverviewPage(options)` with explicit dependencies:

- `moduleTree`
- `wikiDir`
- `repoPath`
- `llmConfig`
- `streamOpts`
- `readProjectInfo`
- `extractModuleFiles`

Within the module, preserve current direct imports and behavior for:

- `getInterModuleEdgesForOverview`
- `getAllProcesses`
- `callLLM`
- `fillTemplate`
- `formatProcesses`
- `OVERVIEW_SYSTEM_PROMPT`
- `OVERVIEW_USER_PROMPT`

Keep the trim/fallback semantics exactly as documented above.

- [ ] **Step 3: Rewire `generator.ts` to call the extracted helper**

Replace the inline `generateOverview` method body with a call site in both:

- `fullGeneration`
- `incrementalUpdate`

Use the repo's existing TS import style with `.js` specifiers, for example:

```ts
import { generateOverviewPage } from './pages/overview-page.js';
```

Pass:

- `moduleTree`
- `wikiDir`
- `repoPath`
- `llmConfig`
- `streamOpts: (label, fixedPercent) => this.streamOpts(label, fixedPercent)`
- `readProjectInfo: () => this.readProjectInfo()`
- `extractModuleFiles: (tree) => this.extractModuleFiles(tree)`

Then remove the inline `generateOverview` method itself.

Do not extract `readProjectInfo`, `extractModuleFiles`, or any incremental-update internals in this task.

- [ ] **Step 4: Run focused tests**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-page-generation.test.ts test/unit/wiki-generator-orchestration.test.ts
```

Expected:
- overview contract tests pass
- overview orchestration tests pass
- existing leaf/parent coverage stays green

- [ ] **Step 5: Run build verification**

Run:

```bash
cd gitnexus
npm run build
```

Expected:
- no import/type regressions

- [ ] **Step 6: Run scope verification before commit**

Use GitNexus MCP:

```text
gitnexus_detect_changes({ scope: "all", cwd: "/opt/claude/GitNexus/.worktrees/wiki-page-generation-subagents", repo: "GitNexus" })
```

Expected:
- only the four overview-slice files are present
- no unrelated execution flows are newly affected beyond the known `fullGeneration` / `incrementalUpdate` overview call sites

- [ ] **Step 7: Commit overview extraction**

```bash
git add gitnexus/src/core/wiki/pages/overview-page.ts gitnexus/src/core/wiki/generator.ts gitnexus/test/unit/wiki-page-generation.test.ts gitnexus/test/unit/wiki-generator-orchestration.test.ts
git commit -m "refactor: extract wiki overview page generation"
```

### Task 4: Verify Generator Compatibility

**Files:**
- Modify only if compatibility fixes are truly needed:
  - `gitnexus/src/core/wiki/generator.ts`
  - `gitnexus/test/unit/wiki-generator-orchestration.test.ts`
  - `gitnexus/test/unit/wiki-page-generation.test.ts`

- [ ] **Step 1: Run targeted verification**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-generator-orchestration.test.ts test/unit/wiki-page-generation.test.ts test/unit/wiki-module-tree.test.ts
npm run build
```

Expected:
- all targeted wiki tests pass
- build passes

- [ ] **Step 2: Fix only real compatibility issues**

Allowed fixes:

- import path cleanup
- dependency wiring cleanup
- small type fixes that preserve behavior
- test fixture cleanup needed to preserve existing behavior assertions

Do not widen scope into `incrementalUpdate` redesign or helper migration.

- [ ] **Step 3: Run staged scope check before commit**

Use GitNexus MCP:

```text
gitnexus_detect_changes({ scope: "all", cwd: "/opt/claude/GitNexus/.worktrees/wiki-page-generation-subagents", repo: "GitNexus" })
```

Confirm the diff still stays inside the overview extraction slice.

- [ ] **Step 4: Commit compatibility-only fixes**

```bash
git add gitnexus/src/core/wiki/generator.ts gitnexus/test/unit/wiki-generator-orchestration.test.ts gitnexus/test/unit/wiki-page-generation.test.ts
git commit -m "fix: preserve wiki overview generation compatibility"
```

### Task 5: Final Verification and Index Refresh

**Files:**
- Modify: `docs/superpowers/specs/2026-03-27-wiki-generator-overview-page-design.md` only if implementation meaningfully differs

- [ ] **Step 1: Run final verification**

Run:

```bash
cd gitnexus
npx vitest run test/unit/wiki-generator-orchestration.test.ts test/unit/wiki-page-generation.test.ts test/unit/wiki-module-tree.test.ts
npm run build
node dist/cli/index.js status
```

Expected:
- focused overview tests pass
- existing wiki tests still pass
- build passes
- local CLI still reports the repo as healthy

- [ ] **Step 2: Refresh the local GitNexus index after code changes**

Run from the worktree build output:

```bash
cd gitnexus
node dist/cli/index.js analyze
node dist/cli/index.js status
```

Expected:
- analyze completes without stale-code mismatch
- `Indexed commit` matches `Current commit`
- `Health: fresh`

- [ ] **Step 3: Review final diff concentration**

Run:

```bash
OVERVIEW_SLICE_BASE=${OVERVIEW_SLICE_BASE:-$(git merge-base HEAD main)}
git diff --stat "$OVERVIEW_SLICE_BASE"..HEAD
```

And use GitNexus MCP:

```text
gitnexus_detect_changes({ scope: "compare", base_ref: "<OVERVIEW_SLICE_BASE>", cwd: "/opt/claude/GitNexus/.worktrees/wiki-page-generation-subagents", repo: "GitNexus" })
```

Expected:
- changes remain concentrated in overview extraction and its tests

- [ ] **Step 4: Sync the spec only if needed**

If implementation meaningfully differs from the design, update:

- `docs/superpowers/specs/2026-03-27-wiki-generator-overview-page-design.md`

Otherwise leave the spec untouched.

- [ ] **Step 5: Commit any final doc or verification-driven cleanup**

```bash
git add docs/superpowers/specs/2026-03-27-wiki-generator-overview-page-design.md gitnexus/src/core/wiki/generator.ts gitnexus/test/unit/wiki-generator-orchestration.test.ts gitnexus/test/unit/wiki-page-generation.test.ts
git commit -m "chore: finalize wiki overview page extraction"
```
