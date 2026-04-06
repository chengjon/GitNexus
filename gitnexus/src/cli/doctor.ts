import { hasIndex, loadCLIConfig, readRegistry, type CLIConfig, type RegistryEntry } from '../storage/repo-manager.js';
import { getGitRoot, isGitRepo } from '../storage/git.js';
import { getEmbeddingsConfigSnapshot } from './config.js';
import { DEFAULT_EMBEDDING_CONFIG } from '../core/embeddings/types.js';
import { getHostPlans } from './setup.js';
import { execFileSync, spawnSync } from 'node:child_process';
import { getOptionalLanguageSupportSummary, type LanguageSupportSummaryEntry } from '../core/tree-sitter/language-registry.js';
import { nativeRuntimeManager } from '../runtime/native-runtime-manager.js';
import fs from 'node:fs/promises';

export interface DoctorOptions {
  host?: string;
  repo?: string;
  json?: boolean;
  gpu?: boolean;
  fix?: boolean;
}

export interface DoctorCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export interface DoctorResult {
  overall: 'pass' | 'warn' | 'fail';
  checks: DoctorCheck[];
}

interface DoctorCommandResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  errorCode?: string;
}

interface DoctorDeps {
  isGitRepo: (repoPath: string) => boolean;
  getGitRoot: (fromPath: string) => string | null;
  hasIndex: (repoPath: string) => Promise<boolean>;
  readRegistry: () => Promise<RegistryEntry[]>;
  loadCLIConfig: () => Promise<CLIConfig>;
  fetchJson: (url: string, init?: RequestInit) => Promise<any>;
  probeOllama: (baseUrl: string, model: string) => Promise<{ status: 'pass' | 'warn'; detail: string }>;
  getHostPlans: typeof getHostPlans;
  getLanguageSupportSummary?: () => LanguageSupportSummaryEntry[];
  getNativeRuntimeCheck?: () => DoctorCheck;
  pathExists?: (targetPath: string) => Promise<boolean>;
  runCommand?: (command: string, args: string[], options?: { timeoutMs?: number }) => Promise<DoctorCommandResult>;
}

function validateOllamaEmbedPayload(payload: any): boolean {
  const embeddings = Array.isArray(payload?.embeddings) ? payload.embeddings : [];
  const first = embeddings[0];
  return Array.isArray(first) && first.length === DEFAULT_EMBEDDING_CONFIG.dimensions;
}

async function defaultProbeOllama(
  fetchJson: DoctorDeps['fetchJson'],
  baseUrl: string,
  model: string,
): Promise<{ status: 'pass' | 'warn'; detail: string }> {
  const endpoint = `${baseUrl}/api/embed`;
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: 'gitnexus doctor',
      dimensions: DEFAULT_EMBEDDING_CONFIG.dimensions,
    }),
  };

  try {
    const payload = await fetchJson(endpoint, requestInit);
    return validateOllamaEmbedPayload(payload)
      ? { status: 'pass', detail: `source=ollama, embedProbe=${endpoint}` }
      : { status: 'warn', detail: 'Ollama responded but embedding payload was invalid' };
  } catch (fetchError: any) {
    const fetchMessage = fetchError?.message || 'unknown fetch error';

    try {
      const curlOutput = execFileSync(
        'curl',
        [
          '-fsS',
          endpoint,
          '-H',
          'Content-Type: application/json',
          '-d',
          JSON.stringify({
            model,
            input: 'gitnexus doctor',
            dimensions: DEFAULT_EMBEDDING_CONFIG.dimensions,
          }),
        ],
        {
          encoding: 'utf-8',
          timeout: 5000,
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      );

      const payload = JSON.parse(curlOutput);
      return validateOllamaEmbedPayload(payload)
        ? { status: 'pass', detail: `source=ollama, embedProbe=${endpoint}, probeTransport=curl` }
        : { status: 'warn', detail: 'Ollama responded via curl fallback but embedding payload was invalid' };
    } catch (curlError: any) {
      const curlMessage = curlError?.stderr || curlError?.message || 'unknown curl error';
      return {
        status: 'warn',
        detail: `Ollama check failed at ${baseUrl}: fetch=${fetchMessage}; curl=${String(curlMessage).trim()}`,
      };
    }
  }
}

