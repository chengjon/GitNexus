import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getRuntimeCapabilities, getRuntimeFingerprint } from '../core/platform/capabilities.js';
import { resolveEmbeddingConfig } from '../core/embeddings/config.js';
import { isHttpMode } from '../core/embeddings/http-client.js';
import { checkLbugNative, type NativeCheckResult } from '../core/lbug/native-check.js';
import { hasIndex as hasRepoIndex } from '../storage/repo-manager.js';
import { getGitRoot, isGitRepo } from '../storage/git.js';
import { t } from './i18n/index.js';
import { detectMissingOptionalGrammars, type MissingGrammar } from './optional-grammars.js';

type DoctorStatus = 'pass' | 'warn' | 'fail';

export interface DoctorOptions {
  host?: string;
  repo?: string;
  json?: boolean;
  gpu?: boolean;
  fix?: boolean;
}

export interface DoctorCheck {
  name: string;
  status: DoctorStatus;
  detail?: string;
  data?: Record<string, unknown>;
}

export interface DoctorResult {
  overall: DoctorStatus;
  checks: DoctorCheck[];
}

export interface DoctorDeps {
  getRuntimeFingerprint: typeof getRuntimeFingerprint;
  getRuntimeCapabilities: typeof getRuntimeCapabilities;
  resolveEmbeddingConfig: typeof resolveEmbeddingConfig;
  isHttpMode: typeof isHttpMode;
  checkNative: typeof checkLbugNative;
  detectMissingOptionalGrammars: typeof detectMissingOptionalGrammars;
  isGitRepo: typeof isGitRepo;
  getGitRoot: typeof getGitRoot;
  hasIndex: typeof hasRepoIndex;
  homeDir: () => string;
}

function isCombiningMark(codePoint: number): boolean {
  return (
    (codePoint >= 0x0300 && codePoint <= 0x036f) ||
    (codePoint >= 0x1ab0 && codePoint <= 0x1aff) ||
    (codePoint >= 0x1dc0 && codePoint <= 0x1dff) ||
    (codePoint >= 0x20d0 && codePoint <= 0x20ff) ||
    (codePoint >= 0xfe20 && codePoint <= 0xfe2f)
  );
}

function isWideCodePoint(codePoint: number): boolean {
  return (
    (codePoint >= 0x1100 && codePoint <= 0x115f) ||
    codePoint === 0x2329 ||
    codePoint === 0x232a ||
    (codePoint >= 0x2e80 && codePoint <= 0xa4cf && codePoint !== 0x303f) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
    (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
    (codePoint >= 0xff00 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    (codePoint >= 0x1f300 && codePoint <= 0x1f64f) ||
    (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) ||
    (codePoint >= 0x20000 && codePoint <= 0x3fffd)
  );
}

export function displayWidth(value: string): number {
  let width = 0;
  for (const char of value) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined || codePoint === 0) continue;
    if (isCombiningMark(codePoint)) continue;
    width += isWideCodePoint(codePoint) ? 2 : 1;
  }
  return width;
}

export function padDisplayEnd(value: string, columns: number): string {
  return value + ' '.repeat(Math.max(0, columns - displayWidth(value)));
}

const label = (key: Parameters<typeof t>[0], width: number): string => padDisplayEnd(t(key), width);

const defaultDeps: DoctorDeps = {
  getRuntimeFingerprint,
  getRuntimeCapabilities,
  resolveEmbeddingConfig,
  isHttpMode,
  checkNative: checkLbugNative,
  detectMissingOptionalGrammars,
  isGitRepo,
  getGitRoot,
  hasIndex: hasRepoIndex,
  homeDir: () => os.homedir(),
};

const statusRank = (status: DoctorStatus): number => ({ pass: 0, warn: 1, fail: 2 })[status];

const overallStatus = (checks: DoctorCheck[]): DoctorStatus =>
  checks.reduce<DoctorStatus>(
    (overall, check) => (statusRank(check.status) > statusRank(overall) ? check.status : overall),
    'pass',
  );

