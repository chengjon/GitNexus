import { hasIndex, readRegistry, type RegistryEntry } from '../storage/repo-manager.js';
import { getGitRoot, isGitRepo } from '../storage/git.js';
import { getHostPlans } from './setup.js';

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
  getHostPlans: typeof getHostPlans;
}

const DEFAULT_DEPS: DoctorDeps = {
  isGitRepo,
  getGitRoot,
  hasIndex,
  readRegistry,
  getHostPlans,
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

  const indexed = await deps.hasIndex(repoRoot);
  checks.push({
    name: 'repo-indexed',
    status: indexed ? 'pass' : 'fail',
    detail: indexed
      ? `Index found at ${repoRoot}/.gitnexus`
      : 'Repository not indexed. Run: gitnexus analyze',
  });

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
