import { describe, expect, it, vi } from 'vitest';

import {
  createAnalyzeBarLogger,
  createAnalyzeInterruptHandler,
  createAnalyzeProgressTracker,
} from '../../src/cli/analyze-session.js';

describe('analyze session helpers', () => {
  it('clears the bar line and forwards joined console output through the original logger', () => {
    const write = vi.fn();
    const log = vi.fn();
    const barLog = createAnalyzeBarLogger({
      clearLine: () => {
        write('\x1b[2K\r');
      },
      log,
    });

    barLog('hello', 42, { ok: true });

    expect(write).toHaveBeenCalledWith('\x1b[2K\r');
    expect(log).toHaveBeenCalledWith('hello 42 [object Object]');
  });

  it('tracks elapsed seconds per phase without flickering', () => {
    const update = vi.fn();
    let now = 0;
    const tracker = createAnalyzeProgressTracker({
      update,
      now: () => now,
    });

    tracker.updateBar(10, 'Parsing code');
    expect(update).toHaveBeenLastCalledWith(10, { phase: 'Parsing code' });

    now = 2400;
    tracker.tickElapsed();
    expect(update).toHaveBeenCalledTimes(1);

    now = 3100;
    tracker.tickElapsed();
    expect(update).toHaveBeenLastCalledWith({ phase: 'Parsing code (3s)' });

    now = 4000;
    tracker.updateBar(20, 'Loading into KuzuDB');
    expect(update).toHaveBeenLastCalledWith(20, { phase: 'Loading into KuzuDB' });

    now = 8000;
    tracker.tickElapsed();
    expect(update).toHaveBeenLastCalledWith({ phase: 'Loading into KuzuDB (4s)' });
  });

  it('starts graceful cleanup on first interrupt and force-exits on the second', async () => {
    const stop = vi.fn();
    const log = vi.fn();
    const closeKuzu = vi.fn(async () => undefined);
    const removeReindexLock = vi.fn(async () => undefined);
    const runCleanupAndExit = vi.fn(async (_code: number, options: any) => {
      await options.cleanup();
      await options.scheduleExit(_code);
    });
    const scheduleExit = vi.fn();
    const processExit = vi.fn();

    const handleInterrupt = createAnalyzeInterruptHandler({
      stopBar: stop,
      log,
      closeKuzu,
      removeReindexLock,
      reindexLockPath: '/tmp/repo/.gitnexus/reindexing.lock',
      runCleanupAndExit,
      scheduleExit,
      processExit,
    });

    await handleInterrupt(130);

    expect(stop).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith('\n  Interrupted — cleaning up...');
    expect(closeKuzu).toHaveBeenCalledTimes(1);
    expect(removeReindexLock).toHaveBeenCalledWith('/tmp/repo/.gitnexus/reindexing.lock');
    expect(runCleanupAndExit).toHaveBeenCalledTimes(1);
    expect(scheduleExit).toHaveBeenCalledWith(130);
    expect(processExit).not.toHaveBeenCalled();

    await handleInterrupt(130);
    expect(processExit).toHaveBeenCalledWith(1);
  });
});
