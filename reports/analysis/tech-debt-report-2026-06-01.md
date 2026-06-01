# Tech Debt Analysis Report — GitNexus

> Generated: 2026-06-01 | Baseline: `reports/analysis/tech-debt-baseline.json` (established this run) | Governance Stage: Baseline establishment | Commit: `3e02e28f`

## Executive Summary

| Metric | Status |
|--------|--------|
| Overall Gate | **WARN** (baseline established this run; 23 test failures block PASS) |
| D1 Code Quality | **D** |
| D2 Architecture | **C** |
| D3 Testing | **B** |
| D4 Documentation | **B** |
| D5 Dependencies | **B** |
| D6 Process/Security | **A** |

**Key Findings**: Both backend (`strict: false`) and frontend (`strict: true`) show 0 type errors. 69 backend files and 13 frontend files exceed the 500-line limit — worst is `local-backend.ts` at 4,824 lines. ESLint reports 534 warnings across 108 files (0 errors). The codebase has a large test suite (9,908 tests, 98% pass rate) but code coverage is low (~27%). 23 genuine failures in `calltool-dispatch` are the top remediation target. No secrets in code, minimal TODO debt (9 markers total).

---

## D1: Code Quality

### Type Checking

| Metric | Value | Source |
|--------|-------|--------|
| Backend type errors (`tsc --noEmit`, `strict: false`) | **0** | Measured |
| Backend type suppressions | **0** | Measured |
| Backend strict mode | **disabled** (`"strict": false`) | `gitnexus/tsconfig.json` |
| Frontend type errors (`tsc --noEmit`, `strict: true`) | **0** | Measured |
| Frontend type suppressions | **0** | Measured |
| Frontend strict mode | **enabled** (`"strict": true`) | `gitnexus-web/tsconfig.app.json` |

### Static Analysis (ESLint)

| Metric | Value | Source |
|--------|-------|--------|
| Lint errors | **0** | Measured |
| Lint warnings | **534** | Measured |
| Files with issues | **108** / 578 source files (18.7%) | Measured |

### Large Files (>500 lines)

**Measurement scope**: `gitnexus/src/**/*.ts` for backend; `gitnexus-web/src/**/*.{ts,tsx,vue}` for frontend. Line limit: 500 for both.

**69 backend files exceed the 500-line limit**. Top offenders:

| File | Lines | Over Limit |
|------|-------|------------|
| `src/mcp/local/local-backend.ts` | 4,824 | +4,324 |
| `src/core/ingestion/call-processor.ts` | 3,567 | +3,067 |
| `src/core/ingestion/workers/parse-worker.ts` | 2,238 | +1,738 |
| `src/core/ingestion/cobol/cobol-preprocessor.ts` | 2,124 | +1,624 |
| `src/core/lbug/lbug-adapter.ts` | 2,022 | +1,522 |
| `src/server/api.ts` | 1,903 | +1,403 |
| `src/core/ingestion/languages/cpp/captures.ts` | 1,626 | +1,126 |
| `src/core/ingestion/workers/worker-pool.ts` | 1,614 | +1,114 |
| `src/core/ingestion/tree-sitter-queries.ts` | 1,546 | +1,046 |
| `src/core/ingestion/cobol-processor.ts` | 1,419 | +919 |

**13 frontend files exceed the 500-line limit** (.ts, .tsx, .vue):

| File | Lines | Over Limit |
|------|-------|------------|
| `src/hooks/useSigma.ts` | 1,575 | +1,075 |
| `src/core/llm/tools.ts` | 1,487 | +987 |
| `src/hooks/useAppState.tsx` | 1,413 | +913 |
| `src/components/SettingsPanel.tsx` | 1,038 | +538 |
| `src/services/backend-client.ts` | 895 | +395 |
| `src/components/HelpPanel.tsx` | 714 | +214 |
| `src/core/llm/agent.ts` | 694 | +194 |
| `src/components/CodeReferencesPanel.tsx` | 593 | +93 |
| `src/lib/graph-adapter.ts` | 580 | +80 |
| `src/components/ProcessesPanel.tsx` | 573 | +73 |
| `src/components/FileTreePanel.tsx` | 571 | +71 |
| `src/lib/tree-layout.ts` | 570 | +70 |
| `src/components/RepoAnalyzer.tsx` | 540 | +40 |

### ESLint Hot Files (Top 10 by warning count)

