/**
 * Unit tests for the analyze progress-bar output coordination in
 * src/core/logger.ts.
 *
 * The analyze progress bar renders on stderr and so do logger records and raw
 * operator output, so text emitted while the bar is up would splice onto the
 * bar line. `cli/analyze.ts` installs a host sink for structured records and a
 * stderr coordinator for raw text; both clear the bar line, write on their own
 * line, and redraw the bar.
 *
 * These tests assert the wiring:
 *   - `configureLoggerSink` receives NDJSON records and bypasses stderr
 *   - restoring the sink stops routing records to it
 *   - `writeCoordinatedStderr` line-buffers partial chunks
 *   - `writeCoordinatedStderr` writes straight to stderr with no coordinator
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  MemoryWritable,
  configureLoggerSink,
  createLogger,
  flushCoordinatedStderr,
  setStderrCoordinator,
  writeCoordinatedStderr,
} from '../../src/core/logger.js';

let restoreSink: (() => void) | undefined;

afterEach(() => {
  restoreSink?.();
  restoreSink = undefined;
  setStderrCoordinator(undefined);
  vi.restoreAllMocks();
});

describe('configureLoggerSink — progress-bar destination', () => {
  it('routes records to the host sink instead of the stderr destination', () => {
    const sink = new MemoryWritable();
    restoreSink = configureLoggerSink({ destination: sink });

    const log = createLogger('test-coordinator');
    log.info('hello');

    const records = sink.records();
    expect(records).toHaveLength(1);
    expect(records[0].msg).toBe('hello');
  });

  it('writes a complete NDJSON line per record', () => {
    const sink = new MemoryWritable();
    restoreSink = configureLoggerSink({ destination: sink });

    const log = createLogger('test-coordinator-lines');
    log.warn('one');
    log.error('two');

    expect(sink.records().map((record) => record.msg)).toEqual(['one', 'two']);
    for (const line of sink
      .text()
      .split('\n')
      .filter((line) => line.length > 0)) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });

  it('stops routing records to the sink once restored', () => {
    const sink = new MemoryWritable();
    restoreSink = configureLoggerSink({ destination: sink });
    restoreSink();
    restoreSink = undefined;

    createLogger('test-coordinator-restore').info('after-restore');

    expect(sink.records()).toHaveLength(0);
  });
});

describe('writeCoordinatedStderr — line buffering', () => {
  it('buffers a partial line and flushes complete lines as they arrive', () => {
    const lines: string[] = [];
    setStderrCoordinator((line) => lines.push(line));

    writeCoordinatedStderr('abc');
    expect(lines).toHaveLength(0);

    writeCoordinatedStderr('def\n');
    expect(lines).toEqual(['abcdef\n']);
  });

  it('flushes a trailing partial line via flushCoordinatedStderr', () => {
    const lines: string[] = [];
    setStderrCoordinator((line) => lines.push(line));

    writeCoordinatedStderr('tail');
    expect(lines).toHaveLength(0);

    flushCoordinatedStderr();
    expect(lines).toEqual(['tail\n']);
  });

  it('appends a newline when none is present', () => {
    const lines: string[] = [];
    setStderrCoordinator((line) => lines.push(line));

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
