# GitNexus P0/P1/P2 Improvements — Review Summary

**Commit:** `4ad039c6` (implementation), `097130b9` (test/task follow-up), current working tree (test-evidence strengthening)
**Date:** 2026-06-04
**Author:** JohnC + Claude
**Scope:** CLI, MCP server, ingestion pipeline, shared graph types
**Status:** Implementation and focused test-evidence strengthening complete — focused tests passing, OpenSpec valid, live MCP `detect_changes` after local analyze verified, and repo-specific classifier overrides implemented.

---

## Background

Six improvements were identified from operational usage feedback and implemented
across three priority levels. The feedback originated from a separate repository
(`mystocks_spec`). The six priorities were:

1. **P0** MCP server returns stale `lastCommit`/`stats` after CLI rebuilds index
2. **P1** `detect_changes` does not classify files by type (source/test/config/etc.)
3. **P2** Risk level has no machine-readable explanation
4. **P1** No way to analyze only changed/staged files
5. **P2** Grammar warnings repeat multiple times per session
6. **P1** Sass `@use`/`@import`/`@forward` relationships invisible to graph

---

## Change List

### 1. P0 — Fix MCP Stale Metadata

**Problem:** When a long-running MCP server process detects that the local CLI has rebuilt the index (`gitnexus analyze`), it re-opens the database but fails to refresh the in-memory `lastCommit` and `stats` fields. All subsequent stale-checks use the stale values, causing `detect_changes` to return incorrect freshness information.

**Fix:**
- `gitnexus/src/mcp/local/local-backend.ts` — In `ensureInitialized`, after detecting `indexedAt` change and re-opening DB: also refresh `handle.lastCommit` and `handle.stats` from `meta`.
- Added `stale_reasons?: string[]` and `fresh_for_staged_diff?: boolean` to `IndexStatus` interface.
- `buildIndexStatus` now populates `stale_reasons` (e.g. `["commit_mismatch"]`) and checks whether there are staged files to set `fresh_for_staged_diff`.
- `gitnexus/src/cli/status.ts` — Added `--json` flag for structured machine-readable output.
- `gitnexus/src/cli/index.ts` — Registered `--json` on status command.
- `gitnexus/src/storage/git.ts` — Added `getStagedFiles()` and `getChangedFiles()` helper functions.
- Added zh-CN i18n for `--json` flag.

**Files:** `local-backend.ts`, `status.ts`, `index.ts`, `git.ts`, `help-i18n.ts`, `en.ts`, `zh-CN.ts`

---

### 2. P1 — File Classification in detect_changes

**Problem:** `detect_changes` reports which files changed but doesn't classify them (source, test, config, etc.). Consumers (AI agents, CI pipelines) cannot filter by file type.

**Fix:**
- `gitnexus/src/core/file-classifier.ts` (new) — Regex-based file classifier with `FileClass` union type covering: `source`, `test`, `config`, `build`, `style`, `documentation`, `governance`, `data`, `generated`, `script`, `asset`, `unknown`.
- Exports: `classifyFile()`, `classifyFiles()`, `aggregateClasses()`.
- `gitnexus/src/mcp/local/local-backend.ts` — In `detectChanges`, classifies all changed files and adds `changed_file_classes` to response.
- `gitnexus/src/mcp/tools.ts` — Added `forbidden_file_classes` parameter to `detect_changes` tool schema. When provided, the response includes a warning if any changed files match forbidden classes.

**Files:** `file-classifier.ts` (new), `local-backend.ts`, `tools.ts`

---

### 3. P2 — Risk Rationale

**Problem:** Impact analysis and change detection return a risk level (LOW/MEDIUM/HIGH/CRITICAL) but don't explain why. Consumers must reverse-engineer the rationale from raw counts.

**Fix:**
- `gitnexus/src/core/risk-rationale.ts` (new) — `generateRiskRationale(riskLevel, signals)` takes a risk level and an array of named signals (each with `name`, `value`, `threshold`, `breached`). Returns `risk_level` and `rationale: string[]`.
- Integrated in 2 call sites in `local-backend.ts`:
  - `detectChanges` — signals: `affected_processes`.
  - `_runImpactBFS` — signals: `direct_callers`, `affected_processes`, `affected_modules`, `total_impacted`.
- Each response now includes `risk_rationale: string[]` with machine-readable explanations.

**Files:** `risk-rationale.ts` (new), `local-backend.ts`

