import { describe, expect, it } from 'vitest';
import {
  parseChangedFilesOutput,
  findCompatibilityMetadataViolations,
  findManagedPathViolations,
  findPathModeViolations,
  findPullRequestBodyViolations,
  findTemporaryScriptMetadataViolations,
} from '../../scripts/ci/repository-governance-check.mjs';

describe('repository governance path checks', () => {
  it('parses rename diff entries with both previous and current paths', () => {
    const changedFiles = parseChangedFilesOutput([
      'R100\tgitnexus/src/router_new.ts\tgitnexus/src/router.ts',
      'M\tgitnexus/src/mcp/server.ts',
    ].join('\n'));

    expect(changedFiles).toEqual([
      {
        status: 'R100',
        previousPath: 'gitnexus/src/router_new.ts',
        path: 'gitnexus/src/router.ts',
      },
      {
        status: 'M',
        path: 'gitnexus/src/mcp/server.ts',
      },
    ]);
  });

  it('flags temporary production-path filenames', () => {
    const violations = findManagedPathViolations([
      'gitnexus/src/tmp_parser.ts',
      'gitnexus-web/src/old_router.ts',
      'eval/temp_runner.py',
      'gitnexus/src/copy_router.ts',
    ]);

    expect(violations).toEqual([
      expect.objectContaining({
        path: 'gitnexus/src/tmp_parser.ts',
        rule: 'temporary-filename',
      }),
      expect.objectContaining({
        path: 'gitnexus-web/src/old_router.ts',
        rule: 'temporary-filename',
      }),
      expect.objectContaining({
        path: 'eval/temp_runner.py',
        rule: 'temporary-filename',
      }),
      expect.objectContaining({
        path: 'gitnexus/src/copy_router.ts',
        rule: 'temporary-filename',
      }),
    ]);
  });

  it('does not treat migration-style *_new files as generic temp-file violations', () => {
    const violations = findManagedPathViolations([
      'gitnexus/src/router_new.ts',
    ]);

    expect(violations).toEqual([]);
  });

  it('flags temporary migration or debug scripts that live outside managed script paths', () => {
    const violations = findManagedPathViolations([
      'gitnexus/src/debug-cutover-trace.mjs',
      'gitnexus-web/src/migration-backfill-state.ts',
    ]);

    expect(violations).toEqual([
      expect.objectContaining({
        path: 'gitnexus/src/debug-cutover-trace.mjs',
        rule: 'temporary-script-location',
      }),
      expect.objectContaining({
        path: 'gitnexus-web/src/migration-backfill-state.ts',
        rule: 'temporary-script-location',
      }),
    ]);
  });

  it('allows temporary migration or debug scripts inside managed script paths', () => {
    const violations = findManagedPathViolations([
      'gitnexus/scripts/debug-cutover-trace.mjs',
      'gitnexus-web/scripts/migration-backfill-state.ts',
    ]);

    expect(violations).toEqual([]);
  });

  it('flags generic temporary migration or debug script names inside managed script paths', () => {
    const violations = findManagedPathViolations([
      'gitnexus/scripts/debug.mjs',
      'gitnexus-web/scripts/cutover.py',
      'eval/scripts/backfill.sh',
    ]);

    expect(violations).toEqual([
      expect.objectContaining({
        path: 'gitnexus/scripts/debug.mjs',
        rule: 'temporary-script-name-specificity',
      }),
      expect.objectContaining({
        path: 'gitnexus-web/scripts/cutover.py',
        rule: 'temporary-script-name-specificity',
      }),
      expect.objectContaining({
        path: 'eval/scripts/backfill.sh',
        rule: 'temporary-script-name-specificity',
      }),
    ]);
  });

  it('ignores documented fixture and docs paths', () => {
    const violations = findManagedPathViolations([
      'gitnexus/test/fixtures/tmp_parser.ts',
      'docs/archive/temp_notes.md',
      'tmp_exports/old_report.md',
      'gitnexus/src/router.ts',
    ]);

    expect(violations).toEqual([]);
  });

  it('path mode also enforces metadata for temporary scripts committed under managed scripts paths', async () => {
    const violations = await findPathModeViolations(
      [
        'gitnexus/scripts/debug-cutover-trace.mjs',
      ],
      async () => 'console.log("hello");\n',
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'temp-script-canonical-path', path: 'gitnexus/scripts/debug-cutover-trace.mjs' }),
        expect.objectContaining({ rule: 'temp-script-purpose', path: 'gitnexus/scripts/debug-cutover-trace.mjs' }),
        expect.objectContaining({ rule: 'temp-script-cleanup-tracking', path: 'gitnexus/scripts/debug-cutover-trace.mjs' }),
        expect.objectContaining({ rule: 'temp-script-exit-condition', path: 'gitnexus/scripts/debug-cutover-trace.mjs' }),
      ]),
    );
  });

  it('path mode requires developer-facing markdown entrypoints to reference DEVELOPMENT_RULES.md', async () => {
    const violations = await findPathModeViolations(
      [
        'README.md',
        'docs/gitnexus-quick-start-guide.md',
      ],
      async () => '# Missing governance anchor\n',
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'markdown-development-rules-anchor', path: 'README.md' }),
        expect.objectContaining({ rule: 'markdown-development-rules-anchor', path: 'docs/gitnexus-quick-start-guide.md' }),
      ]),
    );
  });

  it('path mode ignores exempt or non-entrypoint markdown when checking development-rules anchors', async () => {
    const violations = await findPathModeViolations(
      [
        'CHANGELOG.md',
        'DEVELOPMENT_RULES.md',
        'docs/archive/old-note.md',
        '.github/PULL_REQUEST_TEMPLATE.md',
      ],
      async () => '# Not an anchored entrypoint\n',
    );

    expect(violations).toEqual([]);
  });
});

