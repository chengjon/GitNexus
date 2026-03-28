export interface AnalyzeBarLoggerOptions {
  clearLine: () => void;
  log: (message: string) => void;
}

export function createAnalyzeBarLogger(options: AnalyzeBarLoggerOptions) {
  return (...args: any[]) => {
    options.clearLine();
    options.log(args.map((arg) => (typeof arg === 'string' ? arg : String(arg))).join(' '));
  };
}

export interface AnalyzeProgressTrackerOptions {
  update: (value: number | { phase: string }, payload?: { phase: string }) => void;
  now?: () => number;
  initialPhase?: string;
}

export function createAnalyzeProgressTracker(options: AnalyzeProgressTrackerOptions) {
  const now = options.now ?? (() => Date.now());
  let lastPhaseLabel = options.initialPhase ?? 'Initializing...';
  let phaseStart = now();

  return {
    updateBar(value: number, phaseLabel: string) {
      if (phaseLabel !== lastPhaseLabel) {
        lastPhaseLabel = phaseLabel;
        phaseStart = now();
      }
      const elapsed = Math.round((now() - phaseStart) / 1000);
      const display = elapsed >= 3 ? `${phaseLabel} (${elapsed}s)` : phaseLabel;
      options.update(value, { phase: display });
    },
    tickElapsed() {
      const elapsed = Math.round((now() - phaseStart) / 1000);
      if (elapsed >= 3) {
        options.update({ phase: `${lastPhaseLabel} (${elapsed}s)` });
      }
    },
  };
}

export interface AnalyzeInterruptHandlerOptions {
  stopBar: () => void;
  log: (message: string) => void;
  closeKuzu: () => Promise<void>;
  removeReindexLock: (lockPath: string) => Promise<void>;
  reindexLockPath: string;
  runCleanupAndExit: (
    exitCode: number,
    options: {
      cleanup: () => Promise<void>;
      scheduleExit: (code: number) => Promise<void>;
    },
  ) => Promise<void>;
  scheduleExit: (code: number) => void;
  processExit: (code: number) => void;
}

export function createAnalyzeInterruptHandler(options: AnalyzeInterruptHandlerOptions) {
  let aborted = false;

  return async (exitCode: number) => {
    if (aborted) {
      options.processExit(1);
      return;
    }

    aborted = true;
    try {
      options.stopBar();
    } catch {
      // best-effort bar shutdown
    }
    options.log('\n  Interrupted — cleaning up...');
    await options.runCleanupAndExit(exitCode, {
      cleanup: async () => {
        try {
          await options.closeKuzu();
        } catch {
          // best-effort runtime cleanup
        }
        await options.removeReindexLock(options.reindexLockPath);
      },
      scheduleExit: async (code) => {
        options.scheduleExit(code);
      },
    });
  };
}
