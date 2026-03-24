/**
 * Analyze Command
 *
 * Indexes a repository and stores the knowledge graph in .gitnexus/
 */

import path from 'path';
import { execFile, execFileSync } from 'child_process';
import v8 from 'v8';
import cliProgress from 'cli-progress';
import { runPipelineFromRepo } from '../core/ingestion/pipeline.js';
import { initKuzu, loadGraphToKuzu, getKuzuStats, executeQuery, executeWithReusedStatement, closeKuzu, createFTSIndex, loadCachedEmbeddings } from '../core/kuzu/kuzu-adapter.js';
// Embedding imports are lazy (dynamic import) so onnxruntime-node is never
// loaded when embeddings are not requested. This avoids crashes on Node
// versions whose ABI is not yet supported by the native binary (#89).
// disposeEmbedder intentionally not called — ONNX Runtime segfaults on cleanup (see #38)
import { getStoragePaths, saveMeta, loadMeta, addToGitignore, registerRepo, getGlobalRegistryPath } from '../storage/repo-manager.js';
import { getCurrentCommit, isGitRepo, getGitRoot } from '../storage/git.js';
import { generateAIContextFiles } from './ai-context.js';
import { generateSkillFiles, type GeneratedSkillInfo } from './skill-gen.js';
import { getIndexFreshness, getGitNexusVersion } from './index-freshness.js';
import { getCliEmbeddingConfig, getEmbeddingNodeLimit } from './embedding-overrides.js';
import {
  formatEmbeddingRunDetails,
  formatEmbeddingSkipReason,
  shouldSuggestIncrementalEmbeddingRefresh,
} from './embedding-insights.js';
import { getEmbeddingRuntimeConfig } from '../core/embeddings/runtime-config.js';
import { nativeRuntimeManager } from '../runtime/native-runtime-manager.js';
import fs from 'fs/promises';


const HEAP_MB = 8192;
const HEAP_FLAG = `--max-old-space-size=${HEAP_MB}`;

/** Re-exec the process with an 8GB heap if we're currently below that. */
function ensureHeap(): boolean {
  const nodeOpts = process.env.NODE_OPTIONS || '';
  if (nodeOpts.includes('--max-old-space-size')) return false;

  const v8Heap = v8.getHeapStatistics().heap_size_limit;
  if (v8Heap >= HEAP_MB * 1024 * 1024 * 0.9) return false;

  try {
    execFileSync(process.execPath, [HEAP_FLAG, ...process.argv.slice(1)], {
      stdio: 'inherit',
      env: { ...process.env, NODE_OPTIONS: `${nodeOpts} ${HEAP_FLAG}`.trim() },
    });
  } catch (e: any) {
    process.exitCode = e.status ?? 1;
  }
  return true;
}

export interface AnalyzeOptions {
  force?: boolean;
  embeddings?: boolean;
  skills?: boolean;
  verbose?: boolean;
  context?: boolean;
  gitignore?: boolean;
  register?: boolean;
  noContext?: boolean;
  noGitignore?: boolean;
  noRegister?: boolean;
}

export interface AnalyzeScopeOptions {
  registerRepo: boolean;
  updateGitignore: boolean;
  refreshContext: boolean;
}

function isEnabledOption(
  enabledValue: boolean | undefined,
  legacyDisabledValue: boolean | undefined,
): boolean {
  if (typeof enabledValue === 'boolean') {
    return enabledValue;
  }

  return legacyDisabledValue !== true;
}

export function resolveAnalyzeScopeOptions(options: AnalyzeOptions = {}): AnalyzeScopeOptions {
  return {
    registerRepo: isEnabledOption(options.register, options.noRegister),
    updateGitignore: isEnabledOption(options.gitignore, options.noGitignore),
    refreshContext: isEnabledOption(options.context, options.noContext),
  };
}