describe('repository governance PR body checks', () => {
  it('accepts a PR body that keeps all metric sections', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/router.ts
- Compatibility Layer / Shim:
- Exit Condition:
- Deletion Reachability:
- GitNexus Evidence:
- N/A: none

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/router.ts' },
    ]);

    expect(violations).toEqual([]);
  });

  it('reports missing metric classification sections', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path:
- Compatibility Layer / Shim:
- Exit Condition:
- Deletion Reachability:
- GitNexus Evidence:

## Metrics Claims

- Measured:
- Inferred:
`);

    expect(violations).toEqual([
      expect.objectContaining({
        rule: 'pr-metrics-section',
      }),
    ]);
    expect(violations[0]?.message).toContain('Historical Baseline');
  });

  it('reports missing governance note fields', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path:

## Metrics Claims

- Measured:
- Inferred:
- Historical Baseline:
`);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rule: 'pr-governance-fields',
        }),
      ]),
    );
    expect(violations.find((entry) => entry.rule === 'pr-governance-fields')?.message).toContain('Compatibility Layer / Shim');
    expect(violations.find((entry) => entry.rule === 'pr-governance-fields')?.message).toContain('Deletion Reachability');
    expect(violations.find((entry) => entry.rule === 'pr-governance-fields')?.message).toContain('GitNexus Evidence');
  });

  it('requires the markdown-entrypoint checklist item when developer-facing markdown entrypoints change', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Development Rules Check

- [ ] I reviewed \`DEVELOPMENT_RULES.md\` and this PR follows it.

## Governance Notes

- Canonical Path: docs/gitnexus-quick-start-guide.md
- Compatibility Layer / Shim:
- Exit Condition:
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'docs/gitnexus-quick-start-guide.md' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-markdown-entrypoint-checklist' }),
      ]),
    );
  });

  it('accepts developer-facing markdown entrypoint changes when the checklist item is present', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Development Rules Check

- [ ] I reviewed \`DEVELOPMENT_RULES.md\` and this PR follows it.
- [ ] Any developer-facing markdown entrypoint I changed in the repository root or first-level \`docs/\`, \`eval/\`, or \`gitnexus/\` directories still points readers to \`DEVELOPMENT_RULES.md\`.

## Governance Notes

- Canonical Path: docs/gitnexus-quick-start-guide.md
- Compatibility Layer / Shim:
- Exit Condition:
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'docs/gitnexus-quick-start-guide.md' },
    ]);

    expect(violations).toEqual([]);
  });

  it('requires compatibility notes when compatibility-layer paths change', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Exit Condition:
- Migration Status:
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/mcp/compatible-stdio-transport.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-compatibility-note' }),
        expect.objectContaining({ rule: 'pr-exit-condition' }),
        expect.objectContaining({ rule: 'pr-migration-status' }),
      ]),
    );
  });

  it('requires direct cutover risk notes when compatibility-layer paths change', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/router.ts
- Compatibility Layer / Shim: gitnexus/src/router_new.ts is the active migration bridge
- Direct Cutover Risk:
- Exit Condition: remove router_new.ts once every caller uses gitnexus/src/router.ts
- Migration Status: transitional
- Cleanup Tracking: remove router_new.ts in GNX-301 after the final caller migrates
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/router_new.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-direct-cutover-risk' }),
      ]),
    );
  });

  it('accepts a concrete direct cutover risk note when compatibility-layer paths change', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/router.ts
- Compatibility Layer / Shim: gitnexus/src/router_new.ts is the active migration bridge
- Direct Cutover Risk: two CLI host adapters still import router_new.ts and would break local MCP startup until GNX-301 lands
- Exit Condition: remove router_new.ts once every caller uses gitnexus/src/router.ts
- Migration Status: transitional
- Cleanup Tracking: remove router_new.ts in GNX-301 after the final caller migrates
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/router_new.ts' },
    ]);

    expect(violations).toEqual([]);
  });

  it('rejects placeholder direct cutover risk notes when compatibility-layer paths change', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/router.ts
- Compatibility Layer / Shim: gitnexus/src/router_new.ts is the active migration bridge
- Direct Cutover Risk: keep for safety until later
- Exit Condition: remove router_new.ts once every caller uses gitnexus/src/router.ts
- Migration Status: transitional
- Cleanup Tracking: remove router_new.ts in GNX-301 after the final caller migrates
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/router_new.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-direct-cutover-risk-quality' }),
      ]),
    );
  });

  it('rejects active compatibility-layer PRs that claim the migration is complete', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/router.ts
- Compatibility Layer / Shim: gitnexus/src/router_new.ts is the active migration bridge
- Exit Condition: remove router_new.ts once every caller uses gitnexus/src/router.ts
- Migration Status: complete
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/router_new.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-migration-status-active-compat' }),
      ]),
    );
  });

  it('requires cleanup tracking when a compatibility layer remains active', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/router.ts
- Compatibility Layer / Shim: gitnexus/src/router_new.ts is the active migration bridge
- Exit Condition: remove router_new.ts once every caller uses gitnexus/src/router.ts
- Migration Status: transitional
- Cleanup Tracking:
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/router_new.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-cleanup-tracking' }),
      ]),
    );
  });

  it('rejects placeholder cleanup tracking when a compatibility layer remains active', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/router.ts
- Compatibility Layer / Shim: gitnexus/src/router_new.ts is the active migration bridge
- Exit Condition: remove router_new.ts once every caller uses gitnexus/src/router.ts
- Migration Status: transitional
- Cleanup Tracking: TBD in later follow-up cleanup
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/router_new.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-cleanup-tracking-quality' }),
      ]),
    );
  });

  it('rejects cleanup tracking without a milestone, issue, or task reference when a compatibility layer remains active', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/router.ts
- Compatibility Layer / Shim: router_new.ts is the active migration bridge
- Direct Cutover Risk: two CLI host adapters still import router_new.ts and would break local MCP startup until GNX-301 lands
- Exit Condition: remove router_new.ts once every caller uses gitnexus/src/router.ts
- Migration Status: transitional
- Cleanup Tracking: remove after the final caller migration closes
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/router_new.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-cleanup-tracking-quality' }),
      ]),
    );
  });

  it('requires cleanup tracking when a temporary migration script remains active', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Exit Condition:
- Migration Status:
- Cleanup Tracking:
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'A', path: 'gitnexus/scripts/migration-backfill-graph.mjs' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-migration-status' }),
        expect.objectContaining({ rule: 'pr-cleanup-tracking' }),
      ]),
    );
  });

  it('accepts cleanup tracking plus exit condition when a temporary migration script remains active', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Exit Condition: remove migration-backfill-graph.mjs after GNX-241 verifies the backfill output and no operator workflow still depends on it
- Migration Status: transitional
- Cleanup Tracking: remove in milestone 4 after GNX-241 verifies the backfill output
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'A', path: 'gitnexus/scripts/migration-backfill-graph.mjs' },
    ]);

    expect(violations).toEqual([]);
  });

  it('rejects temporary migration-script PRs that claim the migration is complete', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Exit Condition: remove migration-backfill-graph.mjs after GNX-241 confirms the cutover output is stable for 7 days
- Migration Status: complete
- Cleanup Tracking: remove in milestone 4 after GNX-241 verifies the backfill output
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'A', path: 'gitnexus/scripts/migration-backfill-graph.mjs' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-migration-status-active-temp-migration' }),
      ]),
    );
  });

  it('does not require migration status for pure debug scripts that are not migration scaffolding', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Exit Condition: remove debug-render-pane.mjs after GNX-311 finishes the render-pane investigation
- Migration Status:
- Cleanup Tracking: remove in GNX-311 after the render-pane investigation closes
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'A', path: 'gitnexus-web/scripts/debug-render-pane.mjs' },
    ]);

    expect(violations).toEqual([]);
  });

  it('rejects temporary-script PRs whose canonical path still points at the temporary script itself', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/scripts/migration-backfill-graph.mjs
- Compatibility Layer / Shim:
- Exit Condition: remove migration-backfill-graph.mjs after GNX-241 confirms the cutover output is stable for 7 days
- Migration Status:
- Cleanup Tracking: remove in milestone 4 after GNX-241 verifies the backfill output
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'A', path: 'gitnexus/scripts/migration-backfill-graph.mjs' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-canonical-path-temporary-script' }),
      ]),
    );
  });

  it('rejects placeholder cleanup tracking when a temporary migration script remains active', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Exit Condition:
- Migration Status:
- Cleanup Tracking: later follow-up cleanup
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'A', path: 'gitnexus/scripts/migration-backfill-graph.mjs' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-cleanup-tracking-quality' }),
      ]),
    );
  });

  it('requires exit condition when a temporary migration script remains active', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Exit Condition:
- Migration Status:
- Cleanup Tracking: remove in milestone 4 after GNX-241 verifies the backfill output
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'A', path: 'gitnexus/scripts/migration-backfill-graph.mjs' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-exit-condition' }),
      ]),
    );
  });

  it('accepts a concrete exit condition when a temporary migration script remains active', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Exit Condition: remove migration-backfill-graph.mjs after GNX-241 confirms the cutover output is stable for 7 days
- Migration Status: transitional
- Cleanup Tracking: remove in milestone 4 after GNX-241 verifies the backfill output
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'A', path: 'gitnexus/scripts/migration-backfill-graph.mjs' },
    ]);

    expect(violations).toEqual([]);
  });

  it('rejects placeholder exit conditions when a temporary migration script remains active', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Exit Condition: TBD in later follow-up cleanup
- Migration Status:
- Cleanup Tracking: remove in milestone 4 after GNX-241 verifies the backfill output
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'A', path: 'gitnexus/scripts/migration-backfill-graph.mjs' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-exit-condition-quality' }),
      ]),
    );
  });

  it('rejects placeholder exit conditions for compatibility-layer changes', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/router.ts
- Compatibility Layer / Shim: gitnexus/src/router_new.ts is the temporary migration bridge
- Exit Condition: TBD in follow-up cleanup
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/router_new.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-exit-condition-quality' }),
      ]),
    );
  });

  it('rejects compatibility notes that do not name the actual shim or compatibility path', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/router.ts
- Compatibility Layer / Shim: temporary migration bridge for router cutover
- Exit Condition: remove router_new.ts once every caller uses gitnexus/src/router.ts
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/router_new.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-compatibility-target' }),
      ]),
    );
  });

  it('rejects compatibility notes that only name a basename instead of a repo-relative path', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/router.ts
- Compatibility Layer / Shim: router_new.ts is the active migration bridge
- Direct Cutover Risk: two CLI host adapters still import gitnexus/src/router_new.ts and would break local MCP startup until GNX-301 lands
- Exit Condition: remove gitnexus/src/router_new.ts once every caller uses gitnexus/src/router.ts
- Migration Status: transitional
- Cleanup Tracking: remove in GNX-301 after the final caller migrates
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/router_new.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-compatibility-path-format' }),
      ]),
    );
  });

  it('rejects compatibility-layer PRs whose canonical path still points at the shim or *_new path', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/router_new.ts
- Compatibility Layer / Shim: gitnexus/src/router_new.ts is still acting as the migration bridge
- Exit Condition: remove router_new.ts once every caller uses gitnexus/src/router.ts
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/router_new.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-canonical-path-compatibility' }),
      ]),
    );
  });

  it('rejects compatibility-layer PRs whose canonical path points at a temporary migration script', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/scripts/migration-backfill-graph.mjs
- Compatibility Layer / Shim: gitnexus/src/router_new.ts is still acting as the migration bridge
- Direct Cutover Risk: two CLI host adapters still import router_new.ts and would break local MCP startup until GNX-301 lands
- Exit Condition: remove router_new.ts once every caller uses gitnexus/src/router.ts
- Migration Status: transitional
- Cleanup Tracking: remove router_new.ts in GNX-301 after the final caller migrates
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/router_new.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-canonical-path-compatibility' }),
      ]),
    );
  });

  it('rejects canonical path fields that name multiple candidate paths', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/router.ts, gitnexus/src/router_legacy.ts
- Compatibility Layer / Shim:
- Exit Condition:
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/router.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-canonical-path-multiple' }),
      ]),
    );
  });

  it('requires compatibility notes when a compatibility-layer file is renamed back to a stable path', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/router.ts
- Compatibility Layer / Shim:
- Exit Condition:
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      {
        status: 'R100',
        previousPath: 'gitnexus/src/router_new.ts',
        path: 'gitnexus/src/router.ts',
      },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-compatibility-note' }),
        expect.objectContaining({ rule: 'pr-exit-condition' }),
        expect.objectContaining({ rule: 'pr-deletion-reachability' }),
        expect.objectContaining({ rule: 'pr-deletion-evidence' }),
      ]),
    );
  });

  it('accepts rename-based path retirement when deletion reachability and GitNexus evidence are recorded', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/router.ts
- Compatibility Layer / Shim: gitnexus/src/router_new.ts retired as the migration bridge
- Direct Cutover Risk: the stable rename cannot land directly because active callers and reviewer references still need the retired path called out in the cutover PR
- Exit Condition: remove the temporary naming once the stable path is restored
- Migration Status: complete
- Deletion Reachability: feature-tree: no live feature tree still routes through router_new.ts; runtime: router_new.ts is absent from live entrypoints; scripts: no automation or operator workflow uses router_new.ts; config: no flag or env branch selects router_new.ts; tests: no contract-preserving fixture depends on router_new.ts
- GitNexus Evidence: gitnexus_query(query: "router_new.ts"), gitnexus_context(name: "createRouter"), retired path gitnexus/src/router_new.ts
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      {
        status: 'R100',
        previousPath: 'gitnexus/src/router_new.ts',
        path: 'gitnexus/src/router.ts',
      },
    ]);

    expect(violations).toEqual([]);
  });

  it('requires feature-tree coverage for rename-based path retirement', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/router.ts
- Compatibility Layer / Shim: gitnexus/src/router_new.ts retired as the migration bridge
- Exit Condition: remove the temporary naming once the stable path is restored
- Migration Status: complete
- Deletion Reachability: runtime: router_new.ts is absent from live entrypoints; scripts: no automation or operator workflow uses router_new.ts; config: no flag or env branch selects router_new.ts; tests: no contract-preserving fixture depends on router_new.ts
- GitNexus Evidence: gitnexus_query(query: "router_new.ts"), gitnexus_context(name: "createRouter"), canonical path gitnexus/src/router.ts
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      {
        status: 'R100',
        previousPath: 'gitnexus/src/router_new.ts',
        path: 'gitnexus/src/router.ts',
      },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-deletion-reachability-coverage' }),
      ]),
    );
  });

  it('requires structured deletion reachability coverage for rename-based path retirement', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/router.ts
- Compatibility Layer / Shim: gitnexus/src/router_new.ts retired as the migration bridge
- Exit Condition: remove the temporary naming once the stable path is restored
- Deletion Reachability: router_new.ts is no longer referenced anywhere important
- GitNexus Evidence: gitnexus_query(query: "router_new.ts"), gitnexus_context(name: "createRouter"), canonical path gitnexus/src/router.ts
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      {
        status: 'R100',
        previousPath: 'gitnexus/src/router_new.ts',
        path: 'gitnexus/src/router.ts',
      },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-deletion-reachability-coverage' }),
      ]),
    );
  });

  it('rejects GitNexus evidence that does not name the retired or canonical path', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/router.ts
- Compatibility Layer / Shim: gitnexus/src/router_new.ts retired as the migration bridge
- Exit Condition: remove the temporary naming once the stable path is restored
- Deletion Reachability: old migration bridge is no longer reachable
- GitNexus Evidence: gitnexus_context(name: "createRouter"), gitnexus_query(query: "router migration")
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      {
        status: 'R100',
        previousPath: 'gitnexus/src/router_new.ts',
        path: 'gitnexus/src/router.ts',
      },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-deletion-evidence-target' }),
      ]),
    );
  });

  it('rejects GitNexus evidence that only names a basename instead of a repo-relative path', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Exit Condition:
- Migration Status: n/a
- Deletion Reachability: feature-tree: no live feature tree still exposes gitnexus/src/mcp/server.ts; runtime: gitnexus/src/mcp/server.ts is absent from live entrypoints; scripts: no automation or operator workflow invokes gitnexus/src/mcp/server.ts; config: no flag or env branch selects gitnexus/src/mcp/server.ts; tests: no contract-preserving fixture keeps gitnexus/src/mcp/server.ts alive
- GitNexus Evidence: gitnexus_impact(target: "server.ts"), gitnexus_context(name: "createServer"), retired path server.ts
- N/A: none

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'D', path: 'gitnexus/src/mcp/server.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-deletion-evidence-target-format' }),
      ]),
    );
  });

  it('requires deletion reachability notes when managed files are deleted', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Exit Condition:
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured:
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'D', path: 'gitnexus/src/mcp/server.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-deletion-reachability' }),
        expect.objectContaining({ rule: 'pr-deletion-evidence' }),
      ]),
    );
  });

  it('accepts deletion evidence when GitNexus analysis is cited', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Exit Condition:
- Migration Status: n/a
- Deletion Reachability: feature-tree: no live feature tree still exposes gitnexus/src/mcp/server.ts; runtime: gitnexus/src/mcp/server.ts is absent from live entrypoints; scripts: no automation or operator workflow invokes gitnexus/src/mcp/server.ts; config: no flag or env branch selects gitnexus/src/mcp/server.ts; tests: no contract-preserving fixture keeps gitnexus/src/mcp/server.ts alive
- GitNexus Evidence: gitnexus_impact(target: "server.ts"), gitnexus_context(name: "createServer"), retired path gitnexus/src/mcp/server.ts
- N/A: none

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'D', path: 'gitnexus/src/mcp/server.ts' },
    ]);

    expect(violations).toEqual([]);
  });

  it('rejects deletion evidence that does not cite a GitNexus tool or resource', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Exit Condition:
- Deletion Reachability: no callers remain on the live path
- GitNexus Evidence: checked references manually and did not find any remaining usage
- N/A: none

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'D', path: 'gitnexus/src/mcp/server.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-deletion-evidence-format' }),
      ]),
    );
  });

  it('accepts deletion evidence when a GitNexus resource URI is cited', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Exit Condition:
- Migration Status: n/a
- Deletion Reachability: feature-tree: no live feature tree still exposes gitnexus/src/mcp/server.ts; runtime: gitnexus/src/mcp/server.ts is absent from live entrypoints; scripts: no automation or operator workflow invokes gitnexus/src/mcp/server.ts; config: no flag or env branch selects gitnexus/src/mcp/server.ts; tests: no contract-preserving fixture keeps gitnexus/src/mcp/server.ts alive
- GitNexus Evidence: reviewed gitnexus://repo/GitNexus/process/StartMCPServer and confirmed gitnexus/src/mcp/server.ts is absent
- N/A: none

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'D', path: 'gitnexus/src/mcp/server.ts' },
    ]);

    expect(violations).toEqual([]);
  });

  it('requires canonical path notes when managed files change', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path:
- Compatibility Layer / Shim:
- Exit Condition:
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/mcp/server.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-canonical-path' }),
      ]),
    );
  });

  it('rejects canonical path notes that do not name a stable repo-relative path', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: stable MCP server path
- Compatibility Layer / Shim:
- Exit Condition:
- Deletion Reachability:
- GitNexus Evidence:
- N/A:

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/mcp/server.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-canonical-path-format' }),
      ]),
    );
  });

  it('requires metrics content or an explicit N/A note', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Exit Condition:
- Deletion Reachability:
- GitNexus Evidence:
- N/A: none

## Metrics Claims

- Measured:
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/mcp/server.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-metrics-content' }),
      ]),
    );
  });

  it('rejects metrics claims that mix N/A with measured or inferred classifications', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Exit Condition:
- Deletion Reachability:
- GitNexus Evidence:
- N/A: none

## Metrics Claims

- Measured: p95 startup improved from 220ms to 180ms
- Inferred:
- Historical Baseline:
- N/A: no metrics apply
`, [
      { status: 'M', path: 'gitnexus/src/mcp/server.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-metrics-na-exclusive' }),
      ]),
    );
  });

  it('rejects metric claims without explicit scope and time context', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Exit Condition:
- Deletion Reachability:
- GitNexus Evidence:
- N/A: none

## Metrics Claims

- Measured: p95 startup improved from 220ms to 180ms
- Inferred:
- Historical Baseline:
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/mcp/server.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-metric-context' }),
      ]),
    );
    expect(violations.find((entry) => entry.rule === 'pr-metric-context')?.message).toContain('Measured');
  });

  it('accepts metric claims when they declare explicit scope and time context', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

Some change.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Exit Condition:
- Deletion Reachability:
- GitNexus Evidence:
- N/A: none

## Metrics Claims

- Measured: scope: local MCP startup benchmark on the mini repo fixture; time: 2026-04-07 current run; value: p95 startup improved from 220ms to 180ms
- Inferred:
- Historical Baseline: scope: same local MCP startup benchmark on the mini repo fixture; time: 2026-04-01 baseline run; value: p95 startup was 220ms before the cutover
- N/A:
`, [
      { status: 'M', path: 'gitnexus/src/mcp/server.ts' },
    ]);

    expect(violations).toEqual([]);
  });

  it('rejects mechanical split notes that do not explain a concrete boundary benefit', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

This PR is a mechanical split of the MCP router files.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Direct Cutover Risk:
- Exit Condition:
- Migration Status:
- Cleanup Tracking:
- Deletion Reachability:
- GitNexus Evidence:
- N/A: none

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:

## Notes

Mechanical split only, no other context.
`, [
      { status: 'M', path: 'gitnexus/src/mcp/server.ts' },
    ]);

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'pr-mechanical-split-benefit' }),
      ]),
    );
  });

  it('accepts mechanical split notes when they explain a concrete boundary benefit', () => {
    const violations = findPullRequestBodyViolations(`
## Summary

This PR is a mechanical split of the MCP router files.

## Governance Notes

- Canonical Path: gitnexus/src/mcp/server.ts
- Compatibility Layer / Shim:
- Direct Cutover Risk:
- Exit Condition:
- Migration Status:
- Cleanup Tracking:
- Deletion Reachability:
- GitNexus Evidence:
- N/A: none

## Metrics Claims

- Measured: none
- Inferred:
- Historical Baseline:
- N/A:

## Notes

Mechanical split improves ownership boundaries and change safety by isolating route registration from CLI startup wiring.
`, [
      { status: 'M', path: 'gitnexus/src/mcp/server.ts' },
    ]);

    expect(violations).toEqual([]);
  });
});