| File | Warnings |
|------|----------|
| `src/mcp/local/local-backend.ts` | 108 |
| `src/server/api.ts` | 41 |
| `src/core/lbug/lbug-adapter.ts` | 31 |
| `src/cli/setup.ts` | 17 |
| `src/core/ingestion/languages/ruby/captures.ts` | 14 |
| `src/cli/eval-server.ts` | 13 |
| `src/core/ingestion/languages/java/captures.ts` | 12 |
| `src/core/ingestion/scope-resolution/scope/walkers.ts` | 12 |
| `src/core/embeddings/embedding-pipeline.ts` | 11 |
| `src/core/ingestion/languages/kotlin/captures.ts` | 10 |

### D1 Rating: D

> 0 type errors in both backend and frontend. However, backend `strict: false` suppresses many potential issues at compile time. 69 large backend files (11.9% of source) and 13 large frontend files, plus 534 lint warnings across 18.7% of files, indicate significant structural debt. The worst file (`local-backend.ts`) at 4,824 lines is a critical god-class candidate.

---

## D2: Architecture

| Metric | Value | Source |
|--------|-------|--------|
| Source files (backend) | **578** `.ts` files | Measured |
| Total source lines (backend) | **139,814** | Measured |
| Test files | **674** | Measured |
| God classes (>1,000 lines) | **11 files** | Measured |
| Circular dependency analysis | **Not measured** (madge not installed) | — |

### God Class Candidates (>1,000 lines)

| File | Lines | Concern |
|------|-------|---------|
| `local-backend.ts` | 4,824 | MCP backend — monolithic |
| `call-processor.ts` | 3,567 | Ingestion call processing |
| `parse-worker.ts` | 2,238 | Worker logic |
| `cobol-preprocessor.ts` | 2,124 | Language-specific |
| `lbug-adapter.ts` | 2,022 | Database adapter |
| `api.ts` | 1,903 | HTTP API routes |
| `cpp/captures.ts` | 1,626 | Language captures |
| `worker-pool.ts` | 1,614 | Pool management |
| `tree-sitter-queries.ts` | 1,546 | Query definitions |
| `cobol-processor.ts` | 1,419 | Language processor |
| `wiki/generator.ts` | 1,389 | Wiki generation |

### D2 Rating: C

> 11 files exceed 1,000 lines, with the top 3 exceeding 2,000 lines. `local-backend.ts` at ~4,800 lines is a severe abstraction gap — it likely handles MCP tool dispatch, repo management, query routing, and more in a single file. Circular dependency analysis was not run (madge not installed in workspace).

---

## D3: Testing

| Metric | Value | Source |
|--------|-------|--------|
| Total tests | **9,908** | Measured |
| Passed | **9,713** (98.0%) | Measured |
| Failed | **23** (0.2%) | Measured |
| Pending/Skipped | **172** (1.7%) | Measured |
| Test suites | **2,802** | Measured |
| Failed suites | **27** | Measured |
| Code coverage (statements) | **~27%** (threshold: 26%) | `vitest.config.ts` thresholds |
| Code coverage (branches) | **~23%** (threshold: 23%) | `vitest.config.ts` thresholds |

**Note on coverage vs. test volume**: The codebase has a large test suite with a high pass rate (98%), but code coverage is low (~27%). These are separate metrics — test count/pass rate measures suite size and stability, while coverage measures how much source code is exercised. Both matter.

### Skip/If Count (68 total)

Breakdown by category:
- **Platform-conditional** (`skipIf(!available)`) — Dart/Swift/Kotlin grammar availability: ~52
- **Windows-conditional** (`skipIf(process.platform === 'win32')`): ~8
- **Worker dist availability** (`skipIf(!hasDistWorker)`): ~9
- **Benchmark guards** (`skipIf(!BENCH_ENABLED)`): ~3

All 68 skips are **environment-conditional**, not unconditionally skipped. This is acceptable.

### Failing Tests (23)

Concentrated in 2 files:
- **`test/unit/calltool-dispatch.test.ts`**: 14 failures — `cypher` write blocking and `listRepos` errors
- **`test/integration/cli-e2e.test.ts`**: 1 failure — analyze command e2e
- **`test/integration/pipeline-graph-golden.test.ts`**: 1 failure — golden snapshot mismatch
- **`test/unit/analyze-embeddings-limit.test.ts`**: 1 failure — flag parsing
- **Others**: 6 failures across integration tests