export const shouldSkipAnalyze = (
  existingMeta: { lastCommit?: string; toolVersion?: string } | null,
  currentCommit: string,
  currentToolVersion: string,
  options?: AnalyzeOptions,
): boolean => {
  if (!existingMeta || options?.force || options?.skills) {
    return false;
  }

  return getIndexFreshness(existingMeta as any, currentCommit, currentToolVersion).isUpToDate;
};

const PHASE_LABELS: Record<string, string> = {
  extracting: 'Scanning files',
  structure: 'Building structure',
  parsing: 'Parsing code',
  imports: 'Resolving imports',
  calls: 'Tracing calls',
  heritage: 'Extracting inheritance',
  communities: 'Detecting communities',
  processes: 'Detecting processes',
  complete: 'Pipeline complete',
  kuzu: 'Loading into KuzuDB',
  fts: 'Creating search indexes',
  embeddings: 'Generating embeddings',
  done: 'Done',
};

const DEFAULT_MCP_QUIESCE_TIMEOUT_MS = 15_000;
const DEFAULT_MCP_POLL_INTERVAL_MS = 250;

interface ProcScanOptions {
  procRoot?: string;
  platform?: NodeJS.Platform;
  runLsof?: (targetPath: string) => Promise<string>;
  readPidArgv?: (pid: string) => Promise<string[]>;
}

