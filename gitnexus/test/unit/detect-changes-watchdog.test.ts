/**
 * ELAPSED×CPU watchdog for `gitnexus detect-changes` (factor-pool runaway).
 *
 * The 2026-11-23 incident left a detect-changes process burning one core for
 * 9+ hours with no signal whatsoever: no error, no output, just 99.9% user-mode
 * CPU. Worker isolation (60s timeout) bounds the signature check itself, but
 * any *other* phase could still wedge the same way. This watchdog is the
 * runtime half of the alarm: sample the process's CPU against wall clock, and
 * once elapsed time passes a floor and CPU time tracks wall time too closely
 * (the signature of a pure user-mode spin), print one stderr warning so a
 * runaway becomes visible in logs instead of silent.
 *
 * All timing inputs are injected, so the tests drive samples by hand instead
 * of waiting on real timers. The sampler lives in a dedicated worker thread
 * (`detect-changes-watchdog-worker.ts`): a CPU runaway blocks the MAIN
 * thread's event loop, so a main-thread timer could never fire during the
 * exact incident this exists for — a worker keeps its own loop running and
 * writes to the process-wide stderr fd no matter how starved the main thread
 * is. These tests exercise the decision logic in-process.
 */
import { describe, expect, it, vi } from 'vitest';
import { runWatchdogSampler } from '../../src/cli/detect-changes-watchdog-worker.js';
import { detectChangesWatchdogOptionsFromEnv } from '../../src/cli/detect-changes-watchdog.js';

describe('detect-changes watchdog sampler', () => {
  it('warns once with elapsed time and CPU percent after sustained high CPU past the minimum elapsed', () => {
    const sink = vi.fn();
    let tick: (() => void) | undefined;
    let nowMs = 0;
    let cpuMicros = 0;
    const watchdog = runWatchdogSampler({
      intervalMs: 1000,
      minElapsedMs: 60_000,
      cpuThreshold: 0.9,
      sink,
      now: () => nowMs,
      cpuUsage: () => ({ user: cpuMicros, system: 0 }),
      schedule: (fn, intervalMs) => {
        tick = fn;
        expect(intervalMs).toBe(1000);
        return () => {
          tick = undefined;
        };
      },
    });

    // First tick establishes the baseline sample; 100% CPU but only 1s elapsed.
    nowMs = 1_000;
    cpuMicros = 1_000_000;
    tick?.();
    expect(sink).not.toHaveBeenCalled();

    // Sustained 100% of one core for 61s: cpuDelta ≈ wallDelta.
    nowMs = 61_000;
    cpuMicros = 61_000_000;
    tick?.();

    expect(sink).toHaveBeenCalledTimes(1);
    const line = sink.mock.calls[0]?.[0] as string;
    expect(line).toContain('61s');
    expect(line).toContain('100%');
    expect(line).toMatch(/pid=\d+/);

    // Still spinning a second later: no second warning.
    nowMs = 62_000;
    cpuMicros = 62_000_000;
    tick?.();
    expect(sink).toHaveBeenCalledTimes(1);

    watchdog.stop();
  });

  it('stays quiet while CPU time stays below the threshold fraction of wall time', () => {
    const sink = vi.fn();
    let tick: (() => void) | undefined;
    let nowMs = 0;
    let cpuMicros = 0;
    const watchdog = runWatchdogSampler({
      intervalMs: 1000,
      minElapsedMs: 60_000,
      cpuThreshold: 0.9,
      sink,
      now: () => nowMs,
      cpuUsage: () => ({ user: cpuMicros, system: 0 }),
      schedule: (fn) => {
        tick = fn;
        return () => {
          tick = undefined;
        };
      },
    });

    // 61s elapsed but only 10% of one core used — healthy, no alarm.
    nowMs = 61_000;
    cpuMicros = 6_100_000;
    tick?.();
    // Two minutes in, still ~10%: still quiet.
    nowMs = 120_000;
    cpuMicros = 12_000_000;
    tick?.();

    expect(sink).not.toHaveBeenCalled();
    watchdog.stop();
  });

  it('stays quiet before the minimum elapsed even at full CPU, then alarms after it', () => {
    const sink = vi.fn();
    let tick: (() => void) | undefined;
    let nowMs = 0;
    let cpuMicros = 0;
    const watchdog = runWatchdogSampler({
      intervalMs: 1000,
      minElapsedMs: 60_000,
      cpuThreshold: 0.9,
      sink,
      now: () => nowMs,
      cpuUsage: () => ({ user: cpuMicros, system: 0 }),
      schedule: (fn) => {
        tick = fn;
        return () => {
          tick = undefined;
        };
      },
    });

    // 5s of 100% CPU: below the elapsed floor, no alarm yet.
    nowMs = 5_000;
    cpuMicros = 5_000_000;
    tick?.();
    expect(sink).not.toHaveBeenCalled();

    // Past the floor with the same saturation: alarms now (the floor gates the
    // first alarm; it does not latch suppression forever).
    nowMs = 61_000;
    cpuMicros = 61_000_000;
    tick?.();
    expect(sink).toHaveBeenCalledTimes(1);

    watchdog.stop();
  });

  it('stop() cancels the sampler and silences further ticks', () => {
    const sink = vi.fn();
    let tick: (() => void) | undefined;
    let cancels = 0;
    let nowMs = 0;
    let cpuMicros = 0;
    const watchdog = runWatchdogSampler({
      intervalMs: 1000,
      minElapsedMs: 60_000,
      cpuThreshold: 0.9,
      sink,
      now: () => nowMs,
      cpuUsage: () => ({ user: cpuMicros, system: 0 }),
      schedule: (fn) => {
        tick = fn;
        return () => {
          cancels += 1;
          tick = undefined;
        };
      },
    });

    watchdog.stop();
    expect(cancels).toBe(1);

    // A late tick after stop (timer already cleared) must not alarm.
    nowMs = 120_000;
    cpuMicros = 120_000_000;
    tick?.();
    expect(sink).not.toHaveBeenCalled();

    // stop() is idempotent.
    watchdog.stop();
    expect(cancels).toBe(1);
  });

  it('ignores a zero-width sample instead of dividing by zero', () => {
    const sink = vi.fn();
    let tick: (() => void) | undefined;
    const watchdog = runWatchdogSampler({
      intervalMs: 1000,
      minElapsedMs: 0,
      cpuThreshold: 0.9,
      sink,
      now: () => 42_000,
      cpuUsage: () => ({ user: 42_000_000, system: 0 }),
      schedule: (fn) => {
        tick = fn;
        return () => {
          tick = undefined;
        };
      },
    });

    tick?.();
    expect(sink).not.toHaveBeenCalled();

    watchdog.stop();
  });

  it('counts user and system CPU time together', () => {
    const sink = vi.fn();
    let tick: (() => void) | undefined;
    let nowMs = 0;
    let usage = { user: 0, system: 0 };
    const watchdog = runWatchdogSampler({
      intervalMs: 1000,
      minElapsedMs: 60_000,
      cpuThreshold: 0.9,
      sink,
      now: () => nowMs,
      cpuUsage: () => usage,
      schedule: (fn) => {
        tick = fn;
        return () => {
          tick = undefined;
        };
      },
    });

    // 61s wall, 50s user + 15s system = 65s CPU > 100% of one core (multi-thread).
    nowMs = 61_000;
    usage = { user: 50_000_000, system: 15_000_000 };
    tick?.();

    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink.mock.calls[0]?.[0]).toContain('107%');

    watchdog.stop();
  });
});

