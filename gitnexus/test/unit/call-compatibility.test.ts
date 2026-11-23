import { describe, expect, it, vi } from 'vitest';
import type {
  CallCompatibilityProvider,
  CallCompatibilityTarget,
} from '../../src/core/ingestion/call-compatibility.js';
import { checkCallCompatibility } from '../../src/core/analysis/call-compatibility.js';

// These orchestration semantics used to be covered through the detect_changes
// backend with module spies on the Python checker (hunk-scale :280/:484). The
// check now runs in a worker thread, where main-thread spies are invisible by
// design, so the semantics are pinned directly against checkCallCompatibility.

const target = (id: string, filePath: string): CallCompatibilityTarget => ({
  id,
  name: id.split(':').pop() ?? id,
  type: 'Function',
  filePath,
});

const fakeProvider = (check: CallCompatibilityProvider['check']): CallCompatibilityProvider => ({
  acceptsTarget: () => true,
  relationTypes: ['CALLS'],
  check,
});

const finding = {
  target: 'Function:a.ts:run',
  name: 'run',
  keyword: 'stale',
  filePath: 'use-a.ts',
  line: 2,
};

describe('checkCallCompatibility group orchestration', () => {
  it('keeps a healthy checker\u2019s findings when a different checker fails', async () => {
    const onError = vi.fn();
    const healthy = fakeProvider(async () => ({
      findings: [finding],
      complete: true,
      skipped: [],
    }));
    const failing = fakeProvider(async () => {
      throw new Error('boom');
    });
    const report = await checkCallCompatibility(
      'unused-graph',
      { directory: '.', scope: 'all', base: undefined, files: [] },
      new Map([
        [healthy, [target('Function:a.ts:run', 'a.ts')]],
        [failing, [target('Function:b.rb:load', 'b.rb')]],
      ]),
      onError,
    );
    expect(report.findings).toEqual([finding]);
    expect(report.complete).toBe(false);
    expect(report.skipped).toEqual([{ reason: 'signature-check-failed' }]);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith('detect-changes:call-compatibility', expect.any(Error));
  });

  it('reports a failed check without claiming any caller is safe', async () => {
    const onError = vi.fn();
    const failing = fakeProvider(async () => {
      throw new Error('fixture');
    });
    const report = await checkCallCompatibility(
      'unused-graph',
      { directory: '.', scope: 'all', base: undefined, files: [] },
      new Map([[failing, [target('Function:model.py:charge', 'model.py')]]]),
      onError,
    );
    expect(report).toEqual({
      findings: [],
      complete: false,
      skipped: [{ reason: 'signature-check-failed' }],
    });
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
