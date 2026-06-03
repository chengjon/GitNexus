# GitNexus P0/P1/P2 Improvements — Review Summary

**Commit:** `4ad039c6` (main)
**Date:** 2026-06-03
**Author:** JohnC + Claude
**Scope:** CLI, MCP server, ingestion pipeline, shared graph types

---

## Background

Based on usage feedback collected in `mystocks_spec/docs/reports/tasks/2026-06-02-gitnexus-usage-feedback.md`, six improvements were identified and implemented across three priority levels. All changes are tracked as OpenSpec change proposals under `openspec/changes/2026-06-02-*`.

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

Each improvement has a corresponding change proposal:

| Change | Directory |
|--------|-----------|
| MCP index freshness fix | `openspec/changes/2026-06-02-mcp-index-freshness-fix/` |
| File classification | `openspec/changes/2026-06-02-detect-changes-file-classification/` |
| Risk rationale | `openspec/changes/2026-06-02-risk-rationale/` |
| Incremental analyze | `openspec/changes/2026-06-02-incremental-analyze-mode/` |
| Grammar suppression | `openspec/changes/2026-06-02-grammar-warning-suppression/` |
| Sass import graph | `openspec/changes/2026-06-02-sass-import-graph/` |

Each directory contains: `proposal.md`, `tasks.md`, `.openspec.yaml`.

---

## Verification

- **Build:** Both `gitnexus-shared` and `gitnexus` build cleanly (`npm run build`).
- **Tests:** 9,729 pass, 7 fail (all pre-existing, verified by stashing changes and re-running). The only test our changes could have broken (`cli-index-help.test.ts` zh-CN localization) was caught and fixed by adding i18n entries for the 3 new CLI flags.
- **Pre-commit hooks:** ESLint + Prettier + TypeScript type-check all pass.

---

## Stats

- **38 files changed**, 1,027 insertions(+), 7 deletions(-)
- **4 new source files:** `file-classifier.ts`, `risk-rationale.ts`, `style-imports.ts`, `style-imports.ts` (phase)
- **6 OpenSpec change proposals** (18 files: proposal, tasks, yaml each)
- **16 modified existing files**

---

## Review Checklist

- [ ] P0: Verify `ensureInitialized` correctly refreshes `lastCommit`/`stats` on re-init
- [ ] P0: Verify `gitnexus status --json` produces correct structured output
- [ ] P1: Verify file classifier covers expected patterns (test fixtures, config files, etc.)
- [ ] P1: Verify `detect_changes` response includes `changed_file_classes`
- [ ] P1: Verify `--staged-only`/`--changed-only`/`--files` flags work end-to-end
- [ ] P1: Verify `STYLE_IMPORTS` edges appear in graph for SCSS repos
- [ ] P2: Verify `risk_rationale` appears in `detect_changes` and `impact` responses
- [ ] P2: Verify grammar warnings print only once per session