async function defaultPathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function defaultRunCommand(
  command: string,
  args: string[],
  options: { timeoutMs?: number } = {},
): Promise<DoctorCommandResult> {
  const result = spawnSync(command, args, {
    encoding: 'utf-8',
    timeout: options.timeoutMs ?? 5000,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return {
    ok: result.status === 0 && !result.error,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
    exitCode: result.status,
    errorCode: result.error && 'code' in result.error ? String((result.error as NodeJS.ErrnoException).code ?? '') : undefined,
  };
}

const DEFAULT_DEPS: DoctorDeps = {
  isGitRepo,
  getGitRoot,
  hasIndex,
  readRegistry,
  loadCLIConfig,
  fetchJson: async (url: string, init?: RequestInit) => {
    const response = await fetch(url, init);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.json();
  },
  probeOllama: async (baseUrl: string, model: string) => defaultProbeOllama(DEFAULT_DEPS.fetchJson, baseUrl, model),
  getHostPlans,
  getLanguageSupportSummary: () => getOptionalLanguageSupportSummary(),
  getNativeRuntimeCheck: () => {
    const snapshot = nativeRuntimeManager.getSnapshot();
    return {
      name: 'native-runtime',
      status: snapshot.activeKuzuRepos === 0 && !snapshot.coreEmbedderActive && !snapshot.mcpEmbedderActive ? 'pass' : 'warn',
      detail: [
        `kuzuActiveRepos=${snapshot.activeKuzuRepos}${snapshot.activeRepoIds.length ? ` (${snapshot.activeRepoIds.join(', ')})` : ''}`,
        `coreEmbedderActive=${snapshot.coreEmbedderActive}`,
        `mcpEmbedderActive=${snapshot.mcpEmbedderActive}`,
      ].join(', '),
    };
  },
  pathExists: defaultPathExists,
  runCommand: defaultRunCommand,
};

function resolveOverall(checks: DoctorCheck[]): DoctorResult['overall'] {
  if (checks.some((check) => check.status === 'fail')) return 'fail';
  if (checks.some((check) => check.status === 'warn')) return 'warn';
  return 'pass';
}

function samePath(a: string, b: string): boolean {
  const left = a.trim();
  const right = b.trim();
  return process.platform === 'win32'
    ? left.toLowerCase() === right.toLowerCase()
    : left === right;
}

function formatCheck(check: DoctorCheck): string {
  return `${check.name}: ${check.status} - ${check.detail}`;
}

function summarizeCommandOutput(result: DoctorCommandResult): string {
  const text = result.stderr || result.stdout || `exitCode=${result.exitCode ?? 'unknown'}`;
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.find((line) => line.includes('NVIDIA-SMI'))
    ?? lines[0]
    ?? 'no output';
}

function parseDockerInspect(payload: string): {
  running: boolean;
  hasGpuDeviceRequest: boolean;
  env: Record<string, string>;
} | null {
  try {
    const parsed = JSON.parse(payload);
    const entry = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!entry || typeof entry !== 'object') return null;

    const envEntries = Array.isArray(entry.Config?.Env) ? entry.Config.Env : [];
    const env = Object.fromEntries(
      envEntries.map((value: string) => {
        const separator = value.indexOf('=');
        return separator === -1
          ? [value, '']
          : [value.slice(0, separator), value.slice(separator + 1)];
      }),
    );

    const hasGpuDeviceRequest = Array.isArray(entry.HostConfig?.DeviceRequests)
      && entry.HostConfig.DeviceRequests.some((request: any) =>
        Array.isArray(request?.Capabilities)
        && request.Capabilities.some((capabilityGroup: any) =>
          Array.isArray(capabilityGroup) && capabilityGroup.includes('gpu')));

    return {
      running: Boolean(entry.State?.Running),
      hasGpuDeviceRequest,
      env,
    };
  } catch {
    return null;
  }
}

async function runGpuDoctorChecks(
  options: DoctorOptions,
  deps: DoctorDeps,
  embeddingRuntime: ReturnType<typeof getEmbeddingsConfigSnapshot>['effective'],
  embeddingProbe: { status: 'pass' | 'warn'; detail: string } | null,
): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  const fixActions: string[] = [];
  const manualActions: string[] = [];
  const pathExists = deps.pathExists ?? DEFAULT_DEPS.pathExists!;
  const runCommand = deps.runCommand ?? DEFAULT_DEPS.runCommand!;

  if (process.platform === 'linux') {
    const visibleNodes = (
      await Promise.all(['/dev/dxg', '/dev/nvidia0'].map(async (targetPath) => (await pathExists(targetPath)) ? targetPath : null))
    ).filter((value): value is string => Boolean(value));

    checks.push({
      name: 'gpu-device-node',
      status: visibleNodes.length > 0 ? 'pass' : 'warn',
      detail: visibleNodes.length > 0
        ? `Detected GPU device nodes: ${visibleNodes.join(', ')}`
        : 'No /dev/dxg or /dev/nvidia0 found. On WSL, run `wsl --shutdown` from Windows and reopen the distro.',
    });

    if (visibleNodes.length === 0 && options.fix) {
      manualActions.push('Host GPU device nodes are missing. On WSL, run `wsl --shutdown` from Windows and reopen the distro.');
    }
  } else {
    checks.push({
      name: 'gpu-device-node',
      status: 'pass',
      detail: `Platform ${process.platform} does not use Linux GPU device nodes; skipped.`,
    });
  }

  const hostNvidia = await runCommand('nvidia-smi', []);
  checks.push({
    name: 'gpu-host-runtime',
    status: hostNvidia.ok ? 'pass' : (hostNvidia.errorCode === 'ENOENT' ? 'warn' : 'fail'),
    detail: hostNvidia.ok
      ? summarizeCommandOutput(hostNvidia)
      : hostNvidia.errorCode === 'ENOENT'
        ? 'nvidia-smi not found; skipping NVIDIA host runtime check.'
        : `nvidia-smi failed: ${summarizeCommandOutput(hostNvidia)}`,
  });

  if (!hostNvidia.ok && hostNvidia.errorCode !== 'ENOENT' && options.fix) {
    manualActions.push('Host NVIDIA runtime is failing. Verify the WSL GPU bridge and Windows NVIDIA driver state before retrying Ollama.');
  }

  let dockerInspect = await runCommand('docker', ['inspect', 'ollama']);
  let dockerSummary = dockerInspect.ok ? parseDockerInspect(dockerInspect.stdout) : null;
  const dockerMissing = dockerInspect.errorCode === 'ENOENT' || /No such object/i.test(dockerInspect.stderr);

  if (dockerSummary && !dockerSummary.running && options.fix) {
    const startResult = await runCommand('docker', ['start', 'ollama']);
    if (startResult.ok) {
      fixActions.push('started Docker container "ollama"');
      dockerInspect = await runCommand('docker', ['inspect', 'ollama']);
      dockerSummary = dockerInspect.ok ? parseDockerInspect(dockerInspect.stdout) : null;
    } else {
      manualActions.push(`Could not start Docker container "ollama": ${summarizeCommandOutput(startResult)}`);
    }
  }

  if (dockerMissing) {
    checks.push({
      name: 'gpu-docker-config',
      status: 'pass',
      detail: 'No Docker container named "ollama" detected; skipping container-specific GPU checks.',
    });
    checks.push({
      name: 'gpu-container-runtime',
      status: 'pass',
      detail: 'No Docker container named "ollama" detected; skipping container runtime probe.',
    });
  } else if (!dockerInspect.ok || !dockerSummary) {
    checks.push({
      name: 'gpu-docker-config',
      status: 'warn',
      detail: `Unable to inspect Docker container "ollama": ${summarizeCommandOutput(dockerInspect)}`,
    });
    checks.push({
      name: 'gpu-container-runtime',
      status: 'warn',
      detail: 'Skipped container runtime probe because Docker inspect did not succeed.',
    });
  } else {
    const llmLibrary = dockerSummary.env.OLLAMA_LLM_LIBRARY;
    const visibleDevices = dockerSummary.env.NVIDIA_VISIBLE_DEVICES;
    const driverCapabilities = dockerSummary.env.NVIDIA_DRIVER_CAPABILITIES ?? '';
    const missingConfig: string[] = [];

    if (!dockerSummary.hasGpuDeviceRequest) missingConfig.push('DeviceRequests[gpu]');
    if (llmLibrary !== 'cuda_v12') missingConfig.push(`OLLAMA_LLM_LIBRARY=${llmLibrary ?? 'missing'} (expected cuda_v12)`);
    if (visibleDevices !== 'all') missingConfig.push(`NVIDIA_VISIBLE_DEVICES=${visibleDevices ?? 'missing'} (expected all)`);
    if (!(driverCapabilities.includes('compute') && driverCapabilities.includes('utility'))) {
      missingConfig.push(`NVIDIA_DRIVER_CAPABILITIES=${driverCapabilities || 'missing'} (expected compute,utility)`);
    }

    checks.push({
      name: 'gpu-docker-config',
      status: dockerSummary.running && missingConfig.length === 0 ? 'pass' : (missingConfig.length > 0 ? 'fail' : 'warn'),
      detail: [
        `running=${dockerSummary.running}`,
        `gpuDeviceRequest=${dockerSummary.hasGpuDeviceRequest}`,
        `OLLAMA_LLM_LIBRARY=${llmLibrary ?? 'missing'}`,
        `NVIDIA_VISIBLE_DEVICES=${visibleDevices ?? 'missing'}`,
        `NVIDIA_DRIVER_CAPABILITIES=${driverCapabilities || 'missing'}`,
        missingConfig.length > 0 ? `missing=${missingConfig.join('; ')}` : 'config=ok',
      ].join(', '),
    });

    if (missingConfig.length > 0 && options.fix) {
      manualActions.push('Ollama container GPU config is immutable at runtime. Recreate or update the container so it includes `--gpus all`, `OLLAMA_LLM_LIBRARY=cuda_v12`, `NVIDIA_VISIBLE_DEVICES=all`, and `NVIDIA_DRIVER_CAPABILITIES=compute,utility`.');
    }

    if (dockerSummary.running) {
      const containerNvidia = await runCommand('docker', ['exec', 'ollama', 'sh', '-lc', 'nvidia-smi']);
      checks.push({
        name: 'gpu-container-runtime',
        status: containerNvidia.ok ? 'pass' : 'fail',
        detail: containerNvidia.ok
          ? summarizeCommandOutput(containerNvidia)
          : `docker exec ollama nvidia-smi failed: ${summarizeCommandOutput(containerNvidia)}`,
      });

      if (!containerNvidia.ok && options.fix) {
        manualActions.push('Container cannot access the GPU. Verify host `nvidia-smi`, `nvidia-container-cli info`, and the WSL GPU bridge before recreating the Ollama container.');
      }
    } else {
      checks.push({
        name: 'gpu-container-runtime',
        status: 'warn',
        detail: 'Skipped container runtime probe because Docker container "ollama" is not running.',
      });
    }
  }

  if (embeddingRuntime.provider !== 'ollama') {
    checks.push({
      name: 'gpu-ollama-runtime',
      status: 'warn',
      detail: `GPU runtime probe currently supports only Ollama embeddings. Current provider=${embeddingRuntime.provider}.`,
    });
  } else if (!embeddingProbe || embeddingProbe.status !== 'pass') {
    checks.push({
      name: 'gpu-ollama-runtime',
      status: 'warn',
      detail: `Skipped GPU offload verification because the Ollama embed probe did not pass (${embeddingProbe?.detail ?? 'no probe detail'}).`,
    });
  } else {
    try {
      const psPayload = await deps.fetchJson(`${embeddingRuntime.ollamaBaseUrl}/api/ps`);
      const models = Array.isArray(psPayload?.models) ? psPayload.models : [];
      const loadedModel = models.find((entry: any) => entry?.model === embeddingRuntime.ollamaModel || entry?.name === embeddingRuntime.ollamaModel);

      if (!loadedModel) {
        checks.push({
          name: 'gpu-ollama-runtime',
          status: 'warn',
          detail: `Ollama embed probe passed, but ${embeddingRuntime.ollamaModel} was not listed by /api/ps immediately afterward.`,
        });
      } else {
        const sizeVram = Number(loadedModel.size_vram ?? 0);
        checks.push({
          name: 'gpu-ollama-runtime',
          status: sizeVram > 0 ? 'pass' : 'fail',
          detail: sizeVram > 0
            ? `model=${loadedModel.model ?? loadedModel.name}, size_vram=${sizeVram}`
            : `model=${loadedModel.model ?? loadedModel.name}, size_vram=0 (CPU fallback likely)`,
        });

        if (sizeVram === 0 && options.fix) {
          manualActions.push('Ollama can answer embed requests but reports `size_vram=0`. Check `nvidia-smi`, `nvidia-container-cli info`, and the Ollama container GPU env, then rerun `gitnexus doctor --gpu --fix`.');
        }
      }
    } catch (error: any) {
      checks.push({
        name: 'gpu-ollama-runtime',
        status: 'warn',
        detail: `Could not query Ollama /api/ps after embed probe: ${error?.message ?? 'unknown error'}`,
      });
    }
  }

  if (options.fix) {
    checks.push({
      name: 'gpu-fix',
      status: manualActions.length > 0 ? 'warn' : 'pass',
      detail: [
        fixActions.length > 0 ? `Applied safe fixes: ${fixActions.join('; ')}` : 'No safe automatic fixes were needed.',
        manualActions.length > 0 ? `Manual follow-up: ${manualActions.join(' ')}` : null,
      ].filter(Boolean).join(' '),
    });
  }

  return checks;
}