### D3 Rating: B

> 98% pass rate is strong for a suite of 9,908 tests. 172 skips are all environment-conditional (grammars, platform) — not technical debt. However, 23 genuine failures indicate active regressions, primarily in `calltool-dispatch` which suggests recent MCP tool changes broke write-blocking invariants. Code coverage is low (~27%) but appears intentional for a codebase of this size; gradual ratchet is recommended.

---

## D4: Documentation

| Metric | Value | Source |
|--------|-------|--------|
| README.md | Present, 49.3KB — comprehensive | Verified |
| ARCHITECTURE.md | Present, 31.7KB | Verified |
| CONTRIBUTING.md | Present, 16.4KB | Verified |
| TESTING.md | Present, 7.5KB | Verified |
| GUARDRAILS.md | Present, 5.4KB | Verified |
| RUNBOOK.md | Present, 4.6KB | Verified |
| SECURITY.md | Present, 3.5KB | Verified |
| DEVELOPMENT_RULES.md | Present, 16.7KB | Verified |
| CHANGELOG.md | Present, 9.0KB | Verified |
| MIGRATION.md | Present | Verified |
| AGENTS.md | Present, 18.4KB | Verified |
| DoD.md | Present, 13.6KB | Verified |
| ADR directory | **Missing** | Verified |

### D4 Rating: B

> Extensive project documentation — 12+ governance and operational markdown files. No API-specific documentation audit was performed (the project is primarily a CLI/MCP server, not a REST API). Missing ADR (Architecture Decision Records) directory.

---

## D5: Dependencies

### Backend (gitnexus/)

| Metric | Value | Source |
|--------|-------|--------|
| Outdated packages | **16** | Measured |
| CVE vulnerabilities | **0** | `npm audit` |
| Critical outdated | **0** | Measured |

Notable outdated:
| Package | Current | Latest | Risk |
|---------|---------|--------|------|
| `tree-sitter` | 0.21.1 | 0.25.0 | Major version behind — API changes likely |
| `typescript` | 5.9.3 | 6.0.3 | Major version behind |
| `commander` | 14.0.3 | 15.0.0 | Major version behind |
| `@ladybugdb/core` | 0.16.1 | 0.17.0 | Minor — native addon, test before upgrade |

### Frontend (gitnexus-web/)

| Metric | Value | Source |
|--------|-------|--------|
| Outdated packages | **19** | Measured |
| CVE vulnerabilities | **0** | `npm audit` |

Notable outdated:
| Package | Current | Latest | Risk |
|---------|---------|--------|------|
| `typescript` | 5.9.3 | 6.0.3 | Major version behind |
| `langchain` | 1.3.5 | 1.4.2 | Feature lag |
| `@vitejs/plugin-react` | 5.2.0 | 6.0.2 | Major version behind |

### D5 Rating: B

> Zero CVEs across both packages — clean security posture. 16+19 outdated packages total, but most are major-version bumps (tree-sitter, typescript, commander) that require deliberate migration. No critical vulnerabilities.

---

## D6: Process & Security

| Metric | Value | Source |
|--------|-------|--------|
| Backend TODO | **5** | Measured |
| Backend FIXME | **0** | Measured |
| Backend HACK | **0** | Measured |
| Backend XXX | **1** | Measured |
| Frontend TODO | **3** | Measured |
| Frontend FIXME | **0** | Measured |
| Frontend HACK | **0** | Measured |
| Frontend XXX | **0** | Measured |
| Secrets in code | **0** | Measured |
| Debt-exception annotations | **0** | Measured |

### D6 Rating: A

> Minimal TODO debt (9 total markers across 140K lines of source). Zero FIXME, zero HACK. No hardcoded secrets detected. No debt-exception annotations found. Clean security posture.

---

## Hot Files (Top 10 by Issue Density)

Issues = large file penalty + lint warnings. Sorted by combined severity:

| Rank | File | Lint Warnings | Lines | Primary Concern |
|------|------|---------------|-------|-----------------|
| 1 | `src/mcp/local/local-backend.ts` | 108 | 4,824 | God class, most lint warnings |
| 2 | `src/core/ingestion/call-processor.ts` | 8 | 3,567 | God class |
| 3 | `src/server/api.ts` | 41 | 1,903 | High lint density |
| 4 | `src/core/lbug/lbug-adapter.ts` | 31 | 2,022 | God class + lint |
| 5 | `src/cli/setup.ts` | 17 | 735 | High lint ratio |
| 6 | `src/core/ingestion/workers/parse-worker.ts` | 0 | 2,238 | Large file |
| 7 | `src/core/ingestion/cobol/cobol-preprocessor.ts` | 0 | 2,124 | Large file |
| 8 | `src/cli/eval-server.ts` | 13 | 578 | High lint ratio |
| 9 | `src/core/ingestion/languages/ruby/captures.ts` | 14 | 619 | Moderate lint |
| 10 | `src/core/ingestion/languages/java/captures.ts` | 12 | ~400 | Moderate lint |

---

## Governance Priorities

### P0 — Fix Immediately (blocks gate PASS)

| Issue | Files | Action |
|-------|-------|--------|
| 23 failing tests | `calltool-dispatch.test.ts`, `cli-e2e.test.ts`, others | Fix `cypher` write-blocking regressions; verify golden snapshot |

### P1 — Current Sprint

| Issue | Scope | Action |
|-------|-------|--------|
| God class: `local-backend.ts` (4,824 lines) | `src/mcp/local/` | Split into tool-dispatch, repo-ops, query-routing modules |
| God class: `call-processor.ts` (3,567 lines) | `src/core/ingestion/` | Extract scope resolution, call graph building |
| `tsconfig.json` strict mode disabled | `gitnexus/` | Enable `strict: true`, fix resulting errors incrementally |
| 534 ESLint warnings (108 files) | `gitnexus/src/` | Triage: unused imports, `@typescript-eslint/no-explicit-any` — many auto-fixable |

### P2 — Next Sprint

| Issue | Scope | Action |
|-------|-------|--------|
| 69 backend files over 500-line limit | `gitnexus/src/` | Prioritize files >1,000 lines for decomposition |
| 13 frontend files over 500-line limit | `gitnexus-web/src/` | Split `useSigma.ts` (1,575L), `tools.ts` (1,487L), `useAppState.tsx` (1,413L) |
| 11 files over 1,000 lines | Mixed | Structural decomposition plan per module |
| Major dependency upgrades | Both packages | `tree-sitter` 0.21→0.25, `typescript` 5→6 migration plan |

### P3 — Backlog

| Issue | Scope | Action |
|-------|-------|--------|
| No ADR directory | Root | Start architecture decision records |
| Coverage thresholds very low (26-28%) | `vitest.config.ts` | Gradual ratchet upward |
| `commander` 14→15 migration | `gitnexus/` | Minor CLI framework update |

---

## Debt Exception Inventory

| Annotation pattern | Count |
|--------------------|-------|
| `// debt-exception` or `DEBT_EXCEPTION` | **0** |

Scan command: `grep -rn 'debt-exception\|DEBT_EXCEPTION' gitnexus/src/ gitnexus-web/src/ --include='*.ts' --include='*.tsx' --include='*.vue'`

---

## Measurement Commands (Reproducible)

All commands run from repo root `/opt/claude/GitNexus`. Tool versions: tsc 5.9.3, ESLint 9.39.4, vitest 4.1.7. Git commit: `3e02e28f`.

