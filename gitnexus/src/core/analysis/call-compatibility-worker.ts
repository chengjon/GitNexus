import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import type {
  CallCompatibilityCaller,
  CallCompatibilityFile,
  CallCompatibilityProvider,
  CallCompatibilityTarget,
} from '../ingestion/call-compatibility.js';
import { queryCompatibilityCallers, type CallCompatibilityReport } from './call-compatibility.js';

const _require = createRequire(import.meta.url);

/** Plain-data payload; everything here survives structured clone. */
export interface CallCompatibilityWorkerInput {
  image: {
    directory: string;
    scope: string;
    base?: string;
    files: readonly CallCompatibilityFile[];
  };
  targets: CallCompatibilityTarget[];
  callerSourceUnavailable?: string;
}

export interface CallCompatibilityCallerRequest {
  type: 'callers';
  id: number;
  ids: string[];
  relationTypes: string[];
}

export interface CallCompatibilityCallerResponse {
  type: 'callers';
  id: number;
  /** `null` mirrors a failed batch — the check degrades to caller-query-failed. */
  rows: CallCompatibilityCaller[] | null;
}

export interface CallCompatibilityWorkerDone {
  type: 'done';
  report: CallCompatibilityReport;
  errors: { context: string; message: string }[];
}

/** Sibling entry file; `.ts` beside this module in dev, `.js` in dist. */
export function callCompatibilityWorkerPath(): string {
  const self = fileURLToPath(import.meta.url);
  const entry = self.endsWith('.ts')
    ? 'call-compatibility-worker-entry.ts'
    : 'call-compatibility-worker-entry.js';
  return path.join(path.dirname(self), entry);
}

export async function checkCallCompatibilityInWorker(
  graph: string,
  image: CallCompatibilityWorkerInput['image'],
  groups: ReadonlyMap<CallCompatibilityProvider, CallCompatibilityTarget[]>,
  onError: (context: string, error: unknown) => void,
  callerSourceUnavailable?: string,
  timeoutMs = 60_000,
): Promise<CallCompatibilityReport> {
  const targets = [...groups.values()].flat();
  const workerPath = callCompatibilityWorkerPath();
  const worker = new Worker(workerPath, {
    workerData: { image, targets, callerSourceUnavailable } satisfies CallCompatibilityWorkerInput,
    // tsx hook only in dev, where the entry is TypeScript source.
    execArgv: workerPath.endsWith('.ts')
      ? ['--import', pathToFileURL(_require.resolve('tsx/esm')).href]
      : [],
  });

  return await new Promise<CallCompatibilityReport>((resolve, reject) => {
    let settled = false;
    // Graceful completion: the entry posts 'done' and returns, so the thread
    // exits on its own — terminating here races native teardown (SIGABRT under
    // vitest forks, observed 2026-11-23).
    const finish = (
      report: CallCompatibilityReport,
      errors: CallCompatibilityWorkerDone['errors'],
    ) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      for (const { context, message } of errors) onError(context, new Error(message));
      resolve(report);
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void worker.terminate();
      reject(error);
    };
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // A wedged worker must be force-killed: this is the hard timeout.
      void worker.terminate();
      resolve({
        findings: [],
        complete: false,
        skipped: [{ reason: 'signature-check-timed-out' }],
      });
    }, timeoutMs);

    worker.on(
      'message',
      (message: CallCompatibilityWorkerDone | CallCompatibilityCallerRequest) => {
        if (message.type === 'callers') {
          void queryCompatibilityCallers(graph, message.ids, message.relationTypes, onError)
            .catch(() => null)
            .then((rows) => {
              if (!settled) worker.postMessage({ type: 'callers', id: message.id, rows });
            });
          return;
        }
        finish(message.report, message.errors);
      },
    );
    worker.on('error', (error) => fail(error instanceof Error ? error : new Error(String(error))));
    worker.on('exit', (code) => {
      if (!settled) fail(new Error(`call compatibility worker exited unexpectedly (code ${code})`));
    });
  });
}
