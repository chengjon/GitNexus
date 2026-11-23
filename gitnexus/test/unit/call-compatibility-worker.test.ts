import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { checkCallCompatibilityInWorker } from '../../src/core/analysis/call-compatibility-worker.js';
import { getProviderForFile } from '../../src/core/ingestion/languages/index.js';
import { executeParameterized } from '../../src/core/lbug/pool-adapter.js';
import { commitAll, initGitRepo } from '../helpers/temp-git-repo.js';

// Caller queries stay on the main thread (the worker never opens LBUG), so the
// database boundary is mockable here while the compatibility check itself runs
// in a real isolated worker.
vi.mock('../../src/core/lbug/pool-adapter.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/core/lbug/pool-adapter.js')>()),
  executeParameterized: vi.fn(),
}));

const capability = getProviderForFile('model.py')?.callCompatibility;
if (!capability) throw new Error('Missing named-argument compatibility provider');

let dir: string;
const target = {
  id: 'Class:model.py:Invoice',
  name: 'Invoice',
  type: 'Class',
  filePath: 'model.py',
};
const writeModel = (params: string) =>
  fs.writeFile(
    path.join(dir, 'model.py'),
    `class Invoice:\n    def __init__(self${params}):\n        pass\n`,
  );
const writeUse = () =>
  fs.writeFile(
    path.join(dir, 'use.py'),
    'from model import Invoice as Bill\nfrom elsewhere import Invoice\ndef build():\n    Invoice(legacy=True)\n    return Bill(legacy=True)\n',
  );

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'gn-keyword-worker-'));
  initGitRepo(dir);
  await writeModel(', *, legacy: bool = True');
  await writeUse();
  commitAll(dir, 'original signature');
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

const check = (onError: (context: string, error: unknown) => void, timeoutMs?: number) =>
  checkCallCompatibilityInWorker(
    'unused-graph-path',
    {
      directory: dir,
      scope: 'all',
      base: undefined,
      files: [{ filePath: 'model.py', oldFilePath: 'model.py' }],
    },
    new Map([[capability, [target]]]),
    onError,
    undefined,
    timeoutMs,
  );

it('returns findings from an isolated worker with main-thread caller queries', async () => {
  await writeModel('');
  vi.mocked(executeParameterized).mockResolvedValue([
    { target: target.id, filePath: 'use.py', relationType: 'CALLS' },
  ]);
  const onError = vi.fn();

  const result = await check(onError);

  expect(result).toMatchObject({
    complete: true,
    findings: [
      { target: target.id, name: 'Invoice', filePath: 'use.py', line: 5, keyword: 'legacy' },
    ],
  });
  expect(onError).not.toHaveBeenCalled();
});

it('falls back to an incomplete report when the worker exceeds the timeout', async () => {
  await writeModel('');
  vi.mocked(executeParameterized).mockImplementation(() => new Promise(() => {}));
  const onError = vi.fn();

  const result = await check(onError, 500);

  expect(result).toEqual({
    findings: [],
    complete: false,
    skipped: [{ reason: 'signature-check-timed-out' }],
  });
});

it('degrades to caller-query-failed when the main-side caller query fails', async () => {
  await writeModel('');
  vi.mocked(executeParameterized).mockRejectedValue(new Error('lbug down'));
  const onError = vi.fn();

  const result = await check(onError);

  expect(result).toEqual({
    findings: [],
    complete: false,
    skipped: [{ reason: 'caller-query-failed' }],
  });
  expect(onError).toHaveBeenCalledWith('detect-changes:callers', expect.any(Error));
});
