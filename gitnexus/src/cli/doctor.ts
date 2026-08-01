import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getRuntimeCapabilities, getRuntimeFingerprint } from '../core/platform/capabilities.js';
import { resolveEmbeddingConfig } from '../core/embeddings/config.js';
import { isHttpMode } from '../core/embeddings/http-client.js';
import {
  getLocalEmbeddingRuntimeBlocker,
  localEmbeddingPrefixUnloadableMessage,
  localEmbeddingStackMissingMessage,
} from '../core/embeddings/runtime-support.js';
import {
  isPrefixRuntimeLoadable,
  resolveEmbeddingRuntime,
  type EmbeddingRuntimeResolution,
} from '../core/embeddings/runtime-install.js';
import { cudaRedirectDoctorStatus } from '../core/embeddings/onnxruntime-node-resolver.js';
import {
  getEffectiveBufferPoolSize,
  getOsPageSize,
  isPageSizeAwareLadybug,
} from '../core/lbug/lbug-config.js';
import { diagnoseExtensionLoad } from '../core/lbug/extension-load-error.js';
import { probeFtsExtensionLoad, probeVectorExtensionLoad } from '../core/lbug/native-check.js';
import { getExtensionInstallPolicy } from '../core/lbug/extension-loader.js';
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

/**
 * Embedding-runtime support status for the `doctor` Embeddings section.
 * Pure and DI-friendly so it can be unit-tested without running the whole
 * command. Delegates the platform decision to
 * {@link getLocalEmbeddingRuntimeBlocker} so the wording stays in one place.
 *
 * - HTTP mode: always supported (never touches the native runtime).
 * - Local mode on an unsupported platform (macOS Intel, #1515): reports the
 *   blocker as `detail` so the caller can surface the full guidance.
 */
