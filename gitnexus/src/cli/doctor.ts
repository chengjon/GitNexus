import { hasIndex, loadCLIConfig, readRegistry, type CLIConfig, type RegistryEntry } from '../storage/repo-manager.js';
import { getGitRoot, isGitRepo } from '../storage/git.js';
import { getEmbeddingsConfigSnapshot } from './config.js';
import { DEFAULT_EMBEDDING_CONFIG } from '../core/embeddings/types.js';
import { getHostPlans } from './setup.js';
import { execFileSync } from 'node:child_process';
import { getOptionalLanguageSupportSummary, type LanguageSupportSummaryEntry } from '../core/tree-sitter/language-registry.js';
import { nativeRuntimeManager } from '../runtime/native-runtime-manager.js';

export interface DoctorOptions {
  host?: string;
  repo?: string;
  json?: boolean;
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

  if (embeddingRuntime.provider === 'ollama') {
    const probe = await deps.probeOllama(embeddingRuntime.ollamaBaseUrl, embeddingRuntime.ollamaModel);
    checks.push({
      name: 'embeddings-config',
      status: probe.status,
      detail: `${embeddingDetail}, ${probe.detail}`,
    });
  } else {
    checks.push({
      name: 'embeddings-config',
      status: 'pass',
      detail: `${embeddingDetail}, source=huggingface`,
    });
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

export async function doctorCommand(options: DoctorOptions = {}): Promise<void> {
  const result = await runDoctor({
    host: options.host,
    repo: options.repo,
    json: options.json,
  });

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  printDoctorResult(result);
}
