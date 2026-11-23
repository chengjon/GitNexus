import { parentPort, workerData, type MessagePort } from 'node:worker_threads';
import { getProviderForFile } from '../ingestion/languages/index.js';
import type {
  CallCompatibilityProvider,
  CallCompatibilityTarget,
} from '../ingestion/call-compatibility.js';
import { checkCallCompatibility, type CallCompatibilityCallerQuery } from './call-compatibility.js';
import type {
  CallCompatibilityCallerRequest,
  CallCompatibilityCallerResponse,
  CallCompatibilityWorkerDone,
  CallCompatibilityWorkerInput,
} from './call-compatibility-worker.js';

const input = validateWorkerData(workerData);
const port = requirePort();

const groups = new Map<CallCompatibilityProvider, CallCompatibilityTarget[]>();
for (const target of input.targets) {
  const checker = getProviderForFile(target.filePath)?.callCompatibility;
  if (!checker) continue;
  const bucket = groups.get(checker);
  if (bucket) bucket.push(target);
  else groups.set(checker, [target]);
}

// CPU-heavy signature checks run here; database reads stay on the main thread
// (the graph cannot be re-opened inside a worker) via this RPC query.
let seq = 0;
const pending = new Map<number, (response: CallCompatibilityCallerResponse) => void>();
port.on('message', (message: CallCompatibilityCallerResponse) => {
  const settle = pending.get(message.id);
  if (settle) {
    pending.delete(message.id);
    settle(message);
  }
});

const queryCallers: CallCompatibilityCallerQuery = async (ids, relationTypes) => {
  const id = ++seq;
  return await new Promise<CallCompatibilityCallerResponse>((resolve) => {
    pending.set(id, resolve);
    const request: CallCompatibilityCallerRequest = {
      type: 'callers',
      id,
      ids,
      relationTypes: [...relationTypes],
    };
    port.postMessage(request);
  }).then((response) => response.rows);
};

const errors: CallCompatibilityWorkerDone['errors'] = [];
const report = await checkCallCompatibility(
  // The graph stays on the main thread; the injected query never touches it.
  '',
  input.image,
  groups,
  (context, error) =>
    errors.push({ context, message: error instanceof Error ? error.message : String(error) }),
  input.callerSourceUnavailable,
  queryCallers,
);

const done: CallCompatibilityWorkerDone = { type: 'done', report, errors };
port.postMessage(done);

function validateWorkerData(data: unknown): CallCompatibilityWorkerInput {
  if (
    !data ||
    typeof data !== 'object' ||
    !('image' in data) ||
    !Array.isArray((data as CallCompatibilityWorkerInput).targets)
  ) {
    throw new Error('call compatibility worker entry requires workerData {image, targets}');
  }
  return data as CallCompatibilityWorkerInput;
}

function requirePort(): MessagePort {
  const current = parentPort;
  if (!current) throw new Error('call compatibility worker entry requires a parent port');
  return current;
}