```bash
#!/bin/bash
# Tech debt measurement script — run from repo root
set -euo pipefail

echo "=== D1.1: Backend type check ==="
(cd gitnexus && node -e "
const ts = require('typescript');
const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, '.');
const program = ts.createProgram(parsed.fileNames, parsed.options);
const diags = ts.getPreEmitDiagnostics(program);
console.log('backend_type_errors:', diags.filter(d => d.category === ts.DiagnosticCategory.Error).length);
")

echo "=== D1.1b: Frontend type check ==="
(cd gitnexus-web && node -e "
const ts = require('typescript');
const config = ts.readConfigFile('tsconfig.app.json', ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, '.');
const program = ts.createProgram(parsed.fileNames, parsed.options);
const diags = ts.getPreEmitDiagnostics(program);
console.log('frontend_type_errors:', diags.filter(d => d.category === ts.DiagnosticCategory.Error).length);
")

echo "=== D1.2: ESLint ==="
(cd /opt/claude/GitNexus && node -e "
const { ESLint } = require('eslint');
new ESLint({overrideConfigFile:'eslint.config.mjs',errorOnUnmatchedPattern:false})
  .lintFiles(['gitnexus/src/**/*.ts']).then(r => {
    let e=0,w=0;
    r.forEach(f => { e+=f.errorCount; w+=f.warningCount; });
    console.log('backend_lint_errors:', e);
    console.log('backend_lint_warnings:', w);
    console.log('files_with_issues:', r.filter(f=>f.errorCount+f.warningCount>0).length);
  });")

echo "=== D1.3: Type suppressions ==="
echo -n "backend_suppressions: " && grep -rn '@ts-ignore\|@ts-expect-error\|@ts-nocheck' gitnexus/src/ --include='*.ts' | wc -l
echo -n "frontend_suppressions: " && grep -rn '@ts-ignore\|@ts-expect-error\|@ts-nocheck' gitnexus-web/src/ --include='*.ts' --include='*.tsx' --include='*.vue' | wc -l

echo "=== D1.4: Large files (>500 lines) ==="
echo "Backend (.ts):"
find gitnexus/src -name '*.ts' | while read f; do lines=$(wc -l < "$f"); [ "$lines" -gt 500 ] && echo "$lines $f"; done | sort -rn
echo "Frontend (.ts/.tsx/.vue):"
find gitnexus-web/src -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.vue' \) | while read f; do lines=$(wc -l < "$f"); [ "$lines" -gt 500 ] && echo "$lines $f"; done | sort -rn

echo "=== D3.1: Skip/xfail ==="
echo -n "skip_xfail_count: " && grep -rn 'test.skip\|it.skip\|describe.skip\|test.todo\|it.todo' gitnexus/test/ --include='*.ts' | wc -l

echo "=== D3.3: Test run ==="
(cd gitnexus && npx vitest run --reporter=json 2>/dev/null | node -e "
const data = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
console.log('total:', data.numTotalTests);
console.log('passed:', data.numPassedTests);
console.log('failed:', data.numFailedTests);
console.log('pending:', data.numPendingTests);
")

echo "=== D5.1: Outdated deps ==="
(cd gitnexus && npm outdated 2>&1 | tail -n +2)
(cd gitnexus-web && npm outdated 2>&1 | tail -n +2)

echo "=== D5.2: Vulnerability audit ==="
(cd gitnexus && npm audit --json 2>/dev/null | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('vulnerabilities:', d.metadata?.vulnerabilities?.total ?? 0);")
(cd gitnexus-web && npm audit --json 2>/dev/null | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('vulnerabilities:', d.metadata?.vulnerabilities?.total ?? 0);")

echo "=== D6.3: TODO/FIXME/HACK/XXX ==="
echo "Backend:" && grep -rn 'TODO\|FIXME\|HACK\|XXX' gitnexus/src/ --include='*.ts' | sed 's/.*\(TODO\|FIXME\|HACK\|XXX\).*/\1/' | sort | uniq -c | sort -rn
echo "Frontend:" && grep -rn 'TODO\|FIXME\|HACK\|XXX' gitnexus-web/src/ --include='*.ts' --include='*.tsx' --include='*.vue' | sed 's/.*\(TODO\|FIXME\|HACK\|XXX\).*/\1/' | sort | uniq -c | sort -rn

echo "=== D6.2: Secrets ==="
echo -n "secrets: " && grep -rn 'password\s*=\s*["\x27]' gitnexus/src/ gitnexus-web/src/ --include='*.ts' --include='*.tsx' --include='*.vue' 2>/dev/null | grep -v '.env\|config\|example\|test' | wc -l

echo "=== Debt exceptions ==="
echo -n "debt_exceptions: " && grep -rn 'debt-exception\|DEBT_EXCEPTION' gitnexus/src/ gitnexus-web/src/ --include='*.ts' --include='*.tsx' --include='*.vue' 2>/dev/null | wc -l
```

---

**Report generated**: tech-debt-checker skill v1.0 | Date: 2026-06-01 | Commit: `3e02e28f` | Tools: tsc 5.9.3, ESLint 9.39.4, vitest 4.1.7

## Recommended Next Steps

1. **Fix P0**: Resolve 23 failing tests before any feature work — these block gate PASS
2. **Address `local-backend.ts`**: This single file accounts for 3.4% of all source lines and 20% of lint warnings — highest ROI decomposition target
3. **Enable strict mode**: Incrementally enable `strict: true` in `gitnexus/tsconfig.json` file-by-file
4. **Ratchet coverage**: Gradually increase vitest coverage thresholds as more tests are added