describe('repository governance compatibility file metadata checks', () => {
  it('requires canonical path, direct cutover risk, exit condition, and cleanup tracking markers for newly added compatibility files', async () => {
    const violations = await findCompatibilityMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/src/mcp/router-compat.ts' },
        { status: 'A', path: 'gitnexus/src/mcp/router_new.ts' },
      ],
      async () => 'export const value = 1;\n',
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'compat-file-canonical-path' }),
        expect.objectContaining({ rule: 'compat-file-direct-cutover-risk' }),
        expect.objectContaining({ rule: 'compat-file-exit-condition' }),
        expect.objectContaining({ rule: 'compat-file-cleanup-tracking' }),
      ]),
    );
  });

  it('accepts newly added compatibility files when retirement metadata is present', async () => {
    const violations = await findCompatibilityMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/src/mcp/router-compat.ts' },
      ],
      async () => [
        '// CANONICAL PATH: gitnexus/src/mcp/server.ts',
        '// DIRECT CUTOVER RISK: two MCP entrypoints still import router-compat.ts and need phased cutover validation',
        '// EXIT CONDITION: remove after router clients migrate',
        '// CLEANUP TRACKING: remove in GNX-301 after final MCP client migration completes',
        'export const value = 1;',
      ].join('\n'),
    );

    expect(violations).toEqual([]);
  });

  it('rejects newly added compatibility files when canonical path metadata still points at a compatibility path', async () => {
    const violations = await findCompatibilityMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/src/mcp/router_new.ts' },
      ],
      async () => [
        '// CANONICAL PATH: gitnexus/src/mcp/router_v2.ts',
        '// EXIT CONDITION: remove after router clients migrate',
        'export const value = 1;',
      ].join('\n'),
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'compat-file-canonical-path-target' }),
      ]),
    );
  });

  it('rejects newly added compatibility files when canonical path metadata points at a temporary script', async () => {
    const violations = await findCompatibilityMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/src/mcp/router_new.ts' },
      ],
      async () => [
        '// CANONICAL PATH: gitnexus/scripts/migration-backfill-graph.mjs',
        '// DIRECT CUTOVER RISK: two MCP entrypoints still import router_new.ts and need phased cutover validation',
        '// EXIT CONDITION: remove after router clients migrate',
        '// CLEANUP TRACKING: remove in GNX-301 after final MCP client migration completes',
        'export const value = 1;',
      ].join('\n'),
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'compat-file-canonical-path-target' }),
      ]),
    );
  });

  it('rejects newly added compatibility files when direct cutover risk metadata is still a placeholder', async () => {
    const violations = await findCompatibilityMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/src/mcp/router_new.ts' },
      ],
      async () => [
        '// CANONICAL PATH: gitnexus/src/mcp/server.ts',
        '// DIRECT CUTOVER RISK: keep for safety until later',
        '// EXIT CONDITION: remove after router clients migrate',
        '// CLEANUP TRACKING: remove in GNX-301 after final MCP client migration completes',
        'export const value = 1;',
      ].join('\n'),
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'compat-file-direct-cutover-risk-quality' }),
      ]),
    );
  });

  it('rejects newly added compatibility files when canonical path metadata names multiple paths', async () => {
    const violations = await findCompatibilityMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/src/mcp/router_new.ts' },
      ],
      async () => [
        '// CANONICAL PATH: gitnexus/src/mcp/router.ts, gitnexus/src/mcp/router_legacy.ts',
        '// EXIT CONDITION: remove after router clients migrate',
        'export const value = 1;',
      ].join('\n'),
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'compat-file-canonical-path-multiple' }),
      ]),
    );
  });

  it('rejects newly added compatibility files when canonical path metadata is not a repo-relative path', async () => {
    const violations = await findCompatibilityMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/src/mcp/router-compat.ts' },
      ],
      async () => [
        '// CANONICAL PATH: stable MCP server path',
        '// DIRECT CUTOVER RISK: one CLI adapter still imports router-compat.ts and would break startup during direct cutover',
        '// EXIT CONDITION: remove after router clients migrate',
        '// CLEANUP TRACKING: remove in GNX-301 after final MCP client migration completes',
        'export const value = 1;',
      ].join('\n'),
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'compat-file-canonical-path-format' }),
      ]),
    );
  });

  it('rejects newly added compatibility files when exit condition metadata is still a placeholder', async () => {
    const violations = await findCompatibilityMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/src/mcp/router-compat.ts' },
      ],
      async () => [
        '// CANONICAL PATH: gitnexus/src/mcp/router.ts',
        '// EXIT CONDITION: TBD after rollout',
        'export const value = 1;',
      ].join('\n'),
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'compat-file-exit-condition-quality' }),
      ]),
    );
  });

  it('rejects newly added compatibility files when cleanup tracking metadata is still a placeholder', async () => {
    const violations = await findCompatibilityMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/src/mcp/router-compat.ts' },
      ],
      async () => [
        '// CANONICAL PATH: gitnexus/src/mcp/server.ts',
        '// DIRECT CUTOVER RISK: one CLI adapter still imports router-compat.ts and would break startup during direct cutover',
        '// EXIT CONDITION: remove after router clients migrate',
        '// CLEANUP TRACKING: TBD in later follow-up cleanup',
        'export const value = 1;',
      ].join('\n'),
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'compat-file-cleanup-tracking-quality' }),
      ]),
    );
  });

  it('rejects newly added compatibility files when cleanup tracking metadata lacks a milestone, issue, or task reference', async () => {
    const violations = await findCompatibilityMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/src/mcp/router-compat.ts' },
      ],
      async () => [
        '// CANONICAL PATH: gitnexus/src/mcp/server.ts',
        '// DIRECT CUTOVER RISK: one CLI adapter still imports router-compat.ts and would break startup during direct cutover',
        '// EXIT CONDITION: remove after router clients migrate',
        '// CLEANUP TRACKING: remove after final router migration validation closes',
        'export const value = 1;',
      ].join('\n'),
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'compat-file-cleanup-tracking-quality' }),
      ]),
    );
  });

  it('does not require metadata for modifications to pre-existing compatibility files', async () => {
    const violations = await findCompatibilityMetadataViolations(
      [
        { status: 'M', path: 'gitnexus/src/mcp/compatible-stdio-transport.ts' },
      ],
      async () => 'export const value = 1;\n',
    );

    expect(violations).toEqual([]);
  });
});