---

### 4. P1 — Incremental Analyze Mode

**Problem:** `gitnexus analyze` always processes the entire repository. For large repos, even a single-file change triggers a full scan.

**Fix:**
- `gitnexus/src/cli/index.ts` — Added `--staged-only`, `--changed-only`, `--files <path...>` flags to analyze command.
- `gitnexus/src/cli/analyze.ts` — Parses new flags into `AnalyzeOptions`.
- `gitnexus/src/core/run-analyze.ts` — Resolves file set before pipeline: `--staged-only` uses `git diff --cached --name-only`, `--changed-only` uses `git diff --name-only HEAD`, `--files` takes explicit paths. Passes as `fileFilter: Set<string>` to pipeline options.
- `gitnexus/src/core/ingestion/pipeline.ts` — Added `fileFilter` to `PipelineOptions`.
- `gitnexus/src/core/ingestion/pipeline-phases/scan.ts` — Applies file filter after walking the filesystem.
- Added zh-CN i18n for new flags.

**Files:** `index.ts`, `analyze.ts`, `run-analyze.ts`, `pipeline.ts`, `scan.ts`, `help-i18n.ts`, `en.ts`, `zh-CN.ts`

---

### 5. P2 — Grammar Warning Suppression

**Problem:** Optional grammar warnings (Kotlin, Swift, etc.) print multiple times per CLI invocation — once per call to `warnMissingOptionalGrammars`. In a single `analyze` run, the same warning can appear 3-4 times.

**Fix:**
- `gitnexus/src/cli/optional-grammars.ts` — Added module-level `reportedThisSession = new Set<string>()`. Before emitting a warning, checks if the grammar name was already reported; after emitting, adds it to the set.

**Files:** `optional-grammars.ts`

---

### 6. P1 — Sass Import Graph

**Problem:** Sass/SCSS `@use`, `@import`, `@forward` relationships are invisible to the knowledge graph. Style file dependencies cannot be traversed by `impact` or `context` tools.

**Fix:**
- `gitnexus-shared/src/graph/types.ts` — Added `'STYLE_IMPORTS'` to `RelationshipType` union.
- `gitnexus-shared/src/lbug/schema-constants.ts` — Added `'STYLE_IMPORTS'` to `REL_TYPES` array.
- `gitnexus/src/core/ingestion/style-imports.ts` (new) — Regex-based extractor for `@use`/`@import`/`@forward` with Sass partial resolution (`_prefix` convention). Exports `extractStyleImports()` and `isStyleFile()`.
- `gitnexus/src/core/ingestion/pipeline-phases/style-imports.ts` (new) — Pipeline phase `styleImportsPhase` with deps on `crossFile`. Scans style files, extracts imports, adds `STYLE_IMPORTS` edges to graph.
- `gitnexus/src/core/ingestion/pipeline-phases/index.ts` — Barrel export.
- `gitnexus/src/core/ingestion/pipeline.ts` — Registered in phase list after `scopeResolutionPhase`.

Since `STYLE_IMPORTS` is in `REL_TYPES`, existing MCP tools (`impact`, `context`, `cypher`) automatically traverse these edges. No additional MCP tool changes needed.

**Files:** `types.ts` (shared), `schema-constants.ts` (shared), `style-imports.ts` (new), `style-imports.ts` phase (new), `index.ts`, `pipeline.ts`

---

## OpenSpec Tracking

Each improvement has a corresponding change proposal with delta specs:

| Change | Directory | Validation |
|--------|-----------|------------|
| MCP index freshness fix | `openspec/changes/2026-06-02-mcp-index-freshness-fix/` | `openspec validate` PASS |
| File classification | `openspec/changes/2026-06-02-detect-changes-file-classification/` | `openspec validate` PASS |
| Risk rationale | `openspec/changes/2026-06-02-risk-rationale/` | `openspec validate` PASS |
| Incremental analyze | `openspec/changes/2026-06-02-incremental-analyze-mode/` | `openspec validate` PASS |
| Grammar suppression | `openspec/changes/2026-06-02-grammar-warning-suppression/` | `openspec validate` PASS |
| Sass import graph | `openspec/changes/2026-06-02-sass-import-graph/` | `openspec validate` PASS |

Each directory contains: `proposal.md`, `tasks.md`, `.openspec.yaml`, and `specs/<capability>/spec.md` with delta headers and scenarios.

