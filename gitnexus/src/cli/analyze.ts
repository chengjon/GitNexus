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
import { getStoragePaths, saveMeta, loadMeta, addToGitignore, addToGitInfoExclude, registerRepo, getGlobalRegistryPath } from '../storage/repo-manager.js';
import { getCurrentCommit, isGitRepo, getGitRoot } from '../storage/git.js';
import { generateAIContextFiles } from './ai-context.js';
import { generateSkillFiles } from './skill-gen.js';
import { getIndexFreshness, getGitNexusVersion } from './index-freshness.js';
import { getCliEmbeddingConfig, getEmbeddingNodeLimit } from './embedding-overrides.js';
import {
  formatEmbeddingRunDetails,
  formatEmbeddingSkipReason,
  shouldSuggestIncrementalEmbeddingRefresh,
} from './embedding-insights.js';
import {
  cacheExistingEmbeddingsForAnalyze,
  runAnalyzeEmbeddingOrchestration,
} from './analyze-embeddings.js';
import { finalizeAnalyzeArtifacts } from './analyze-finalization.js';
import {
  createDefaultAnalyzeFTSIndexes,
  reloadKuzuGraphForAnalyze,
} from './analyze-kuzu.js';
import { buildAnalyzeSummaryLines } from './analyze-summary.js';
import {
  createAnalyzeBarLogger,
  createAnalyzeInterruptHandler,
  createAnalyzeProgressTracker,
} from './analyze-session.js';
import {
  listGitNexusMcpPidsHoldingPath,
  quiesceGitNexusMcpHolders,
} from './platform-process-scan.js';
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
  withContext?: boolean;
  withGitignore?: boolean;
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
  const refreshContext =
    options.withContext === true
      ? true
      : options.context === false || options.noContext === true
        ? false
        : false;
  const updateGitignore =
    options.withGitignore === true
      ? true
      : options.gitignore === false || options.noGitignore === true
        ? false
        : false;

  return {
    registerRepo: isEnabledOption(options.register, options.noRegister),
    updateGitignore,
    refreshContext,
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
  const startingCommit = getCurrentCommit(repoPath);
  const existingMeta = await loadMeta(storagePath);
  const gitNexusVersion = getGitNexusVersion();
  const scope = resolveAnalyzeScopeOptions(options);

  if (shouldSkipAnalyze(existingMeta, startingCommit, gitNexusVersion, options)) {
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
  const barLog = createAnalyzeBarLogger({
    clearLine: () => {
      process.stdout.write('\x1b[2K\r');
    },
    log: origLog,
  });
  const handleInterrupt = createAnalyzeInterruptHandler({
    stopBar: () => {
      bar?.stop();
    },
    log: (message) => {
      console.log(message);
    },
    closeKuzu,
    removeReindexLock: (lockPath) => nativeRuntimeManager.removeReindexLock(lockPath),
    reindexLockPath,
    runCleanupAndExit: (exitCode, cleanupOptions) => nativeRuntimeManager.runCleanupAndExit(exitCode, cleanupOptions),
    scheduleExit: (code) => {
      nativeRuntimeManager.scheduleExit(code);
    },
    processExit: (code) => {
      process.exit(code);
    },
  });
  const onSigInt = () => { void handleInterrupt(130); };
  const onSigTerm = () => { void handleInterrupt(143); };
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

    const progressTracker = createAnalyzeProgressTracker({
      update: (value, payload) => {
        if (typeof value === 'number') {
          bar!.update(value, payload);
          return;
        }
        bar!.update(value);
      },
    });
    const updateBar = (value: number, phaseLabel: string) => {
      progressTracker.updateBar(value, phaseLabel);
    };

    // Tick elapsed seconds for phases with infrequent progress callbacks
    // (e.g. CSV streaming, FTS indexing). Uses the same display format as
    // updateBar so there's no flickering.
    elapsedTimer = setInterval(() => {
      progressTracker.tickElapsed();
    }, 1000);

    const t0Global = Date.now();

    // ── Cache embeddings from existing index before rebuild ────────────
    const cachedEmbeddingSnapshot = await cacheExistingEmbeddingsForAnalyze({
      embeddingsEnabled: options?.embeddings,
      hasExistingMeta: !!existingMeta,
      force: options?.force,
      kuzuPath,
      updateBar,
    }, {
      initKuzu,
      closeKuzu,
      loadCachedEmbeddings,
    });
    const cachedEmbeddingNodeIds = cachedEmbeddingSnapshot.embeddingNodeIds;
    const cachedEmbeddings = cachedEmbeddingSnapshot.embeddings;

    // ── Phase 1: Full Pipeline (0–60%) ─────────────────────────────────
    const pipelineResult = await runPipelineFromRepo(repoPath, (progress) => {
      const phaseLabel = PHASE_LABELS[progress.phase] || progress.phase;
      const scaled = Math.round(progress.percent * 0.6);
      updateBar(scaled, phaseLabel);
    });

    // ── Phase 2: KuzuDB (60–85%) ──────────────────────────────────────
    const { kuzuTime, kuzuWarnings } = await reloadKuzuGraphForAnalyze({
      kuzuPath,
      storagePath,
      pipelineResult,
      updateBar,
    }, {
      closeKuzu,
      removePath: async (targetPath) => {
        await fs.rm(targetPath, { recursive: true, force: true });
      },
      initKuzu,
      loadGraphToKuzu,
    });

    // ── Phase 3: FTS (85–90%) ─────────────────────────────────────────
    const { ftsTime } = await createDefaultAnalyzeFTSIndexes({
      updateBar,
    }, {
      createFTSIndex,
    });

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
    const {
      embeddingTime,
      embeddingSkipped,
      embeddingSkipReason,
      embeddingDetail,
    } = await runAnalyzeEmbeddingOrchestration({
      embeddingsEnabled: options?.embeddings,
      embeddingNodeLimit,
      embeddingConfig,
      embeddingRuntimeConfig,
      cachedEmbeddingNodeIds,
      cachedEmbeddings,
      executeQuery,
      executeWithReusedStatement,
      updateBar,
    }, {
      formatEmbeddingSkipReason,
      formatEmbeddingRunDetails,
    });

    // ── Phase 5: Finalize (98–100%) ───────────────────────────────────
    updateBar(98, 'Saving metadata...');

    // Count embeddings in the index (cached + newly generated)
    let embeddingCount = 0;
    try {
      const embResult = await executeQuery(`MATCH (e:CodeEmbedding) RETURN count(e) AS cnt`);
      embeddingCount = embResult?.[0]?.cnt ?? 0;
    } catch { /* table may not exist if embeddings never ran */ }

    const projectName = path.basename(repoPath);
    if (options?.skills && pipelineResult.communityResult) {
      updateBar(99, 'Generating skill files...');
    }

    const {
      aiContext,
      communityCount,
      processCount,
    } = await finalizeAnalyzeArtifacts({
      repoPath,
      storagePath,
      projectName,
      currentCommit: getCurrentCommit(repoPath),
      gitNexusVersion,
      scope,
      generateSkills: !!options?.skills,
      pipelineResult,
      stats: {
        nodes: stats.nodes,
        edges: stats.edges,
        embeddings: embeddingCount,
      },
    }, {
      saveMeta,
      registerRepo,
      addToGitignore,
      addToGitInfoExclude,
      generateSkillFiles,
      generateAIContextFiles,
    });

    await nativeRuntimeManager.cleanupCoreRuntime(closeKuzu);

    const totalTime = ((Date.now() - t0Global) / 1000).toFixed(1);

    console.log = origLog;
    console.warn = origWarn;
    console.error = origError;

    bar.update(100, { phase: 'Done' });
    bar.stop();

    let showSetupTip = false;
    try {
      await fs.access(getGlobalRegistryPath());
    } catch {
      showSetupTip = true;
    }
    for (const line of buildAnalyzeSummaryLines({
      totalTime,
      cachedEmbeddingsCount: cachedEmbeddings.length,
      nodes: stats.nodes,
      edges: stats.edges,
      communityCount,
      processCount,
      kuzuTime,
      ftsTime,
      embeddingSkipped,
      embeddingSkipReason,
      embeddingTime,
      embeddingsEnabled: options?.embeddings,
      embeddingDetail,
      repoPath,
      contextFiles: aiContext.files,
      kuzuWarnings,
      showIncrementalEmbeddingRefreshTip: shouldSuggestIncrementalEmbeddingRefresh(options?.force, options?.embeddings, embeddingCount),
      showSetupTip,
    })) {
      console.log(line);
    }

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