export async function runDoctor(
  options: DoctorOptions,
  deps: DoctorDeps = DEFAULT_DEPS,
): Promise<DoctorResult> {
  const requestedRepo = options.repo ?? process.cwd();
  const checks: DoctorCheck[] = [];

  if (!deps.isGitRepo(requestedRepo)) {
    checks.push({
      name: 'git-repo',
      status: 'fail',
      detail: 'Not a git repository.',
    });
    return { overall: resolveOverall(checks), checks };
  }

  const repoRoot = deps.getGitRoot(requestedRepo) ?? requestedRepo;
  checks.push({
    name: 'git-repo',
    status: 'pass',
    detail: `Git repository detected at ${repoRoot}`,
  });

  checks.push((deps.getNativeRuntimeCheck ?? DEFAULT_DEPS.getNativeRuntimeCheck)!());

  const indexed = await deps.hasIndex(repoRoot);
  checks.push({
    name: 'repo-indexed',
    status: indexed ? 'pass' : 'fail',
    detail: indexed
      ? `Index found at ${repoRoot}/.gitnexus`
      : 'Repository not indexed. Run: gitnexus analyze',
  });

  const cliConfig = await deps.loadCLIConfig();
  const languageSupport = (deps.getLanguageSupportSummary ?? DEFAULT_DEPS.getLanguageSupportSummary)!();
  if (languageSupport.length > 0) {
    const unavailable = languageSupport.filter((entry) => entry.status === 'unavailable');
    checks.push({
      name: 'language-support',
      status: unavailable.length > 0 ? 'warn' : 'pass',
      detail: languageSupport
        .map((entry) => `${entry.language}:${entry.tier}=${entry.status}${entry.detail ? ` (${entry.detail})` : ''}`)
        .join(', '),
    });
  }

  const embeddingSnapshot = getEmbeddingsConfigSnapshot(cliConfig, process.env);
  const embeddingRuntime = embeddingSnapshot.effective;
  const embeddingDetail = [
    `provider=${embeddingRuntime.provider} (${embeddingSnapshot.sources.provider})`,
    embeddingRuntime.provider === 'ollama'
      ? `model=${embeddingRuntime.ollamaModel} (${embeddingSnapshot.sources.ollamaModel})`
      : `model=Snowflake/snowflake-arctic-embed-xs (default)`,
    `nodeLimit=${embeddingRuntime.nodeLimit} (${embeddingSnapshot.sources.nodeLimit})`,
    `batchSize=${embeddingRuntime.batchSize} (${embeddingSnapshot.sources.batchSize})`,
  ].join(', ');
  let embeddingProbe: { status: 'pass' | 'warn'; detail: string } | null = null;

  if (embeddingRuntime.provider === 'ollama') {
    embeddingProbe = await deps.probeOllama(embeddingRuntime.ollamaBaseUrl, embeddingRuntime.ollamaModel);
    checks.push({
      name: 'embeddings-config',
      status: embeddingProbe.status,
      detail: `${embeddingDetail}, ${embeddingProbe.detail}`,
    });
  } else {
    checks.push({
      name: 'embeddings-config',
      status: 'pass',
      detail: `${embeddingDetail}, source=huggingface`,
    });
  }

  if (options.gpu || options.fix) {
    checks.push(...await runGpuDoctorChecks(
      { ...options, gpu: true },
      deps,
      embeddingRuntime,
      embeddingProbe,
    ));
  }

  const registry = await deps.readRegistry();
  const registryEntry = registry.find((entry) => samePath(entry.path, repoRoot));
  checks.push({
    name: 'registry-entry',
    status: registryEntry ? 'pass' : 'warn',
    detail: registryEntry
      ? `Registry entry found for ${registryEntry.name}`
      : 'No registry entry found for this repository.',
  });

  const hostPlans = deps.getHostPlans({ repoPath: repoRoot }).filter((plan) => {
    if (!options.host) return true;
    const requestedHost = options.host.toLowerCase();
    return plan.adapter.id === requestedHost || plan.adapter.displayName.toLowerCase() === requestedHost;
  });

  if (options.host && hostPlans.length === 0) {
    checks.push({
      name: 'host-config',
      status: 'fail',
      detail: `Unknown host: ${options.host}`,
    });
    return { overall: resolveOverall(checks), checks };
  }

  if (hostPlans.length === 0) {
    checks.push({
      name: 'host-config',
      status: 'pass',
      detail: 'No host checks requested.',
    });
    return { overall: resolveOverall(checks), checks };
  }

  for (const plan of hostPlans) {
    const detection = await plan.adapter.detect();
    if (!detection.detected) {
      checks.push({
        name: 'host-config',
        status: 'warn',
        detail: `${plan.adapter.displayName} not detected (${detection.reason ?? 'not installed'}).`,
      });
      continue;
    }

    const configured = await plan.checkConfigured();
    if (configured) {
      checks.push({
        name: 'host-config',
        status: 'pass',
        detail: `${plan.adapter.displayName} host config is present.`,
      });
      continue;
    }

    checks.push({
      name: 'host-config',
      status: plan.needsManualConfig ? 'warn' : 'fail',
      detail: plan.needsManualConfig
        ? `${plan.adapter.displayName} requires a manual MCP setup step.`
        : `${plan.adapter.displayName} host config is missing.`,
    });
  }

  return {
    overall: resolveOverall(checks),
    checks,
  };
}

function printDoctorResult(result: DoctorResult): void {
  console.log('');
  console.log('  GitNexus Doctor');
  console.log('  ===============');
  console.log('');
  console.log(`  Overall: ${result.overall}`);
  console.log('');
  console.log('  Checks:');
  for (const check of result.checks) {
    console.log(`    - ${formatCheck(check)}`);
  }
  console.log('');
}

function normalizeDoctorOptions(
  pathOrOptions?: string | DoctorOptions,
  maybeOptions: DoctorOptions = {},
): DoctorOptions {
  if (typeof pathOrOptions === 'string') {
    return {
      ...maybeOptions,
      repo: maybeOptions.repo ?? pathOrOptions,
    };
  }

  return pathOrOptions ?? {};
}

export async function doctorCommand(
  pathOrOptions: string | DoctorOptions = {},
  maybeOptions: DoctorOptions = {},
): Promise<void> {
  const options = normalizeDoctorOptions(pathOrOptions, maybeOptions);
  const result = await runDoctor({
    host: options.host,
    repo: options.repo,
    json: options.json,
    gpu: options.gpu || options.fix,
    fix: options.fix,
  });

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  printDoctorResult(result);
}