---

## Verification

### Build & Type Check

```bash
cd /opt/claude/GitNexus/gitnexus-shared && npm run build   # tsc → PASS
cd /opt/claude/GitNexus/gitnexus && npm run build           # tsc + vite → PASS
```

### Test Suite

```bash
cd /opt/claude/GitNexus/gitnexus && npx vitest run --reporter=verbose
# Result: 9,745 pass, 7 fail (all pre-existing, verified via git stash control run)
# Pre-existing failures: detect-changes-worktree, embedder, git, language-skip,
#   sibling-clone-drift — none related to this change
```

### Focused Tests for New Behavior

```bash
cd /opt/claude/GitNexus/gitnexus && npm test -- \
  test/unit/p0-p1-p2-features.test.ts \
  test/integration/p0-p1-p2-mcp-response.test.ts \
  test/integration/cli-incremental-analyze.test.ts \
  --reporter=default
# Result: 42 pass, 0 fail
# Covers: file-classifier, risk-rationale, style-imports, index-status fields,
#         detect_changes MCP response fields, STYLE_IMPORTS traversal,
#         repo-specific classifier overrides, incremental analyze CLI flags,
#         and status --json.
```

Test files:

- `gitnexus/test/unit/p0-p1-p2-features.test.ts`
- `gitnexus/test/integration/p0-p1-p2-mcp-response.test.ts`
- `gitnexus/test/integration/cli-incremental-analyze.test.ts`

Covered: `classifyFile`, `classifyFiles`, `aggregateClasses`, repo-local `fileClassification.rules`, `generateRiskRationale`, `isStyleFile`, `extractStyleImports`, `changed_file_classes`, `forbidden_file_classes`, `risk_rationale`, `stale_reasons`, `fresh_for_staged_diff`, `STYLE_IMPORTS`, `--staged-only`, `--changed-only`, `--files`, and `status --json`.

No P0/P1/P2 child task remains deferred in this review line.

### OpenSpec Validation

```bash
for d in mcp-index-freshness-fix incremental-analyze-mode sass-import-graph \
         detect-changes-file-classification grammar-warning-suppression risk-rationale; do
  openspec validate "2026-06-02-${d}" --strict
done
# Result: 6/6 PASS
```

### Live MCP Index Freshness Verification

```bash
gitnexus analyze
gitnexus_detect_changes({ scope: "all", repo: "GitNexus", cwd: "/opt/claude/GitNexus" })
# Result: indexed_commit = current_commit = 9f2ab66d, stale: false,
#         fresh_for_staged_diff: true, changed_files: 0
```

### Pre-commit Hooks

ESLint + Prettier + TypeScript type-check passed on the committed implementation/test follow-up line. For the repo-specific classifier override line, the focused Vitest suite and `npm run build` are the fresh verification signals.

---

## Stats

- **39 files changed** in the original implementation commit `4ad039c6`, plus focused test/task follow-ups through `097130b9` and the current working tree
- **4 new source files:** `file-classifier.ts`, `risk-rationale.ts`, `style-imports.ts`, `style-imports.ts` (phase)
- **6 OpenSpec change proposals** with valid delta specs (each passes `openspec validate --strict`)
- **16 modified existing files**
- **3 focused test files** with 42 focused tests

---

## Review Checklist

- [x] P0: `ensureInitialized` refreshes `lastCommit`/`stats` — code path verified in `local-backend.ts`
- [x] P0: `gitnexus status --json` structured output — CLI E2E in `cli-incremental-analyze.test.ts`
- [x] P1: file classifier covers expected patterns — focused tests in `p0-p1-p2-features.test.ts`
- [x] P1: repo-specific classifier overrides take precedence — unit and MCP integration tests
- [x] P1: `detect_changes` response includes `changed_file_classes` and forbidden-class warnings — MCP integration in `p0-p1-p2-mcp-response.test.ts`
- [x] P1: `--staged-only`/`--changed-only`/`--files` flags — CLI E2E in `cli-incremental-analyze.test.ts`
- [x] P1: `STYLE_IMPORTS` edges appear through `impact`/`context` — MCP integration in `p0-p1-p2-mcp-response.test.ts`
- [x] P2: `risk_rationale` generation and response-shape compatibility — unit and MCP integration tests
- [x] P2: grammar warnings print once per session — unit-level session dedup coverage in `p0-p1-p2-features.test.ts`