interface QuiesceGitNexusMcpHoldersOptions {
  findHolders?: () => Promise<string[]>;
  terminatePid?: (pid: number) => Promise<void>;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

const parseProcCmdline = (raw: string): string[] =>
  raw.split('\0').filter(Boolean);

const isGitNexusMcpCommand = (argv: string[]): boolean =>
  argv.includes('mcp') && argv.some(arg => arg.includes('gitnexus'));

const execFileText = (command: string, args: string[]): Promise<string> =>
  new Promise((resolve, reject) => {
    execFile(command, args, { encoding: 'utf8' }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });

const defaultRunLsof = (targetPath: string): Promise<string> =>
  execFileText('lsof', ['-Fpn', '--', targetPath]);

const defaultReadPidArgv = async (pid: string): Promise<string[]> => {
  const output = await execFileText('ps', ['-p', pid, '-o', 'command=']);
  return output.trim().split(/\s+/).filter(Boolean);
};

const parseLsofPidOutput = (raw: string): string[] => {
  const holderPids = new Set<string>();
  for (const line of raw.split('\n')) {
    if (!line.startsWith('p')) continue;
    const pid = line.slice(1).trim();
    if (/^\d+$/.test(pid)) {
      holderPids.add(pid);
    }
  }
  return [...holderPids].sort((left, right) => Number(left) - Number(right));
};

export const listGitNexusMcpPidsHoldingPath = async (
  targetPath: string,
  options: ProcScanOptions = {},
): Promise<string[]> => {
  const platform = options.platform ?? process.platform;
  const procRoot = options.procRoot ?? '/proc';
  if (!options.procRoot && platform !== 'linux') {
    try {
      const runLsof = options.runLsof ?? defaultRunLsof;
      const readPidArgv = options.readPidArgv ?? defaultReadPidArgv;
      const output = await runLsof(targetPath);
      const pids = parseLsofPidOutput(output);
      const holderPids: string[] = [];
      for (const pid of pids) {
        try {
          const argv = await readPidArgv(pid);
          if (isGitNexusMcpCommand(argv)) {
            holderPids.push(pid);
          }
        } catch {
          // process may disappear while scanning; ignore
        }
      }
      holderPids.sort((left, right) => Number(left) - Number(right));
      return holderPids;
    } catch {
      return [];
    }
  }

  const normalizedTarget = path.resolve(targetPath);
  const holderPids: string[] = [];

  let entries: string[] = [];
  try {
    entries = await fs.readdir(procRoot);
  } catch {
    return [];
  }

  for (const entry of entries) {
    if (!/^\d+$/.test(entry)) continue;

    const pidDir = path.join(procRoot, entry);
    let argv: string[];
    try {
      const rawCmdline = await fs.readFile(path.join(pidDir, 'cmdline'), 'utf8');
      argv = parseProcCmdline(rawCmdline);
    } catch {
      continue;
    }

    if (!isGitNexusMcpCommand(argv)) continue;

    let fdEntries: string[] = [];
    try {
      fdEntries = await fs.readdir(path.join(pidDir, 'fd'));
    } catch {
      continue;
    }

    for (const fdEntry of fdEntries) {
      try {
        const linkTarget = await fs.readlink(path.join(pidDir, 'fd', fdEntry));
        if (path.resolve(linkTarget) === normalizedTarget) {
          holderPids.push(entry);
          break;
        }
      } catch {
        // fd may disappear while scanning; ignore
      }
    }
  }

  holderPids.sort((left, right) => Number(left) - Number(right));
  return holderPids;
};

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export const quiesceGitNexusMcpHolders = async (
  targetPath: string,
  options: QuiesceGitNexusMcpHoldersOptions = {},
): Promise<{ terminatedPids: number[]; waitTimedOut: boolean }> => {
  const findHolders = options.findHolders ?? (() => listGitNexusMcpPidsHoldingPath(targetPath));
  const terminatePid = options.terminatePid ?? (async (pid: number) => {
    try {
      process.kill(pid, 'SIGTERM');
    } catch (err: any) {
      if (err?.code !== 'ESRCH') throw err;
    }
  });
  const delay = options.sleep ?? sleep;
  const timeoutMs = options.timeoutMs ?? DEFAULT_MCP_QUIESCE_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_MCP_POLL_INTERVAL_MS;

  const initialHolders = await findHolders();
  if (initialHolders.length === 0) {
    return { terminatedPids: [], waitTimedOut: false };
  }

  const terminatedPids: number[] = [];
  for (const pidText of initialHolders) {
    const pid = Number(pidText);
    if (!Number.isInteger(pid)) continue;
    await terminatePid(pid);
    terminatedPids.push(pid);
  }

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const remaining = await findHolders();
    if (remaining.length === 0) {
      return { terminatedPids, waitTimedOut: false };
    }
    await delay(pollIntervalMs);
  }

  return { terminatedPids, waitTimedOut: (await findHolders()).length > 0 };
};

export const analyzeCommand = async (
  inputPath?: string,
  options?: AnalyzeOptions
) => {
  if (ensureHeap()) return;

  if (options?.verbose) {
    process.env.GITNEXUS_VERBOSE = '1';
  }

  console.log('\n  GitNexus Analyzer\n');

  let repoPath: string;
  if (inputPath) {
    repoPath = path.resolve(inputPath);
  } else {
    const gitRoot = getGitRoot(process.cwd());
    if (!gitRoot) {
      console.log('  Not inside a git repository\n');
      process.exitCode = 1;
      return;
    }
    repoPath = gitRoot;
  }

  if (!isGitRepo(repoPath)) {
    console.log('  Not a git repository\n');
    process.exitCode = 1;
    return;
  }

  const { storagePath, kuzuPath } = getStoragePaths(repoPath);
  const currentCommit = getCurrentCommit(repoPath);
  const existingMeta = await loadMeta(storagePath);
  const gitNexusVersion = getGitNexusVersion();
  const scope = resolveAnalyzeScopeOptions(options);

  if (shouldSkipAnalyze(existingMeta, currentCommit, gitNexusVersion, options)) {
    console.log('  Already up to date\n');
    return;
  }

  // Route all console output through bar.log() so the bar doesn't stamp itself
  // multiple times when other code writes to stdout/stderr mid-render.
  const origLog = console.log.bind(console);
  const origWarn = console.warn.bind(console);
  const origError = console.error.bind(console);
  const reindexLockPath = await nativeRuntimeManager.writeReindexLock(storagePath);
  let bar: cliProgress.SingleBar | null = null;
  let elapsedTimer: ReturnType<typeof setInterval> | null = null;
  let forceExitCode: number | null = null;
  let aborted = false;
  const barLog = (...args: any[]) => {
    // Clear the bar line, print the message, then let the next bar.update redraw
    process.stdout.write('\x1b[2K\r');
    origLog(args.map(a => (typeof a === 'string' ? a : String(a))).join(' '));
  };
  const shutdownHandler = (exitCode: number) => {
    if (aborted) process.exit(1); // Second Ctrl-C: force exit
    aborted = true;
    try { bar?.stop(); } catch {}
    console.log('\n  Interrupted — cleaning up...');
    void nativeRuntimeManager.runCleanupAndExit(exitCode, {
      cleanup: async () => {
        try { await closeKuzu(); } catch {}
        await nativeRuntimeManager.removeReindexLock(reindexLockPath);
      },
      scheduleExit: async (code) => {
        nativeRuntimeManager.scheduleExit(code);
      },
    });
  };
  const onSigInt = () => shutdownHandler(130);
  const onSigTerm = () => shutdownHandler(143);
  const unregisterShutdownHandlers = nativeRuntimeManager.registerShutdownHandlers(process, onSigInt, onSigTerm);

  try {
    const quiesceResult = await quiesceGitNexusMcpHolders(kuzuPath);
    if (quiesceResult.terminatedPids.length > 0) {
      console.log(`  Stopped ${quiesceResult.terminatedPids.length} GitNexus MCP process(es) holding ${kuzuPath}`);
    }
    if (quiesceResult.waitTimedOut) {
      const remaining = await listGitNexusMcpPidsHoldingPath(kuzuPath);
      console.log(`  Timed out waiting for GitNexus MCP to release ${kuzuPath}`);
      if (remaining.length > 0) {
        console.log(`  Remaining holder PIDs: ${remaining.join(', ')}`);
      }
      process.exitCode = 1;
      return;
    }

    // Single progress bar for entire pipeline
    bar = new cliProgress.SingleBar({
      format: '  {bar} {percentage}% | {phase}',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true,
      barGlue: '',
      autopadding: true,
      clearOnComplete: false,
      stopOnComplete: false,
    }, cliProgress.Presets.shades_grey);

    bar.start(100, 0, { phase: 'Initializing...' });
    console.log = barLog;
    console.warn = barLog;
    console.error = barLog;

    // Track elapsed time per phase — both updateBar and the interval use the
    // same format so they don't flicker against each other.
    let lastPhaseLabel = 'Initializing...';
    let phaseStart = Date.now();

    /** Update bar with phase label + elapsed seconds (shown after 3s). */
    const updateBar = (value: number, phaseLabel: string) => {
      if (phaseLabel !== lastPhaseLabel) { lastPhaseLabel = phaseLabel; phaseStart = Date.now(); }
      const elapsed = Math.round((Date.now() - phaseStart) / 1000);
      const display = elapsed >= 3 ? `${phaseLabel} (${elapsed}s)` : phaseLabel;
      bar!.update(value, { phase: display });
    };

    // Tick elapsed seconds for phases with infrequent progress callbacks
    // (e.g. CSV streaming, FTS indexing). Uses the same display format as
    // updateBar so there's no flickering.
    elapsedTimer = setInterval(() => {
      const elapsed = Math.round((Date.now() - phaseStart) / 1000);
      if (elapsed >= 3) {
        bar!.update({ phase: `${lastPhaseLabel} (${elapsed}s)` });
      }
    }, 1000);

    const t0Global = Date.now();

    // ── Cache embeddings from existing index before rebuild ────────────
    let cachedEmbeddingNodeIds = new Set<string>();
    let cachedEmbeddings: Array<{ nodeId: string; embedding: number[] }> = [];

    if (options?.embeddings && existingMeta && !options?.force) {
      try {
        updateBar(0, 'Caching embeddings...');
        await initKuzu(kuzuPath);
        const cached = await loadCachedEmbeddings();
        cachedEmbeddingNodeIds = cached.embeddingNodeIds;
        cachedEmbeddings = cached.embeddings;
        await closeKuzu();
      } catch {
        try { await closeKuzu(); } catch {}
      }
    }

    // ── Phase 1: Full Pipeline (0–60%) ─────────────────────────────────
    const pipelineResult = await runPipelineFromRepo(repoPath, (progress) => {
      const phaseLabel = PHASE_LABELS[progress.phase] || progress.phase;
      const scaled = Math.round(progress.percent * 0.6);
      updateBar(scaled, phaseLabel);
    });

    // ── Phase 2: KuzuDB (60–85%) ──────────────────────────────────────
    updateBar(60, 'Loading into KuzuDB...');

    await closeKuzu();
    const kuzuFiles = [kuzuPath, `${kuzuPath}.wal`, `${kuzuPath}.lock`];
    for (const f of kuzuFiles) {
      try { await fs.rm(f, { recursive: true, force: true }); } catch {}
    }

    const t0Kuzu = Date.now();
    await initKuzu(kuzuPath);
    let kuzuMsgCount = 0;
    const kuzuResult = await loadGraphToKuzu(pipelineResult.graph, pipelineResult.repoPath, storagePath, (msg) => {
      kuzuMsgCount++;
      const progress = Math.min(84, 60 + Math.round((kuzuMsgCount / (kuzuMsgCount + 10)) * 24));
      updateBar(progress, msg);
    });
    const kuzuTime = ((Date.now() - t0Kuzu) / 1000).toFixed(1);
    const kuzuWarnings = kuzuResult.warnings;

    // ── Phase 3: FTS (85–90%) ─────────────────────────────────────────
    updateBar(85, 'Creating search indexes...');

    const t0Fts = Date.now();
    try {
      await createFTSIndex('File', 'file_fts', ['name', 'content']);
      await createFTSIndex('Function', 'function_fts', ['name', 'content']);
      await createFTSIndex('Class', 'class_fts', ['name', 'content']);
      await createFTSIndex('Method', 'method_fts', ['name', 'content']);
      await createFTSIndex('Interface', 'interface_fts', ['name', 'content']);
    } catch {
      // Non-fatal — FTS is best-effort
    }
    const ftsTime = ((Date.now() - t0Fts) / 1000).toFixed(1);

    // ── Phase 3.5: Re-insert cached embeddings ────────────────────────
    if (cachedEmbeddings.length > 0) {
      updateBar(88, `Restoring ${cachedEmbeddings.length} cached embeddings...`);
      const EMBED_BATCH = 200;
      for (let i = 0; i < cachedEmbeddings.length; i += EMBED_BATCH) {
        const batch = cachedEmbeddings.slice(i, i + EMBED_BATCH);
        const paramsList = batch.map(e => ({ nodeId: e.nodeId, embedding: e.embedding }));
        try {
          await executeWithReusedStatement(
            `CREATE (e:CodeEmbedding {nodeId: $nodeId, embedding: $embedding})`,
            paramsList,
          );
        } catch { /* some may fail if node was removed, that's fine */ }
      }
    }

    // ── Phase 4: Embeddings (90–98%) ──────────────────────────────────
    const stats = await getKuzuStats();
    const embeddingNodeLimit = getEmbeddingNodeLimit();
    const embeddingConfig = getCliEmbeddingConfig();
    const embeddingRuntimeConfig = getEmbeddingRuntimeConfig();
    const { countEmbeddableNodes } = await import('../core/embeddings/embedding-pipeline.js');
    const embeddableNodeCount = options?.embeddings ? await countEmbeddableNodes(executeQuery) : 0;
    let embeddingTime = '0.0';
    let embeddingSkipped = true;
    let embeddingSkipReason = 'off (use --embeddings to enable)';
    let embeddingDetail = '';

    if (options?.embeddings) {
      if (embeddableNodeCount > embeddingNodeLimit) {
        embeddingSkipReason = formatEmbeddingSkipReason(embeddableNodeCount, embeddingNodeLimit);
        embeddingDetail = `${embeddableNodeCount.toLocaleString()} embeddable | limit ${embeddingNodeLimit.toLocaleString()}`;
      } else {
        embeddingSkipped = false;
      }
    }

    if (!embeddingSkipped) {
      updateBar(90, 'Loading embedding model...');
      const t0Emb = Date.now();
      const { runEmbeddingPipeline } = await import('../core/embeddings/embedding-pipeline.js');
      const embeddingStats = await runEmbeddingPipeline(
        executeQuery,
        executeWithReusedStatement,
        (progress) => {
          const scaled = 90 + Math.round((progress.percent / 100) * 8);
          const label = progress.phase === 'loading-model'
            ? 'Loading embedding model...'
            : progress.phase === 'embedding'
              ? `Embedding ${progress.nodesProcessed || 0}/${progress.totalNodes || '?'} (batch ${progress.currentBatch || 0}/${progress.totalBatches || '?'})`
              : `Embedding ${progress.nodesProcessed || 0}/${progress.totalNodes || '?'}`;
          updateBar(scaled, label);
        },
        embeddingConfig,
        cachedEmbeddingNodeIds.size > 0 ? cachedEmbeddingNodeIds : undefined,
      );
      const embeddingSeconds = (Date.now() - t0Emb) / 1000;
      embeddingTime = embeddingSeconds.toFixed(1);
      embeddingDetail = formatEmbeddingRunDetails({
        provider: embeddingRuntimeConfig.provider,
        model: embeddingRuntimeConfig.provider === 'ollama'
          ? embeddingRuntimeConfig.ollamaModel
          : (embeddingConfig.modelId || embeddingRuntimeConfig.localModelPath || 'Snowflake/snowflake-arctic-embed-xs'),
        embeddableNodeCount: embeddableNodeCount || embeddingStats.embeddableNodeCount,
        totalBatches: embeddingStats.totalBatches,
        batchSize: embeddingStats.batchSize,
        seconds: embeddingSeconds,
      });
    }

    // ── Phase 5: Finalize (98–100%) ───────────────────────────────────
    updateBar(98, 'Saving metadata...');

    // Count embeddings in the index (cached + newly generated)
    let embeddingCount = 0;
    try {
      const embResult = await executeQuery(`MATCH (e:CodeEmbedding) RETURN count(e) AS cnt`);
      embeddingCount = embResult?.[0]?.cnt ?? 0;
    } catch { /* table may not exist if embeddings never ran */ }

    const meta = {
      repoPath,
      lastCommit: currentCommit,
      indexedAt: new Date().toISOString(),
      toolVersion: gitNexusVersion,
      stats: {
        files: pipelineResult.totalFileCount,
        nodes: stats.nodes,
        edges: stats.edges,
        communities: pipelineResult.communityResult?.stats.totalCommunities,
        processes: pipelineResult.processResult?.stats.totalProcesses,
        embeddings: embeddingCount,
      },
    };
    await saveMeta(storagePath, meta);

    if (scope.registerRepo) {
      await registerRepo(repoPath, meta);
    }

    if (scope.updateGitignore) {
      await addToGitignore(repoPath);
    }

    const projectName = path.basename(repoPath);
    let aggregatedClusterCount = 0;
    if (pipelineResult.communityResult?.communities) {
      const groups = new Map<string, number>();
      for (const c of pipelineResult.communityResult.communities) {
        const label = c.heuristicLabel || c.label || 'Unknown';
        groups.set(label, (groups.get(label) || 0) + c.symbolCount);
      }
      aggregatedClusterCount = Array.from(groups.values()).filter(count => count >= 5).length;
    }

    let generatedSkills: GeneratedSkillInfo[] = [];
    if (options?.skills && pipelineResult.communityResult) {
      updateBar(99, 'Generating skill files...');
      const skillResult = await generateSkillFiles(repoPath, projectName, pipelineResult);
      generatedSkills = skillResult.skills;
    }

    let aiContext = { files: [] as string[] };
    if (scope.refreshContext) {
      aiContext = await generateAIContextFiles(repoPath, storagePath, projectName, {
        files: pipelineResult.totalFileCount,
        nodes: stats.nodes,
        edges: stats.edges,
        communities: pipelineResult.communityResult?.stats.totalCommunities,
        clusters: aggregatedClusterCount,
        processes: pipelineResult.processResult?.stats.totalProcesses,
      }, generatedSkills);
    }

    await nativeRuntimeManager.cleanupCoreRuntime(closeKuzu);

    const totalTime = ((Date.now() - t0Global) / 1000).toFixed(1);

    console.log = origLog;
    console.warn = origWarn;
    console.error = origError;

    bar.update(100, { phase: 'Done' });
    bar.stop();

    // ── Summary ───────────────────────────────────────────────────────
    const embeddingsCached = cachedEmbeddings.length > 0;
    console.log(`\n  Repository indexed successfully (${totalTime}s)${embeddingsCached ? ` [${cachedEmbeddings.length} embeddings cached]` : ''}\n`);
    console.log(`  ${stats.nodes.toLocaleString()} nodes | ${stats.edges.toLocaleString()} edges | ${pipelineResult.communityResult?.stats.totalCommunities || 0} clusters | ${pipelineResult.processResult?.stats.totalProcesses || 0} flows`);
    console.log(`  KuzuDB ${kuzuTime}s | FTS ${ftsTime}s | Embeddings ${embeddingSkipped ? embeddingSkipReason : embeddingTime + 's'}`);
    if (options?.embeddings && embeddingDetail) {
      console.log(`  Embeddings detail: ${embeddingDetail}`);
    }
    console.log(`  ${repoPath}`);

    if (aiContext.files.length > 0) {
      console.log(`  Context: ${aiContext.files.join(', ')}`);
    }

    // Show a quiet summary if some edge types needed fallback insertion
    if (kuzuWarnings.length > 0) {
      const totalFallback = kuzuWarnings.reduce((sum, w) => {
        const m = w.match(/\((\d+) edges\)/);
        return sum + (m ? parseInt(m[1]) : 0);
      }, 0);
      console.log(`  Note: ${totalFallback} edges across ${kuzuWarnings.length} types inserted via fallback (schema will be updated in next release)`);
    }

    if (shouldSuggestIncrementalEmbeddingRefresh(options?.force, options?.embeddings, embeddingCount)) {
      console.log('  Tip: Future refreshes usually omit `--force` so GitNexus can reuse existing embeddings.');
    }

    try {
      await fs.access(getGlobalRegistryPath());
    } catch {
      console.log('\n  Tip: Run `gitnexus setup` to configure MCP for your editor.');
    }

    console.log('');

    // KuzuDB's native module holds open handles that prevent Node from exiting.
    // ONNX Runtime also registers native atexit hooks that segfault on some
    // platforms (#38, #40). Force-exit to ensure clean termination.
    forceExitCode = 0;
  } finally {
    if (elapsedTimer) {
      clearInterval(elapsedTimer);
    }
    unregisterShutdownHandlers();
    try { await nativeRuntimeManager.cleanupCoreRuntime(closeKuzu); } catch {}
    console.log = origLog;
    console.warn = origWarn;
    console.error = origError;
    await nativeRuntimeManager.removeReindexLock(reindexLockPath);
  }

  if (forceExitCode !== null) {
    await nativeRuntimeManager.runCleanupAndExit(forceExitCode, {
      scheduleExit: async (code) => {
        nativeRuntimeManager.scheduleExit(code);
      },
    });
  }
};
