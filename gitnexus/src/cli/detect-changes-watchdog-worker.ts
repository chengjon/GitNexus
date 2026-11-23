/**
 * Worker entry + sampler decision logic for the detect-changes watchdog.
 *
 * WHY A WORKER: the alarm's target scenario is the main thread spinning in
 * pure user mode (the factor-pool incident — 9h at 100% CPU, zero output).
 * A CPU-spinning main thread never turns its event loop, so a timer-based
 * watchdog ON the main thread can never fire during the incident it exists
 * for. A worker thread has its own loop: it keeps sampling the process-wide
 * CPU (process.cpuUsage covers the whole process from any thread) and writes
 * the warning straight to the process-wide stderr fd, both unaffected by
 * main-thread starvation.
 *
 * `runWatchdogSampler` is the injectable decision loop, exported so unit
 * tests can drive samples by hand. The bottom of the file is the entry: when
 * spawned by `startDetectChangesWatchdog` it reads workerData knobs, warns
 * once, then takes its thread down (process.exit inside a worker ends only
 * that thread). The main side never terminates this worker on the graceful
 * path — the SIGABRT lesson from call-compatibility-worker applies here too,
 * and this worker loads no native modules besides.
 */
import { writeSync } from 'node:fs';
import process from 'node:process';
import { parentPort, workerData } from 'node:worker_threads';

export interface WatchdogSamplerOptions {
  /** How often to sample CPU vs wall clock (ms). */
  intervalMs?: number;
  /** Alarm when cpuDelta/wallDelta reaches this fraction of one core. */
  cpuThreshold?: number;
  /** No alarm before this much wall time has elapsed (ms). */
  minElapsedMs?: number;
  /** Where the warning line goes. Default process.stderr.write. */
  sink?: (line: string) => void;
  /** Wall clock in ms. Default Date.now. */
  now?: () => number;
  /** CPU time in microseconds (process-wide). Default process.cpuUsage. */
  cpuUsage?: () => NodeJS.CpuUsage;
  /**
   * Arms the periodic sampler; returns its cancel function. Default
   * setInterval (unref'd — inside the worker the loop would otherwise stay
   * alive forever, pinning the CLI's exit only when stop is missed).
   */
  schedule?: (sample: () => void, intervalMs: number) => () => void;
  /** Poll: abandon the sampler once this returns true. Default never. */
  shouldStop?: () => boolean;
  /** Hook after the one warning is emitted (worker entry exits there). */
  onWarn?: () => void;
}

const DEFAULT_INTERVAL_MS = 5000;
const DEFAULT_CPU_THRESHOLD = 0.9;
const DEFAULT_MIN_ELAPSED_MS = 60_000;

function defaultSchedule(sample: () => void, intervalMs: number): () => void {
  const timer = setInterval(sample, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}

/**
 * Start sampling; returns a stop handle. Emits at most one warning line:
 * `gitnexus detect-changes watchdog: pid=<pid> <N>s elapsed at <P>% of one
 * core — possible runaway CPU loop`.
 */
export function runWatchdogSampler(options: WatchdogSamplerOptions = {}): { stop(): void } {
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const cpuThreshold = options.cpuThreshold ?? DEFAULT_CPU_THRESHOLD;
  const minElapsedMs = options.minElapsedMs ?? DEFAULT_MIN_ELAPSED_MS;
  const sink = options.sink ?? ((line: string) => void process.stderr.write(line));
  const now = options.now ?? Date.now;
  const cpuUsage = options.cpuUsage ?? (() => process.cpuUsage());
  const schedule = options.schedule ?? defaultSchedule;
  const shouldStop = options.shouldStop ?? (() => false);

  const startWall = now();
  const startCpu = cpuUsage();
  let lastWall = startWall;
  let lastCpu = startCpu.user + startCpu.system;
  let warned = false;
  let stopped = false;
  const cancelSampler = schedule(() => sample(), intervalMs);

  function stop(): void {
    if (stopped) return;
    stopped = true;
    cancelSampler();
  }

  function sample(): void {
    if (stopped || warned || shouldStop()) {
      stop();
      return;
    }
    const usage = cpuUsage();
    const cpu = usage.user + usage.system;
    const wall = now();
    const wallDelta = wall - lastWall;
    const cpuDelta = cpu - lastCpu;
    lastWall = wall;
    lastCpu = cpu;
    // Same-clock-tick sample: no window to measure, try again next interval.
    if (wallDelta <= 0) return;
    const elapsed = wall - startWall;
    if (elapsed < minElapsedMs) return;
    const cpuFraction = cpuDelta / (wallDelta * 1000); // cpu μs over wall ms → cores
    if (cpuFraction < cpuThreshold) return;
    warned = true;
    stop();
    sink(
      `gitnexus detect-changes watchdog: pid=${process.pid} ${Math.round(elapsed / 1000)}s elapsed at ` +
        `${Math.round(cpuFraction * 100)}% of one core — possible runaway CPU loop\n`,
    );
    options.onWarn?.();
  }

  return { stop };
}

// --- worker entry -----------------------------------------------------------
// Only runs when this module is the worker's entry script; in unit tests the
// import stops above at runWatchdogSampler.

interface WatchdogWorkerData {
  intervalMs: number;
  cpuThreshold: number;
  minElapsedMs: number;
}

const knobs = workerData as WatchdogWorkerData | undefined;
if (knobs && typeof knobs === 'object' && 'intervalMs' in knobs) {
  let stopped = false;
  parentPort?.on('message', (msg: { type?: string }) => {
    if (msg?.type === 'stop') {
      stopped = true;
      process.exit(0);
    }
  });
  runWatchdogSampler({
    intervalMs: knobs.intervalMs,
    cpuThreshold: knobs.cpuThreshold,
    minElapsedMs: knobs.minElapsedMs,
    // Write directly from this thread (the whole point is that the main
    // thread may be wedged and unable to relay anything), and SYNCHRONOUSLY:
    // this worker process.exit()s right after the one warning, and
    // process.stderr.write to a pipe is async — the line would die in the
    // buffer. fd 2 writeSync cannot be lost.
    sink: (line: string) => writeSync(2, line),
    shouldStop: () => stopped,
    // One warning is the whole contract; end the thread so nothing lingers.
    onWarn: () => process.exit(0),
  });
  // Sampler armed — tell the main thread it may proceed (it caps the wait, so
  // this is a handshake, not a synchronization dependency).
  parentPort?.postMessage({ type: 'ready' });
}
