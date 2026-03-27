import type { ProgressCallback, WikiMeta } from './generator.js';

export interface RunWikiGenerationOptions {
  forceMode: boolean;
  repoPath: string;
  wikiDir: string;
  kuzuPath: string;
  onProgress: ProgressCallback;
  prepareWikiDir: () => Promise<void>;
  cleanupForceMode: () => Promise<void>;
  loadWikiMeta: () => Promise<WikiMeta | null>;
  getCurrentCommit: () => string;
  initWikiDb: (kuzuPath: string) => Promise<void>;
  closeWikiDb: () => Promise<void>;
  ensureHTMLViewer: () => Promise<void>;
  fullGeneration: (currentCommit: string) => Promise<{ pagesGenerated: number; mode: 'full'; failedModules: string[] }>;
  runIncrementalUpdate: (existingMeta: WikiMeta, currentCommit: string) => Promise<{ pagesGenerated: number; mode: 'incremental'; failedModules: string[] }>;
}

export async function runWikiGeneration(
  options: RunWikiGenerationOptions,
): Promise<{ pagesGenerated: number; mode: 'full' | 'incremental' | 'up-to-date'; failedModules: string[] }> {
  const {
    forceMode,
    kuzuPath,
    onProgress,
    prepareWikiDir,
    cleanupForceMode,
    loadWikiMeta,
    getCurrentCommit,
    initWikiDb,
    closeWikiDb,
    ensureHTMLViewer,
    fullGeneration,
    runIncrementalUpdate,
  } = options;

  await prepareWikiDir();

  const existingMeta = await loadWikiMeta();
  const currentCommit = getCurrentCommit();

  if (!forceMode && existingMeta && existingMeta.fromCommit === currentCommit) {
    await ensureHTMLViewer();
    return { pagesGenerated: 0, mode: 'up-to-date', failedModules: [] };
  }

  if (forceMode) {
    await cleanupForceMode();
  }

  onProgress('init', 2, 'Connecting to knowledge graph...');
  await initWikiDb(kuzuPath);

  let result: { pagesGenerated: number; mode: 'full' | 'incremental' | 'up-to-date'; failedModules: string[] };
  try {
    if (!forceMode && existingMeta && existingMeta.fromCommit) {
      result = await runIncrementalUpdate(existingMeta, currentCommit);
    } else {
      result = await fullGeneration(currentCommit);
    }
  } finally {
    await closeWikiDb();
  }

  await ensureHTMLViewer();
  return result;
}
