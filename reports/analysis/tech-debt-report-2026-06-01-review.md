# Tech Debt Report Review - 2026-06-01

Line Scope: this line only reviews `reports/analysis/tech-debt-report-2026-06-01.md` and `reports/analysis/tech-debt-baseline.json`; it does not regenerate measurements, update the baseline, or change governance policy.

## Verdict

Status: not ready to use as a trusted drift baseline or governance gate without correction.

The report is useful as a first measurement draft, but it currently mixes baseline-establishment language with an already-saved baseline file, has several metric/schema mismatches, and leaves release-critical test failures out of the hard gate.

## Findings

### High: baseline state is contradictory

Evidence:

- Report line 9 says `Overall Gate | N/A (no baseline - establishing first snapshot)`.
- Report line 342 still says to create `reports/analysis/tech-debt-baseline.json`.
- `reports/analysis/tech-debt-baseline.json` already exists and is timestamped `2026-06-01T19:00:00Z`.

Impact: readers cannot tell whether this artifact is a first snapshot, a baseline comparison, or a post-baseline report. Drift semantics are absent even though a baseline exists.

Recommended fix: either mark the report explicitly as the baseline-establishment artifact and remove the "create baseline" next step, or regenerate the report against the saved baseline and include PASS/WARN/FAIL drift evaluation.

### High: type-check metric names do not match the measured scope

Evidence:

- Report line 27 reports `Backend type errors (tsc --noEmit) = 0`.
- Baseline line 6 stores `frontend_type_errors = 0`.
- Baseline gates `frontend_type_errors`, but there is no `backend_type_errors` baseline key.

Impact: the hard gate appears to monitor a frontend metric that the report did not measure. Backend type errors, the stated measured value, would not drift correctly because the baseline schema lacks that key.

Recommended fix: split the schema into measured scope-specific keys such as `backend_type_errors` and `frontend_type_errors`, run the frontend type check separately, and gate the metrics that are actually measured.

### High: failing tests are treated as P0 but are not gated

Evidence:

- Report line 141 declares `Failing Tests (23)`.
- Report governance priorities list failing tests under P0.
- Baseline line 16 stores `test_failed = 23`.
- Baseline lines 41-49 put `test_failed` under `observed_metrics`, not `gated_metrics`.

Impact: future quality gates can pass or warn while carrying known failing tests. That conflicts with the report's own P0 remediation priority.

Recommended fix: make `test_failed` a gated metric with target `0`, or explicitly label the current baseline as a failing historical snapshot that cannot be used as a pass gate until the failures are cleared.

### Medium: testing summary overstates health

Evidence:

- Report line 17 says the codebase has "excellent test coverage" based on `9,908 tests, 98% pass rate`.
- Baseline line 13 records `test_coverage_percent = 27`.
- Report P3 notes coverage thresholds are very low at roughly 26-28%.

Impact: the summary conflates test volume/pass rate with code coverage. This weakens prioritization because a 27% coverage baseline is not "excellent coverage" even if the suite has many tests.

Recommended fix: say "large test suite with 98% pass rate" and separately state measured code coverage as low, around 27%.

### Medium: large-file counts are internally inconsistent and undercount frontend files

Evidence:

- Report line 17 says 65 source files exceed the 500-line limit.
- Report line 41 says 66 backend files exceed the limit.
- Baseline line 19 stores `large_file_count_backend = 66`.
- Baseline line 20 stores `large_file_count_frontend = 6`.
- Local measured count at review time: 69 backend `.ts` files over 500 lines, and 14 frontend `.ts/.tsx/.vue` files over 500 lines.

Frontend files over 500 lines that are omitted by the report's 6-file count include `gitnexus-web/src/hooks/useAppState.tsx`, `gitnexus-web/src/components/SettingsPanel.tsx`, `gitnexus-web/src/components/HelpPanel.tsx`, `gitnexus-web/src/components/CodeReferencesPanel.tsx`, `gitnexus-web/src/components/ProcessesPanel.tsx`, `gitnexus-web/src/components/FileTreePanel.tsx`, `gitnexus-web/src/components/RepoAnalyzer.tsx`, and `gitnexus-web/src/components/Header.tsx`.

Impact: the debt baseline understates frontend decomposition work and is inconsistent even within the report.

Recommended fix: define the measured file extensions and roots in the report and baseline. For frontend, include `.tsx` and `.vue` unless intentionally excluded, and record that exclusion explicitly.

### Medium: TODO/security-process marker counts disagree

Evidence:

- Report line 221 says backend TODO count is 5.
- Report line 227 says total TODO/FIXME/HACK/XXX count is 9.
- Baseline line 18 stores `backend_todo_count = 6`.
- Local measured backend TODO/FIXME/HACK/XXX count at review time is 6.

Impact: the D6 baseline cannot be compared reliably because the report and JSON disagree on the source count.

Recommended fix: store separate marker keys, for example `backend_todo_count`, `backend_fixme_count`, `backend_hack_count`, `backend_xxx_count`, and matching frontend keys.

### Medium: reproducibility appendix is not a single runnable measurement script

Evidence:

- The command appendix uses stateful `cd` commands and later runs `cd gitnexus-web` after a prior `cd gitnexus && ...` line.
- The appendix uses backend-only suppression and large-file commands for some metrics.
- The baseline JSON does not store source commit, command versions, command exit status, or measured/inferred/historical-baseline labels.

Impact: another reviewer may not reproduce the same numbers, and metric claims cannot be cleanly separated into measured current state versus historical baseline.

Recommended fix: replace the appendix with one repo-root script or command set that uses absolute paths or subshells, records the git commit, and labels every metric as Measured, Inferred, or Historical Baseline.

### Low: debt exception inventory has no reproducible measurement

Evidence:

- Report line 293 says no `debt-exception` annotations were found.
- The command appendix does not include the exact command used for debt-exception inventory.
- The baseline has no exception inventory key.

Impact: exception drift cannot be tracked, and expired exceptions cannot be gated later.

Recommended fix: add measured keys for total exceptions and expired exceptions, and include the exact scan command.

## Recommended Correction Order

1. Fix the baseline/report state contradiction and regenerate or relabel the report.
2. Correct the baseline schema for backend/frontend type metrics.
3. Gate `test_failed` or clearly mark the baseline as failing.
4. Recount large files with explicit roots and extensions.
5. Reconcile D6 marker counts.
6. Convert the command appendix into a reproducible script with commit and tool-version metadata.

## Review Notes

Measured during review:

- Backend source files under `gitnexus/src`: 578 `.ts` files.
- Backend files over 500 lines: 69.
- Frontend files over 500 lines under `gitnexus-web/src`: 14 `.ts/.tsx/.vue` files.
- Backend type suppressions: 0.
- Backend TODO/FIXME/HACK/XXX markers: 6.
- Test skip/todo/skipIf patterns under `gitnexus/test`: 68.

No baseline file was modified.
