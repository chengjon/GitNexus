import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getRuntimeCapabilities, getRuntimeFingerprint } from '../core/platform/capabilities.js';
import { resolveEmbeddingConfig } from '../core/embeddings/config.js';
import { isHttpMode } from '../core/embeddings/http-client.js';
import { checkLbugNative, type NativeCheckResult } from '../core/lbug/native-check.js';
import { hasIndex as hasRepoIndex } from '../storage/repo-manager.js';
import { getGitRoot, isGitRepo } from '../storage/git.js';
import { detectMissingOptionalGrammars, type MissingGrammar } from './optional-grammars.js';

export type DoctorStatus = 'pass' | 'warn' | 'fail';

export interface DoctorOptions {
  repo?: string;
  host?: string;
  gpu?: boolean;
  fix?: boolean;
  json?: boolean;
}

export interface DoctorCheck {
  name: string;
  status: DoctorStatus;
  detail?: string;
  data?: Record<string, unknown>;
}

export interface DoctorResult extends DoctorOptions {
  overall: DoctorStatus;
  checks: DoctorCheck[];
}

export interface DoctorDeps {
  getRuntimeFingerprint: () => ReturnType<typeof getRuntimeFingerprint>;
  getRuntimeCapabilities: () => ReturnType<typeof getRuntimeCapabilities>;
  resolveEmbeddingConfig: () => ReturnType<typeof resolveEmbeddingConfig>;
  isHttpMode: () => boolean;
  checkNative: () => NativeCheckResult;
  detectMissingOptionalGrammars: () => MissingGrammar[];
  isGitRepo: (repoPath: string) => boolean;
  getGitRoot: (repoPath: string) => string | null;
  hasIndex: (dbPath: string) => Promise<boolean>;
  homeDir: () => string;
}

export const defaultDeps = (): DoctorDeps => ({
  getRuntimeFingerprint: () => getRuntimeFingerprint(),
  getRuntimeCapabilities: () => getRuntimeCapabilities(),
  resolveEmbeddingConfig: () => resolveEmbeddingConfig(),
  isHttpMode: () => isHttpMode(),
  checkNative: () => checkLbugNative(),
  detectMissingOptionalGrammars: () => detectMissingOptionalGrammars(),
  isGitRepo: (path) => isGitRepo(path),
  getGitRoot: (path) => getGitRoot(path),
  hasIndex: (dbPath) => hasRepoIndex(dbPath),
  homeDir: () => os.homedir(),
});

const statusRank: Record<DoctorStatus, number> = { fail: 2, warn: 1, pass: 0 };

const overallStatus = (checks: DoctorCheck[]): DoctorStatus =>
  checks.some((check) => check.status === 'fail')
    ? 'fail'
    : checks.some((check) => check.status === 'warn')
      ? 'warn'
      : 'pass';

const hostConfigPaths = (hostId: string, homeDir: string): string[] => {
  const paths: string[] = [];
  if (hostId === 'codex') paths.push(path.join(homeDir, '.codex', 'config.toml'));
  if (hostId === 'factory') paths.push(path.join(homeDir, '.factory', 'backend.json'));
  return paths;
};

function buildNativeCheck(nativeCheck: NativeCheckResult): DoctorCheck {
  return {
    name: 'native-runtime',
    status: nativeCheck.ok ? 'pass' : 'fail',
    detail: nativeCheck.message,
    data: { nativeCheck },
  };
}

function buildLanguageSupportCheck(missingGrammars: MissingGrammar[]): DoctorCheck {
  if (missingGrammars.length === 0) {
    return { name: 'language-support', status: 'pass' };
  }
  return {
    name: 'language-support',
    status: 'warn',
    detail: `optional grammars missing: ${missingGrammars.map((grammar) => grammar.name).join(', ')}`,
    data: { missingGrammars },
  };
}

async function buildRepoCheck(repoPath: string, deps: DoctorDeps): Promise<DoctorCheck> {
  if (!deps.isGitRepo(repoPath)) {
    return {
      name: 'git-repo',
      status: 'fail',
      detail: `not a Git repository: ${repoPath}`,
      data: { requestedPath: repoPath },
    };
  }
  const gitRoot = deps.getGitRoot(repoPath);
  const dbPath = gitRoot ? path.join(gitRoot, '.gitnexus', 'graph.db') : null;
  const hasIndex = dbPath ? await deps.hasIndex(dbPath) : false;
  return {
    name: 'gitnexus-index',
    status: hasIndex ? 'pass' : 'warn',
    detail: hasIndex
      ? 'repository index present'
      : `no index at ${dbPath ?? path.join(repoPath, '.gitnexus', 'graph.db')}`,
    data: { gitRoot, dbPath, hasIndex },
  };
}

function buildHostConfigCheck(hostId: string, deps: DoctorDeps): DoctorCheck {
  const homeDir = deps.homeDir();
  const configured = hostConfigPaths(hostId, homeDir).some((configPath) =>
    fs.existsSync(configPath),
  );
  return {
    name: 'host-config',
    status: configured ? 'pass' : 'warn',
    detail: configured ? `${hostId} config present` : `no ${hostId} config under ${homeDir}`,
    data: { hostId, homeDir },
  };
}

export async function runDoctor(
  options: DoctorOptions = {},
  deps: DoctorDeps = defaultDeps(),
): Promise<DoctorResult> {
  const fingerprint = deps.getRuntimeFingerprint();
  const capabilities = deps.getRuntimeCapabilities();
  const embeddingConfig = deps.resolveEmbeddingConfig();
  const nativeCheck = deps.checkNative();
  const missingGrammars = deps.detectMissingOptionalGrammars();

  const checks: DoctorCheck[] = [
    { name: 'runtime', status: 'pass', data: { fingerprint } },
    buildNativeCheck(nativeCheck),
    {
      name: 'capabilities',
      status: capabilities.vector === 'unavailable' ? 'warn' : 'pass',
      detail: capabilities.reason,
      data: { capabilities },
    },
    buildLanguageSupportCheck(missingGrammars),
    {
      name: 'embeddings',
      status: 'pass',
      data: {
        backend: deps.isHttpMode() ? 'http' : 'local',
        config: embeddingConfig,
      },
    },
  ];

  if (options.repo) {
    checks.push(await buildRepoCheck(options.repo, deps));
  }

  if (options.host) {
    checks.push(buildHostConfigCheck(options.host, deps));
  }

  if (options.gpu) {
    checks.push({
      name: 'gpu-readiness',
      status: 'warn',
      detail: 'GPU readiness is environment-specific; verify Ollama/NVIDIA setup separately.',
      data: { requested: true, fix: Boolean(options.fix) },
    });
  }

  return { overall: overallStatus(checks), checks };
}
