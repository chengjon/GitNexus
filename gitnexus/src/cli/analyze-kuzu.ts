import type { PipelineResult } from '../types/pipeline.js';

export interface AnalyzeKuzuLoadOptions {
  kuzuPath: string;
  storagePath: string;
  pipelineResult: PipelineResult;
  updateBar: (value: number, phaseLabel: string) => void;
}

export interface AnalyzeKuzuLoadDeps {
  closeKuzu: () => Promise<void>;
  removePath: (targetPath: string) => Promise<void>;
  initKuzu: (dbPath: string) => Promise<unknown>;
  loadGraphToKuzu: (
    graph: PipelineResult['graph'],
    repoPath: string,
    storagePath: string,
    onProgress?: (message: string) => void,
  ) => Promise<{ warnings: string[] }>;
  now?: () => number;
}

export interface AnalyzeFTSOptions {
  updateBar: (value: number, phaseLabel: string) => void;
}

export interface AnalyzeFTSDeps {
  createFTSIndex: (tableName: string, indexName: string, properties: string[]) => Promise<void>;
  now?: () => number;
}

const defaultNow = () => Date.now();

export async function reloadKuzuGraphForAnalyze(
  options: AnalyzeKuzuLoadOptions,
  deps: AnalyzeKuzuLoadDeps,
): Promise<{ kuzuTime: string; kuzuWarnings: string[] }> {
  options.updateBar(60, 'Loading into KuzuDB...');

  await deps.closeKuzu();
  const kuzuFiles = [options.kuzuPath, `${options.kuzuPath}.wal`, `${options.kuzuPath}.lock`];
  for (const targetPath of kuzuFiles) {
    try {
      await deps.removePath(targetPath);
    } catch {
      // best-effort cleanup only
    }
  }

  const now = deps.now ?? defaultNow;
  const t0Kuzu = now();
  await deps.initKuzu(options.kuzuPath);
  let kuzuMsgCount = 0;
  const kuzuResult = await deps.loadGraphToKuzu(
    options.pipelineResult.graph,
    options.pipelineResult.repoPath,
    options.storagePath,
    (message) => {
      kuzuMsgCount++;
      const progress = Math.min(84, 60 + Math.round((kuzuMsgCount / (kuzuMsgCount + 10)) * 24));
      options.updateBar(progress, message);
    },
  );

  return {
    kuzuTime: ((now() - t0Kuzu) / 1000).toFixed(1),
    kuzuWarnings: kuzuResult.warnings,
  };
}

export async function createDefaultAnalyzeFTSIndexes(
  options: AnalyzeFTSOptions,
  deps: AnalyzeFTSDeps,
): Promise<{ ftsTime: string }> {
  options.updateBar(85, 'Creating search indexes...');

  const now = deps.now ?? defaultNow;
  const t0Fts = now();
  try {
    await deps.createFTSIndex('File', 'file_fts', ['name', 'content']);
    await deps.createFTSIndex('Function', 'function_fts', ['name', 'content']);
    await deps.createFTSIndex('Class', 'class_fts', ['name', 'content']);
    await deps.createFTSIndex('Method', 'method_fts', ['name', 'content']);
    await deps.createFTSIndex('Interface', 'interface_fts', ['name', 'content']);
  } catch {
    // Non-fatal — FTS is best-effort.
  }

  return {
    ftsTime: ((now() - t0Fts) / 1000).toFixed(1),
  };
}