describe('repository governance temporary script metadata checks', () => {
  it('requires canonical path, purpose, cleanup tracking, and exit condition markers for newly added temporary migration or debug scripts', async () => {
    const violations = await findTemporaryScriptMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/scripts/migration-backfill-graph.mjs' },
        { status: 'A', path: 'gitnexus-web/scripts/debug-render-pane.mjs' },
      ],
      async () => 'console.log("hello");\n',
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'temp-script-canonical-path' }),
        expect.objectContaining({ rule: 'temp-script-purpose' }),
        expect.objectContaining({ rule: 'temp-script-cleanup-tracking' }),
        expect.objectContaining({ rule: 'temp-script-exit-condition' }),
      ]),
    );
  });

  it('accepts newly added temporary scripts when canonical path, purpose, cleanup tracking, and exit condition metadata is present', async () => {
    const violations = await findTemporaryScriptMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/scripts/migration-backfill-graph.mjs' },
      ],
      async () => [
        '// CANONICAL PATH: gitnexus/src/mcp/server.ts',
        '// PURPOSE: one-off graph backfill for migration validation in local forks',
        '// CLEANUP TRACKING: remove in GNX-241 after phase-4 backfill verification closes',
        '// EXIT CONDITION: delete after phase-4 backfill verification closes issue GNX-241',
        'console.log("hello");',
      ].join('\n'),
    );

    expect(violations).toEqual([]);
  });

  it('rejects newly added temporary scripts when canonical path metadata still points at a temporary path', async () => {
    const violations = await findTemporaryScriptMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/scripts/debug-kuzu-lock-trace.mjs' },
      ],
      async () => [
        '// CANONICAL PATH: gitnexus/scripts/debug-kuzu-lock-trace.mjs',
        '// PURPOSE: collect kuzu lock traces during MCP startup investigation',
        '// CLEANUP TRACKING: remove in GNX-302 after lock investigation closes',
        '// EXIT CONDITION: delete after GNX-302 confirms the lock repro is fixed',
        'console.log("hello");',
      ].join('\n'),
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'temp-script-canonical-path-target' }),
      ]),
    );
  });

  it('rejects newly added temporary scripts when canonical path metadata names multiple paths', async () => {
    const violations = await findTemporaryScriptMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/scripts/migration-backfill-graph.mjs' },
      ],
      async () => [
        '// CANONICAL PATH: gitnexus/src/mcp/server.ts, gitnexus/src/mcp/router.ts',
        '// PURPOSE: backfill graph rows for MCP migration verification',
        '// CLEANUP TRACKING: remove in GNX-241 after phase-4 backfill verification closes',
        '// EXIT CONDITION: delete after GNX-241 verifies the migrated graph output',
        'console.log("hello");',
      ].join('\n'),
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'temp-script-canonical-path-multiple' }),
      ]),
    );
  });

  it('rejects newly added temporary scripts when canonical path metadata is not a repo-relative path', async () => {
    const violations = await findTemporaryScriptMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/scripts/migration-backfill-graph.mjs' },
      ],
      async () => [
        '// CANONICAL PATH: stable MCP server path',
        '// PURPOSE: backfill graph rows for MCP migration verification',
        '// CLEANUP TRACKING: remove in GNX-241 after phase-4 backfill verification closes',
        '// EXIT CONDITION: delete after GNX-241 verifies the migrated graph output',
        'console.log("hello");',
      ].join('\n'),
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'temp-script-canonical-path-format' }),
      ]),
    );
  });

  it('rejects placeholder purpose metadata for newly added temporary scripts', async () => {
    const violations = await findTemporaryScriptMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/scripts/debug-kuzu-lock-trace.mjs' },
      ],
      async () => [
        '// CANONICAL PATH: gitnexus/src/mcp/server.ts',
        '// PURPOSE: temporary helper',
        '// CLEANUP TRACKING: remove in GNX-302 after lock investigation closes',
        '// EXIT CONDITION: delete after GNX-302 confirms the lock repro is fixed',
        'console.log("hello");',
      ].join('\n'),
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'temp-script-purpose-quality' }),
      ]),
    );
  });

  it('rejects placeholder exit condition metadata for newly added temporary scripts', async () => {
    const violations = await findTemporaryScriptMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/scripts/debug-cutover-trace.mjs' },
      ],
      async () => [
        '// CANONICAL PATH: gitnexus/src/mcp/server.ts',
        '// PURPOSE: collect cutover traces during MCP routing migration',
        '// CLEANUP TRACKING: remove in GNX-303 after routing investigation closes',
        '// EXIT CONDITION: TBD after rollout',
        'console.log("hello");',
      ].join('\n'),
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'temp-script-exit-condition-quality' }),
      ]),
    );
  });

  it('rejects placeholder cleanup tracking metadata for newly added temporary scripts', async () => {
    const violations = await findTemporaryScriptMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/scripts/migration-backfill-graph.mjs' },
      ],
      async () => [
        '// CANONICAL PATH: gitnexus/src/mcp/server.ts',
        '// PURPOSE: backfill graph rows for MCP migration verification',
        '// CLEANUP TRACKING: TBD in later cleanup',
        '// EXIT CONDITION: delete after GNX-241 verifies the migrated graph output',
        'console.log("hello");',
      ].join('\n'),
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'temp-script-cleanup-tracking-quality' }),
      ]),
    );
  });

  it('rejects temporary script cleanup tracking metadata without a milestone, issue, or task reference', async () => {
    const violations = await findTemporaryScriptMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/scripts/migration-backfill-graph.mjs' },
      ],
      async () => [
        '// CANONICAL PATH: gitnexus/src/mcp/server.ts',
        '// PURPOSE: backfill graph rows for MCP migration verification',
        '// CLEANUP TRACKING: remove after backfill verification closes',
        '// EXIT CONDITION: delete after GNX-241 verifies the migrated graph output',
        'console.log("hello");',
      ].join('\n'),
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'temp-script-cleanup-tracking-quality' }),
      ]),
    );
  });

  it('rejects newly added temporary scripts whose filename is only a generic temporary label', async () => {
    const violations = await findTemporaryScriptMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/scripts/debug.mjs' },
        { status: 'A', path: 'gitnexus-web/scripts/migration-cutover.sh' },
      ],
      async () => [
        '# CANONICAL PATH: gitnexus/src/mcp/server.ts',
        '# PURPOSE: collect focused cutover logs for the worker-bundle investigation',
        '# CLEANUP TRACKING: remove in GNX-241 after the migration verification closes',
        '# EXIT CONDITION: delete after issue GNX-241 closes',
        'echo hello',
      ].join('\n'),
    );

    expect(violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rule: 'temp-script-name-specificity', path: 'gitnexus/scripts/debug.mjs' }),
        expect.objectContaining({ rule: 'temp-script-name-specificity', path: 'gitnexus-web/scripts/migration-cutover.sh' }),
      ]),
    );
  });

  it('accepts newly added temporary scripts whose filename includes a concrete purpose token', async () => {
    const violations = await findTemporaryScriptMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/scripts/debug-kuzu-lock-trace.mjs' },
        { status: 'A', path: 'gitnexus-web/scripts/migration-worker-bundle-cutover.sh' },
      ],
      async () => [
        '# CANONICAL PATH: gitnexus/src/mcp/server.ts',
        '# PURPOSE: capture kuzu lock traces and worker bundle cutover evidence for the active migration review',
        '# CLEANUP TRACKING: remove in GNX-241 after the migration verification closes',
        '# EXIT CONDITION: delete after issue GNX-241 closes',
        'echo hello',
      ].join('\n'),
    );

    expect(violations).toEqual([]);
  });

  it('ignores regular permanent scripts that do not look temporary', async () => {
    const violations = await findTemporaryScriptMetadataViolations(
      [
        { status: 'A', path: 'gitnexus/scripts/ci/check-release.mjs' },
      ],
      async () => 'console.log("hello");\n',
    );

    expect(violations).toEqual([]);
  });
});