describe('detectChangesWatchdogOptionsFromEnv', () => {
  it('returns the defaults for an empty environment', () => {
    expect(detectChangesWatchdogOptionsFromEnv({})).toEqual({
      intervalMs: 5000,
      cpuThreshold: 0.9,
      minElapsedMs: 60_000,
    });
  });

  it('returns null when the watchdog is switched off', () => {
    expect(
      detectChangesWatchdogOptionsFromEnv({ GITNEXUS_DETECT_CHANGES_WATCHDOG: 'off' }),
    ).toBeNull();
    expect(
      detectChangesWatchdogOptionsFromEnv({ GITNEXUS_DETECT_CHANGES_WATCHDOG: 'false' }),
    ).toBeNull();
    expect(
      detectChangesWatchdogOptionsFromEnv({ GITNEXUS_DETECT_CHANGES_WATCHDOG: '0' }),
    ).toBeNull();
  });

  it('parses valid overrides and falls back to defaults for invalid ones', () => {
    expect(
      detectChangesWatchdogOptionsFromEnv({
        GITNEXUS_DETECT_CHANGES_WATCHDOG_INTERVAL_MS: '250',
        GITNEXUS_DETECT_CHANGES_WATCHDOG_MIN_ELAPSED_MS: '1000',
        GITNEXUS_DETECT_CHANGES_WATCHDOG_CPU: '0.5',
      }),
    ).toEqual({ intervalMs: 250, cpuThreshold: 0.5, minElapsedMs: 1000 });

    // A diagnostics knob must never crash the CLI: any malformed value quietly
    // falls back to its default.
    expect(
      detectChangesWatchdogOptionsFromEnv({
        GITNEXUS_DETECT_CHANGES_WATCHDOG_INTERVAL_MS: 'abc',
        GITNEXUS_DETECT_CHANGES_WATCHDOG_MIN_ELAPSED_MS: '-5',
        GITNEXUS_DETECT_CHANGES_WATCHDOG_CPU: '1.5',
      }),
    ).toEqual({ intervalMs: 5000, cpuThreshold: 0.9, minElapsedMs: 60_000 });

    // cpu=1 (exactly one core) is valid; interval 0 would spin, so it falls back.
    expect(
      detectChangesWatchdogOptionsFromEnv({
        GITNEXUS_DETECT_CHANGES_WATCHDOG_CPU: '1',
        GITNEXUS_DETECT_CHANGES_WATCHDOG_INTERVAL_MS: '0',
      }),
    ).toEqual({ intervalMs: 5000, cpuThreshold: 1, minElapsedMs: 60_000 });
  });
});
