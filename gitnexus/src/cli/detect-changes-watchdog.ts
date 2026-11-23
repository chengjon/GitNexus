/**
 * ELAPSED×CPU runaway watchdog for `gitnexus detect-changes`.
 *
 * The factor-pool incident (2026-11-23) was a detect-changes process that
 * burned ~100% of one core in pure user mode for 9+ hours without printing a
 * single line — invisible until someone thought to run `ps`. Worker isolation
 * bounds the signature check with a hard timeout, but no other phase has a
 * wall-clock budget, so this watchdog is the generic backstop: sample CPU time
 * against wall clock, and when elapsed time has passed a floor *and* CPU time
 * tracks wall time too closely (the signature of a user-mode spin), emit one
 * stderr warning. The warning is the whole contract — detect-changes is a
 * read-only diagnostic, so the watchdog never kills anything; it just makes a
 * runaway visible in logs and post-mortems.
 *
 * The sampler runs in a worker thread (see detect-changes-watchdog-worker.ts
 * for why a main-thread timer cannot do this job). The worker is unref'd so
 * it never holds the CLI open, and stop() posts a graceful stop — never
 * terminate (SIGABRT lesson from call-compatibility-worker).
 *
 * Env knobs (all optional, malformed values fall back to defaults — a
 * diagnostics feature must never crash the CLI):
 *   GITNEXUS_DETECT_CHANGES_WATCHDOG=off|false|0   disable entirely
 *   GITNEXUS_DETECT_CHANGES_WATCHDOG_INTERVAL_MS   sample interval (default 5000)
 *   GITNEXUS_DETECT_CHANGES_WATCHDOG_MIN_ELAPSED_MS no alarm before this (default 60000)
 *   GITNEXUS_DETECT_CHANGES_WATCHDOG_CPU           fraction of one core (default 0.9)
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';

export interface DetectChangesWatchdogOptions {
  /** How often to sample CPU vs wall clock. Default 5000 ms. */
  intervalMs?: number;
  /**
   * Alarm when cpuDelta/wallDelta reaches this fraction of one core.
   * Default 0.9.
   */
  cpuThreshold?: number;
  /** No alarm before this much wall time has elapsed. Default 60000 ms. */
  minElapsedMs?: number;
}

const DEFAULT_INTERVAL_MS = 5000;
const DEFAULT_CPU_THRESHOLD = 0.9;
const DEFAULT_MIN_ELAPSED_MS = 60_000;

/**
 * Arm the watchdog. Returns a stop handle the command must call when it
 * finishes (including on error paths), plus a readiness promise the command
 * should await before starting work: the alarm can only fire once the worker
 * has loaded and armed, so "fire-and-forget arm then finish fast" would race
 * the stop handshake and silence the watchdog entirely.
 */
export function startDetectChangesWatchdog(options: DetectChangesWatchdogOptions = {}): {
  ready: Promise<void>;
  stop(): void;
} {
  const knobs = {
    intervalMs: options.intervalMs ?? DEFAULT_INTERVAL_MS,
    cpuThreshold: options.cpuThreshold ?? DEFAULT_CPU_THRESHOLD,
    minElapsedMs: options.minElapsedMs ?? DEFAULT_MIN_ELAPSED_MS,
  };
  const selfPath = fileURLToPath(import.meta.url);
  const isDev = selfPath.endsWith('.ts');
  const entryPath = path.join(
    path.dirname(selfPath),
    `detect-changes-watchdog-worker.${isDev ? 'ts' : 'js'}`,
  );
  // In dev (tsx-on-source) the worker needs the tsx loader to import the .ts
  // entry; workers do not inherit --import flags from the spawning process.
  const _require = createRequire(import.meta.url);
  const worker = new Worker(entryPath, {
    workerData: knobs,
    execArgv: isDev ? ['--import', pathToFileURL(_require.resolve('tsx/esm')).href] : [],
  });
  // Diagnostics must never keep a finished CLI alive — or DELAY it: readiness
  // is capped (worker 'error'/'exit' and a hard timeout all resolve it), so a
  // broken or slow-loading watchdog degrades to "no watchdog" silently.
  worker.unref();
  let settleReady: (() => void) | undefined;
  const ready = new Promise<void>((resolve) => {
    settleReady = resolve;
  });
  const settleOnce = () => {
    settleReady?.();
    settleReady = undefined;
  };
  worker.once('message', (msg: { type?: string }) => {
    if (msg?.type === 'ready') settleOnce();
  });
  worker.once('error', settleOnce);
  worker.once('exit', settleOnce);
  const cap = setTimeout(settleOnce, 2000);
  cap.unref?.();
  return {
    ready,
    stop() {
      // Graceful only: the worker exits itself. terminate() is reserved for
      // wedged workers — see call-compatibility-worker for the teardown race
      // that turns a graceful terminate into a SIGABRT.
      worker.postMessage({ type: 'stop' });
    },
  };
}

function envInt(raw: string | undefined, fallback: number, minimum: number): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback;
}

function envFloat(
  raw: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

/**
 * Read the watchdog knobs from the environment. Returns `null` when the
 * watchdog is switched off, so the caller skips arming it entirely.
 */
export function detectChangesWatchdogOptionsFromEnv(
  env: NodeJS.ProcessEnv,
): DetectChangesWatchdogOptions | null {
  const flag = env.GITNEXUS_DETECT_CHANGES_WATCHDOG?.trim().toLowerCase();
  if (flag === 'off' || flag === 'false' || flag === '0') return null;
  return {
    intervalMs: envInt(env.GITNEXUS_DETECT_CHANGES_WATCHDOG_INTERVAL_MS, DEFAULT_INTERVAL_MS, 1),
    minElapsedMs: envInt(
      env.GITNEXUS_DETECT_CHANGES_WATCHDOG_MIN_ELAPSED_MS,
      DEFAULT_MIN_ELAPSED_MS,
      0,
    ),
    cpuThreshold: envFloat(env.GITNEXUS_DETECT_CHANGES_WATCHDOG_CPU, DEFAULT_CPU_THRESHOLD, 0, 1),
  };
}