const hostConfigPaths = (
  homeDir: string,
): Record<string, { displayName: string; configPath: string }> => ({
  cursor: { displayName: 'Cursor', configPath: path.join(homeDir, '.cursor', 'mcp.json') },
  'claude-code': { displayName: 'Claude Code', configPath: path.join(homeDir, '.claude.json') },
  antigravity: {
    displayName: 'Antigravity',
    configPath: path.join(homeDir, '.gemini', 'antigravity', 'mcp_config.json'),
  },
  opencode: {
    displayName: 'OpenCode',
    configPath: path.join(homeDir, '.opencode', 'opencode.json'),
  },
  codex: { displayName: 'Codex', configPath: path.join(homeDir, '.codex', 'config.toml') },
});

function buildNativeCheck(nativeCheck: NativeCheckResult): DoctorCheck {
  return {
    name: 'native-runtime',
    status: nativeCheck.ok ? 'pass' : 'fail',
    detail: nativeCheck.ok ? 'LadybugDB native runtime loaded' : nativeCheck.message,
    data: {
      ok: nativeCheck.ok,
      binaryPath: nativeCheck.binaryPath,
    },
  };
}

function buildLanguageSupportCheck(missing: MissingGrammar[]): DoctorCheck {
  if (missing.length === 0) {
    return {
      name: 'language-support',
      status: 'pass',
      detail: 'Required languages and optional native grammars available',
      data: { missingOptionalGrammars: [] },
    };
  }

  return {
    name: 'language-support',
    status: 'warn',
    detail: missing
      .map((grammar) => `${grammar.name}: optional=unavailable (${grammar.extensions.join(', ')})`)
      .join('\n'),
    data: { missingOptionalGrammars: missing },
  };
}

async function buildRepoCheck(repoPath: string, deps: DoctorDeps): Promise<DoctorCheck> {
  if (!deps.isGitRepo(repoPath)) {
    return {
      name: 'git-repo',
      status: 'fail',
      detail: `${repoPath} is not a Git repository`,
      data: { requestedPath: repoPath },
    };
  }

  const gitRoot = deps.getGitRoot(repoPath) ?? repoPath;
  const indexed = await deps.hasIndex(gitRoot);
  return {
    name: 'git-repo',
    status: indexed ? 'pass' : 'warn',
    detail: indexed ? 'Repository has a GitNexus index' : 'Repository is not indexed yet',
    data: { requestedPath: repoPath, gitRoot, indexed },
  };
}

function buildHostConfigCheck(host: string, deps: DoctorDeps): DoctorCheck {
  const hostId = host.toLowerCase();
  const hostPaths = hostConfigPaths(deps.homeDir());
  const hostInfo = hostPaths[hostId];

  if (!hostInfo) {
    return {
      name: 'host-config',
      status: 'fail',
      detail: `Unknown host: ${host}`,
      data: { requestedHost: host, supportedHosts: Object.keys(hostPaths) },
    };
  }

  if (!fs.existsSync(hostInfo.configPath)) {
    return {
      name: 'host-config',
      status: 'warn',
      detail: `${hostInfo.displayName} config file was not found`,
      data: { hostId, displayName: hostInfo.displayName, configPath: hostInfo.configPath },
    };
  }

  const config = fs.readFileSync(hostInfo.configPath, 'utf8');
  const configured = /\bgitnexus\b/i.test(config);
  return {
    name: 'host-config',
    status: configured ? 'pass' : 'warn',
    detail: configured
      ? `${hostInfo.displayName} config references GitNexus`
      : `${hostInfo.displayName} config exists but does not reference GitNexus`,
    data: {
      hostId,
      displayName: hostInfo.displayName,
      configPath: hostInfo.configPath,
      configured,
    },
  };
}

