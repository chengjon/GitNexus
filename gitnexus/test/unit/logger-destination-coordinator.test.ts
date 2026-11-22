/**
 * Unit tests for the analyze progress-bar log coordinator in
 * src/core/logger.ts.
 *
 * The analyze progress bar renders on stderr and so does the logger, so a
 * record emitted while the bar is up would splice onto the bar line. The
 * coordinator lets a host (cli/analyze.ts) intercept every record, clear the
 * bar line, write the record on its own line, and redraw the bar.
 *
 * These tests assert the wiring:
 *   - a registered coordinator receives NDJSON records and stderr is bypassed
 *   - unregistering restores the direct stderr destination
 *   - writeCoordinatedStderr line-buffers partial chunks
 *   - writeCoordinatedStderr writes straight to stderr with no coordinator
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  createLogger,
  flushCoordinatedStderr,
  flushLoggerSync,
  setLogDestinationCoordinator,
  writeCoordinatedStderr,
} from '../../src/core/logger.js';

afterEach(() => {
  setLogDestinationCoordinator(undefined);
  vi.restoreAllMocks();
});

describe('setLogDestinationCoordinator — record routing', () => {
  it('routes records through the coordinator instead of the stderr destination', () => {
    const records: string[] = [];
    setLogDestinationCoordinator((record) => records.push(record));

    const log = createLogger('test-coordinator');
    log.info('hello');

    expect(records).toHaveLength(1);
    expect(records[0]).toContain('"hello"');
    expect(records[0].endsWith('\n')).toBe(true);
  });

  it('writes a complete NDJSON line per record', () => {
    const records: string[] = [];
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    setLogDestinationCoordinator((record) => records.push(record));

    const log = createLogger('test-coordinator-lines');
    log.warn('one');
    log.error('two');

    expect(records).toHaveLength(2);
    for (const record of records) {
      const lines = record.split('\n').filter((line) => line.length > 0);
      expect(lines).toHaveLength(1);
      expect(() => JSON.parse(lines[0])).not.toThrow();
    }
    expect(records[0]).toContain('"msg":"one"');
    expect(records[1]).toContain('"msg":"two"');
  });

  it('stops routing records to the coordinator once unregistered', () => {
    const records: string[] = [];
    setLogDestinationCoordinator((record) => records.push(record));
    setLogDestinationCoordinator(undefined);

    const log = createLogger('test-coordinator-restore');
    log.info('after-restore');
    flushLoggerSync();

    expect(records).toHaveLength(0);
  });
});

describe('writeCoordinatedStderr — line buffering', () => {
  it('buffers a partial line and flushes complete lines as they arrive', () => {
    const lines: string[] = [];
    setLogDestinationCoordinator((record) => lines.push(record));

    writeCoordinatedStderr('abc');
    expect(lines).toHaveLength(0);

    writeCoordinatedStderr('def\n');
    expect(lines).toEqual(['abcdef\n']);
  });

  it('flushes a trailing partial line via flushCoordinatedStderr', () => {
    const lines: string[] = [];
    setLogDestinationCoordinator((record) => lines.push(record));

    writeCoordinatedStderr('tail');
    expect(lines).toHaveLength(0);

    flushCoordinatedStderr();
    expect(lines).toEqual(['tail\n']);
  });

  it('appends a newline when none is present', () => {
    const lines: string[] = [];
    setLogDestinationCoordinator((record) => lines.push(record));

    writeCoordinatedStderr('no-newline');
    flushCoordinatedStderr();
    expect(lines).toEqual(['no-newline\n']);
  });

  it('writes straight to stderr, byte-for-byte, when no coordinator is registered', () => {
    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    writeCoordinatedStderr('direct\n');

    expect(stderrSpy).toHaveBeenCalledWith('direct\n');
  });
});
