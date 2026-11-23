/**
 * Locks the multipart coverage work-file format — the guard against V8's `Invalid string length`.
 *
 * The 2026-11-24 scenario-map Plan run merged four coverage slices into one work file worth
 * ~1.2GB of JSON. `writeJson` builds the whole document as ONE string first, and V8 caps a
 * string at ~512M code units, so the write died with `Invalid string length` before anything
 * hit disk. The fix splits `tests[]` — the only array that grows with the repo's test count —
 * into bounded part files beside the head; the reader reassembles the same in-memory object.
 *
 * The tests drive the real threshold: the giant fixture below serializes to ~545MB, past the
 * ~512M-char limit, so a one-shot writer cannot pass them.
 */
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  WORK_FILE_SCHEMA_VERSION,
  readWorkFile,
  writeWorkFile,
  type CoverageTest,
  type CoverageWorkFile,
} from '../../../tools/scenario-map/path-coverage/run-coverage.js';

const dirs: string[] = [];

const openWorkFile = (): string => {
  const dir = mkdtempSync(path.join(tmpdir(), 'gitnexus-work-file-'));
  dirs.push(dir);
  return path.join(dir, 'coverage.json');
};

const workOf = (tests: CoverageTest[]): CoverageWorkFile => ({
  schemaVersion: WORK_FILE_SCHEMA_VERSION,
  fixtureCaptureVersion: 2,
  mode: 'normal',
  extraRoots: [],
  repeats: 0,
  blocks: ['gitnexus/src/a.ts#fn@1', 'gitnexus/src/a.ts#fn@1|1-9:1'],
  files: [
    {
      file: 'test/unit/a.test.ts',
      recorded: true,
      errors: [],
      unattributed: {
        known: false,
        executedFiles: [],
        nativeEntries: [],
        workerSpawns: [],
        excludedCandidates: [],
      },
    },
  ],
  tests,
  unhandledErrors: [],
});

const testOf = (index: number, executedFiles: string[]): CoverageTest => ({
  id: `test-${index}`,
  taskId: `task-${index}`,
  file: 'test/unit/a.test.ts',
  fullName: `a > case ${index}`,
  location: { line: 1, column: 1 },
  state: 'passed',
  concurrent: false,
  attempts: 1,
  blocks: [0],
  suiteBlocks: [],
  provenance: {
    known: true,
    executedFiles,
    nativeEntries: [],
    workerSpawns: [],
    excludedCandidates: [],
  },
});

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('coverage work file (multipart)', () => {
  it('writes a full-scale work file as bounded parts and reads it back', () => {
    const file = openWorkFile();
    // One shared 9KB string per test's provenance: ~545MB of compact JSON across 60k tests,
    // while the fixture itself stays small (the strings alias one instance).
    const huge = 'x'.repeat(9_000);
    const tests = Array.from({ length: 60_000 }, (_, index) => testOf(index, [huge]));
    const work = workOf(tests);

    writeWorkFile(file, work);

    const head = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
    expect(head.testParts).toBe(6);
    expect(head.testCount).toBe(60_000);
    expect(head).not.toHaveProperty('tests');
    const parts = readdirSync(path.dirname(file)).filter((name) =>
      /^coverage\.tests-\d+\.json$/.test(name),
    );
    expect(parts.sort()).toEqual(
      Array.from({ length: 6 }, (_, part) => `coverage.tests-${part}.json`),
    );
    for (const part of parts) {
      // Each part must serialize well under the ~512M-char string limit it will be parsed in.
      expect(statSync(path.join(path.dirname(file), part)).size).toBeLessThan(512 * 1024 * 1024);
    }

    const round = readWorkFile(file);
    expect(round.schemaVersion).toBe(WORK_FILE_SCHEMA_VERSION);
    expect(round).not.toHaveProperty('testParts');
    expect(round).not.toHaveProperty('testCount');
    expect(round.blocks).toEqual(work.blocks);
    expect(round.files).toEqual(work.files);
    expect(round.tests).toHaveLength(60_000);
    expect(round.tests[0]).toEqual(tests[0]);
    expect(round.tests[29_999]).toEqual(tests[29_999]);
    expect(round.tests[59_999]).toEqual(tests[59_999]);
  }, 300_000);

  it('a small work file takes a single part', () => {
    const file = openWorkFile();
    const work = workOf([testOf(0, ['gitnexus/src/a.ts']), testOf(1, ['gitnexus/src/b.ts'])]);

    writeWorkFile(file, work);

    const head = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
    expect(head.testParts).toBe(1);
    expect(head.testCount).toBe(2);
    const round = readWorkFile(file);
    expect(round.tests).toEqual(work.tests);
    expect(round.blocks).toEqual(work.blocks);
    expect(round.files).toEqual(work.files);
    expect(round.unhandledErrors).toEqual([]);
  });

  it('still reads a legacy single-file work file', () => {
    const file = openWorkFile();
    const work = workOf([testOf(0, ['gitnexus/src/a.ts'])]);
    writeFileSync(file, JSON.stringify(work));

    const round = readWorkFile(file);

    expect(round).toEqual(work);
  });

  it('rejects a wrong schema version', () => {
    const file = openWorkFile();
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, JSON.stringify({ ...workOf([]), schemaVersion: 99 }));

    expect(() => readWorkFile(file)).toThrow(/is not a version 1 work file/);
  });
});