export function localEmbeddingDoctorStatus(opts: {
  httpMode: boolean;
  platform?: NodeJS.Platform;
  arch?: NodeJS.Architecture;
  /** Injectable for tests; defaults to probing the real install. */
  resolution?: EmbeddingRuntimeResolution | null;
  /** Injectable for tests; defaults to this Node's registerHooks capability. */
  prefixLoadable?: boolean;
}): { status: string; detail: string | null } {
  if (opts.httpMode) {
    return { status: '✓ http endpoint configured', detail: null };
  }
  const platform = opts.platform ?? process.platform;
  const arch = opts.arch ?? process.arch;
  const blocker = getLocalEmbeddingRuntimeBlocker({ platform, arch });
  if (blocker) {
    return { status: `✗ local embeddings unavailable on ${platform}/${arch}`, detail: blocker };
  }
  // The stack is an optionalDependency — npm prunes it when onnxruntime-node's
  // postinstall can't download its CUDA binaries (proxy/firewall, #2370).
  const resolution = opts.resolution !== undefined ? opts.resolution : resolveEmbeddingRuntime();
  if (resolution === null) {
    return {
      status: '✗ optional embedding stack not installed',
      detail: localEmbeddingStackMissingMessage(),
    };
  }
  // A prefix-sourced stack needs module.registerHooks to load; on Node < 22.15 /
  // < 23.5 it is present but unreachable (#2372). Report loadability, not bare
  // presence, so the diagnostic stops claiming a ✓ the loader can't honour.
  const prefixLoadable = opts.prefixLoadable ?? isPrefixRuntimeLoadable();
  if (resolution.source === 'runtime-prefix' && !prefixLoadable) {
    return {
      status: '✗ embedding stack installed in the prefix but not loadable on this Node',
      detail: localEmbeddingPrefixUnloadableMessage(),
    };
  }
  return { status: '✓ local embeddings supported', detail: null };
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

/**
 * Page-size lines for the `doctor` Runtime section (#1231). Pure so the
 * warning gate can be unit-tested without running the whole command (the
 * `localEmbeddingDoctorStatus` precedent above) — but takes the probed
 * values as plain params rather than injectable probes, because `undefined`
 * is a *meaningful* pageSize state here (probe unavailable / win32) and
 * would collide with a "not provided → use default" DI convention.
 *
 * Returns 0 lines (page size unknown), 1 line (page size), or 2 lines
 * (page size + non-4K warning when the installed @ladybugdb/core does not
 * detect the OS page size at runtime).
 */
export function pageSizeDoctorLines(
  pageSize: number | undefined,
  ladybugVersion: string | undefined,
): string[] {
  if (pageSize === undefined) return [];
  const lines = [`  ${padDisplayEnd('page size', 10)}${pageSize}`];
  if (pageSize > 4096 && !isPageSizeAwareLadybug(ladybugVersion)) {
    // Don't assert "< 0.18.0" as fact when the version is unresolvable
    // (#2424 review R2) — name the unknown state instead.
    const versionClause =
      ladybugVersion === undefined
        ? 'an unknown @ladybugdb/core version (may predate 0.18.0)'
        : `@ladybugdb/core < 0.18.0`;
    lines.push(
      `  ${padDisplayEnd('', 10)}⚠ non-4K page size with ${versionClause} — ` +
        `'gitnexus analyze' may fail during COPY (#1231). Upgrade gitnexus (npm install -g gitnexus@latest).`,
    );
  }
  return lines;
}

/**
 * The hintless buffer-pool doctor line (#2631) — the pool the next Database
 * open in THIS process would get. Same plain-params testable-helper shape as
 * pageSizeDoctorLines above. `pool` is getEffectiveBufferPoolSize(): `0` is
 * the pass-through sentinel for LadybugDB's native 80%-of-RAM default, never
 * printed as "0 MiB". `envRaw` (the raw GITNEXUS_LBUG_BUFFER_POOL_SIZE value)
 * marks operator-supplied absolute values as "(env override)" — no scaling
 * suffix: the hintless default is deliberately unscaled (#2557), and an env
 * value is absolute, so a "×N" note would misdescribe both.
 */
export function poolSizeDoctorLine(pool: number, envRaw: string | undefined): string {
  const value = pool === 0 ? 'native 80% of RAM' : `${Math.round(pool / (1024 * 1024))} MiB`;
  const envNote = envRaw !== undefined && envRaw.trim().length > 0 ? ' (env override)' : '';
  return `  ${padDisplayEnd('pool size', 10)}${value}${envNote}`;
}

/**
 * The `native` status line. Literal label like the page-size and pool-size lines
 * above (no i18n key).
 *
 * A failed check is not automatically a MISSING binary, and saying so is the
 * same misdiagnosis #2672 fixed one layer down: on a host whose glibc is too
 * old, `lbugjs.node` is present and merely unloadable, so "missing" sent users
 * to reinstall a file that was already there — while the detail written to
 * stderr right below said the opposite. Render what the check actually found.
 */
export function nativeStatusLine(check: NativeCheckResult): string {
  return `  ${padDisplayEnd('native', 10)}${nativeStatusText(check)}`;
}

function nativeStatusText(check: NativeCheckResult): string {
  if (check.ok) return '✓ lbugjs.node loaded';
  switch (check.kind) {
    case 'package_missing':
      return '✗ @ladybugdb/core not installed';
    case 'load_failed':
      return '✗ lbugjs.node present but failed to load';
    default:
      // 'binary_missing', and any future kind: the conservative claim.
      return '✗ lbugjs.node missing';
  }
}

async function printTextDoctor(result: DoctorResult): Promise<void> {
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

  console.log(t('doctor.title') + '\n');
  console.log(t('doctor.runtime'));
  console.log(`  ${label('doctor.labels.os', 10)}${fingerprint.platform}/${fingerprint.arch}`);
  console.log(`  ${label('doctor.labels.node', 10)}${fingerprint.node}`);
  console.log(`  ${label('doctor.labels.gitnexus', 10)}${fingerprint.gitnexus}`);
  console.log(`  ${label('doctor.labels.ladybugdb', 10)}${fingerprint.ladybugdb ?? 'unknown'}`);
  // OS page size next to the LadybugDB version because the two interact:
  // @ladybugdb/core < 0.18.0 assumed 4 KiB pages in its buffer manager and
  // crashes mid-COPY on 16 KiB/64 KiB-page kernels (#1231). Literal label
  // (like the 'native' line below) to avoid adding i18n keys.
  for (const line of pageSizeDoctorLines(getOsPageSize(), fingerprint.ladybugdb)) {
    console.log(line);
  }
  // Hintless buffer pool for the next DB open (#2631). Literal label like
  // the page size line above (no i18n key).
  console.log(
    poolSizeDoctorLine(getEffectiveBufferPoolSize(), process.env.GITNEXUS_LBUG_BUFFER_POOL_SIZE),
  );
  const nativeCheck = checkLbugNative();
  console.log(nativeStatusLine(nativeCheck));
  if (!nativeCheck.ok) {
    process.stderr.write(`\n${nativeCheck.message?.replace(/^/gm, '  ')}\n\n`);
  }
  console.log(`  ${label('doctor.labels.onnx', 10)}${fingerprint.onnxruntime ?? 'unknown'}`);
  console.log('');
  console.log(t('doctor.capabilities'));
  console.log(`  ${label('doctor.labels.graphStore', 18)}${capabilities.graph}`);
  // Live LOAD probe, not the static platform capability — the static value
  // said "available" while analyze failed to load the extension (#2374).
  const ftsProbe = nativeCheck.ok
    ? await probeFtsExtensionLoad()
    : { loaded: false, reason: 'LadybugDB native module (lbugjs.node) failed to load' };
  console.log(
    `  ${label('doctor.labels.fullTextSearch', 18)}${ftsProbe.loaded ? 'available' : 'unavailable'}`,
  );
  if (!ftsProbe.loaded && ftsProbe.reason) {
    console.log(`  ${padDisplayEnd('', 18)}${ftsProbe.reason}`);
    // Add an actionable remedy for recognized failure classes (#2374). The
    // Windows missing-dependency case is the point of this: the raw error 126
    // ("specified module could not be found") is opaque, so name the fix (VC++
    // redist, then OpenSSL) instead of leaving the user to reinstall in vain.
    // `unknown`'s remedy is "run doctor", which would be circular here.
    const { kind, remedy } = diagnoseExtensionLoad(ftsProbe.reason);
    if (kind !== 'unknown') {
      console.log(`  ${padDisplayEnd('', 18)}${remedy}`);
    }
  }
  // Live LOAD probe for VECTOR too (#2623). The static capability is just
  // `platform !== 'win32'`, so it printed "available" on the very machines
  // where analyze was failing to load the extension — the same contradiction
  // #2374 fixed for FTS above, and exactly what #2623's reporter saw while
  // every incremental analyze died on an unloaded VECTOR extension.
  const vectorProbe = nativeCheck.ok
    ? await probeVectorExtensionLoad()
    : { loaded: false, reason: 'LadybugDB native module (lbugjs.node) failed to load' };
  console.log(
    `  ${label('doctor.labels.vectorIndex', 18)}${vectorProbe.loaded ? 'available' : 'unavailable'}`,
  );
  if (!vectorProbe.loaded && vectorProbe.reason) {
    console.log(`  ${padDisplayEnd('', 18)}${vectorProbe.reason}`);
    const { kind, remedy } = diagnoseExtensionLoad(vectorProbe.reason, 'VECTOR');
    if (kind !== 'unknown') {
      console.log(`  ${padDisplayEnd('', 18)}${remedy}`);
    }
  }
  // Semantic mode follows the probe, not the platform: without a loadable
  // VECTOR extension the index can be neither built nor queried, so search is
  // really on exact scan no matter what the platform would allow.
  console.log(
    `  ${label('doctor.labels.semanticMode', 18)}${
      vectorProbe.loaded ? capabilities.semanticMode : 'exact-scan'
    }`,
  );
  // Surface the optional-extension install policy so offline users can see
  // whether analyze/query will reach the network (extension.ladybugdb.com).
  // Literal label (like the 'native' line) to avoid adding i18n keys.
  const installPolicy = getExtensionInstallPolicy();
  const policyHint =
    installPolicy === 'load-only'
      ? ' (offline; load only, no network install)'
      : installPolicy === 'never'
        ? ' (optional extensions disabled)'
        : ' (installs missing extensions over network)';
  console.log(`  ${padDisplayEnd('Ext install:', 18)}${installPolicy}${policyHint}`);
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
  const support = localEmbeddingDoctorStatus({ httpMode: embeddings.backend === 'http' });
  console.log(`  ${padDisplayEnd('Support:', 12)}${support.status}`);
  if (support.detail) {
    process.stderr.write(`\n${support.detail.replace(/^/gm, '  ')}\n\n`);
  }
  // Surface the CUDA-build-redirect decision so "why is my CUDA-13 host
  // still on CPU" is visible without digging through debug logs (#2341
  // follow-up). Only meaningful on the local runtime path.
  if (!isHttpMode()) {
    const cudaRedirect = cudaRedirectDoctorStatus();
    console.log(`  ${padDisplayEnd('CUDA:', 12)}${cudaRedirect.status}`);
    if (cudaRedirect.detail) {
      console.log(`  ${padDisplayEnd('', 12)}${cudaRedirect.detail}`);
    }
  }

  for (const check of result.checks) {
    if (['runtime', 'native-runtime', 'capabilities', 'embeddings'].includes(check.name)) continue;
    console.log('');
    console.log(`${check.name}: ${check.status}`);
    if (check.detail) console.log(`  ${check.detail.replace(/\n/g, '\n  ')}`);
  }
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
    await printTextDoctor(result);
  }

  if (result.overall === 'fail') {
    process.exitCode = 1;
  }
};