export async function runDoctor(
  options: DoctorOptions = {},
  deps: DoctorDeps = defaultDeps,
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

function checkData<T extends object>(check: DoctorCheck, key: string): T {
  const value = check.data?.[key];
  if (!value || typeof value !== 'object') {
    throw new Error(`doctor check "${check.name}" missing ${key} data`);
  }
  return value as T;
}

function printTextDoctor(result: DoctorResult): void {
  const runtime = result.checks.find((check) => check.name === 'runtime');
  const capabilitiesCheck = result.checks.find((check) => check.name === 'capabilities');
  const embeddingsCheck = result.checks.find((check) => check.name === 'embeddings');
  const nativeRuntime = result.checks.find((check) => check.name === 'native-runtime');
  if (!runtime || !capabilitiesCheck || !embeddingsCheck || !nativeRuntime) {
    throw new Error('doctor result missing required checks');
  }

  const fingerprint = checkData<ReturnType<typeof getRuntimeFingerprint>>(runtime, 'fingerprint');
  const capabilities = checkData<ReturnType<typeof getRuntimeCapabilities>>(
    capabilitiesCheck,
    'capabilities',
  );
  const embeddings = embeddingsCheck.data ?? {};
  const embeddingConfig = embeddings.config as ReturnType<typeof resolveEmbeddingConfig>;
  const nativeData = nativeRuntime.data ?? {};

  console.log(t('doctor.title') + '\n');
  console.log(t('doctor.runtime'));
  console.log(`  ${label('doctor.labels.os', 10)}${fingerprint.platform}/${fingerprint.arch}`);
  console.log(`  ${label('doctor.labels.node', 10)}${fingerprint.node}`);
  console.log(`  ${label('doctor.labels.gitnexus', 10)}${fingerprint.gitnexus}`);
  console.log(`  ${label('doctor.labels.ladybugdb', 10)}${fingerprint.ladybugdb ?? 'unknown'}`);
  if (nativeRuntime.status === 'pass') {
    console.log(`  ${padDisplayEnd('native', 10)}✓ lbugjs.node loaded`);
  } else {
    console.log(`  ${padDisplayEnd('native', 10)}✗ lbugjs.node missing`);
    process.stderr.write(`\n${nativeRuntime.detail?.replace(/^/gm, '  ')}\n\n`);
  }
  console.log(`  ${label('doctor.labels.onnx', 10)}${fingerprint.onnxruntime ?? 'unknown'}`);
  console.log('');
  console.log(t('doctor.capabilities'));
  console.log(`  ${label('doctor.labels.graphStore', 18)}${capabilities.graph}`);
  console.log(`  ${label('doctor.labels.fullTextSearch', 18)}${capabilities.fts}`);
  console.log(`  ${label('doctor.labels.vectorIndex', 18)}${capabilities.vector}`);
  console.log(`  ${label('doctor.labels.semanticMode', 18)}${capabilities.semanticMode}`);
  console.log(
    `  ${label('doctor.labels.exactScanLimit', 18)}${t('doctor.chunks', { count: capabilities.exactScanLimit })}`,
  );
  if (capabilities.reason)
    console.log(`  ${label('doctor.labels.note', 18)}${capabilities.reason}`);
  console.log('');
  console.log(t('doctor.embeddings'));
  console.log(`  ${label('doctor.labels.backend', 12)}${embeddings.backend ?? 'local'}`);
  console.log(`  ${label('doctor.labels.device', 12)}${embeddingConfig.device}`);
  console.log(`  ${label('doctor.labels.threads', 12)}${embeddingConfig.threads}`);
  console.log(
    `  ${label('doctor.labels.batch', 12)}${t('doctor.nodes', { count: embeddingConfig.batchSize })}`,
  );
  console.log(
    `  ${label('doctor.labels.subBatch', 12)}${t('doctor.chunks', { count: embeddingConfig.subBatchSize })}`,
  );

  for (const check of result.checks) {
    if (['runtime', 'native-runtime', 'capabilities', 'embeddings'].includes(check.name)) continue;
    console.log('');
    console.log(`${check.name}: ${check.status}`);
    if (check.detail) console.log(`  ${check.detail.replace(/\n/g, '\n  ')}`);
  }

  void nativeData;
}

function normalizeOptions(
  pathArg?: string | DoctorOptions,
  options?: DoctorOptions,
): DoctorOptions {
  if (typeof pathArg === 'string') {
    return { ...options, repo: options?.repo ?? pathArg };
  }
  return pathArg ?? options ?? {};
}

export const doctorCommand = async (pathArg?: string | DoctorOptions, options?: DoctorOptions) => {
  const normalized = normalizeOptions(pathArg, options);
  const result = await runDoctor(normalized);

  if (normalized.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printTextDoctor(result);
  }

  if (result.overall === 'fail') {
    process.exitCode = 1;
  }
};
