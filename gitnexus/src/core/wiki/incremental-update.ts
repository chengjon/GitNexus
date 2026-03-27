import fs from 'fs/promises';
import path from 'path';

import { shouldIgnorePath } from '../../config/ignore-service.js';
import type { LLMConfig, CallLLMOptions } from './llm-client.js';
import type { ModuleTreeNode } from './module-tree/types.js';
import type { ProgressCallback, WikiMeta } from './generator.js';

export interface IncrementalUpdateResult {
  pagesGenerated: number;
  mode: 'incremental';
  failedModules: string[];
}

export interface RunIncrementalUpdateOptions {
  existingMeta: WikiMeta;
  currentCommit: string;
  wikiDir: string;
  repoPath: string;
  llmConfig: LLMConfig;
  maxTokensPerModule: number;
  failedModules: string[];
  onProgress: ProgressCallback;
  streamOpts: (label: string, fixedPercent?: number) => CallLLMOptions;
  getChangedFiles: (fromCommit: string, toCommit: string) => string[];
  slugify: (name: string) => string;
  findNodeBySlug: (tree: ModuleTreeNode[], slug: string) => ModuleTreeNode | null;
  saveWikiMeta: (meta: WikiMeta) => Promise<void>;
  deleteSnapshot: () => Promise<void>;
  fullGeneration: (currentCommit: string) => Promise<{ pagesGenerated: number; mode: 'full'; failedModules: string[] }>;
  runParallel: <T>(items: T[], fn: (item: T) => Promise<number>) => Promise<number>;
}

export interface IncrementalUpdateDeps {
  generateLeafPage: (node: ModuleTreeNode) => Promise<void>;
  generateParentPage: (node: ModuleTreeNode) => Promise<void>;
  generateOverviewPage: (moduleTree: ModuleTreeNode[]) => Promise<void>;
}

export async function runIncrementalUpdate(
  options: RunIncrementalUpdateOptions,
  deps: IncrementalUpdateDeps,
): Promise<IncrementalUpdateResult> {
  const {
    existingMeta,
    currentCommit,
    wikiDir,
    llmConfig,
    failedModules,
    onProgress,
    getChangedFiles,
    slugify,
    findNodeBySlug,
    saveWikiMeta,
    deleteSnapshot,
    fullGeneration,
    runParallel,
  } = options;
  const {
    generateLeafPage,
    generateParentPage,
    generateOverviewPage,
  } = deps;

  onProgress('incremental', 5, 'Detecting changes...');

  const changedFiles = getChangedFiles(existingMeta.fromCommit, currentCommit);
  if (changedFiles.length === 0) {
    await saveWikiMeta({
      ...existingMeta,
      fromCommit: currentCommit,
      generatedAt: new Date().toISOString(),
    });
    return { pagesGenerated: 0, mode: 'incremental', failedModules: [] };
  }

  onProgress('incremental', 10, `${changedFiles.length} files changed`);

  const affectedModules = new Set<string>();
  const newFiles: string[] = [];

  for (const fp of changedFiles) {
    let found = false;
    for (const [mod, files] of Object.entries(existingMeta.moduleFiles)) {
      if (files.includes(fp)) {
        affectedModules.add(mod);
        found = true;
        break;
      }
    }
    if (!found && !shouldIgnorePath(fp)) {
      newFiles.push(fp);
    }
  }

  if (newFiles.length > 5) {
    onProgress('incremental', 15, 'Significant new files detected, running full generation...');
    await deleteSnapshot();
    const fullResult = await fullGeneration(currentCommit);
    return { ...fullResult, mode: 'incremental' };
  }

  if (newFiles.length > 0) {
    if (!existingMeta.moduleFiles.Other) {
      existingMeta.moduleFiles.Other = [];
    }
    existingMeta.moduleFiles.Other.push(...newFiles);
    affectedModules.add('Other');
  }

  let pagesGenerated = 0;
  const moduleTree = existingMeta.moduleTree;
  const affectedArray = Array.from(affectedModules);

  onProgress('incremental', 20, `Regenerating ${affectedArray.length} module(s)...`);

  const affectedNodes: ModuleTreeNode[] = [];
  for (const mod of affectedArray) {
    const modSlug = slugify(mod);
    const node = findNodeBySlug(moduleTree, modSlug);
    if (node) {
      try {
        await fs.unlink(path.join(wikiDir, `${node.slug}.md`));
      } catch {}
      affectedNodes.push(node);
    }
  }

  let incProcessed = 0;
  pagesGenerated += await runParallel(affectedNodes, async (node) => {
    try {
      if (node.children && node.children.length > 0) {
        await generateParentPage(node);
      } else {
        await generateLeafPage(node);
      }
      incProcessed++;
      const percent = 20 + Math.round((incProcessed / affectedNodes.length) * 60);
      onProgress('incremental', percent, `${incProcessed}/${affectedNodes.length} — ${node.name}`);
      return 1;
    } catch {
      failedModules.push(node.name);
      incProcessed++;
      return 0;
    }
  });

  if (pagesGenerated > 0) {
    onProgress('incremental', 85, 'Updating overview...');
    await generateOverviewPage(moduleTree);
    pagesGenerated++;
  }

  onProgress('incremental', 95, 'Saving metadata...');
  await saveWikiMeta({
    ...existingMeta,
    fromCommit: currentCommit,
    generatedAt: new Date().toISOString(),
    model: llmConfig.model,
  });

  onProgress('done', 100, 'Incremental update complete');
  return { pagesGenerated, mode: 'incremental', failedModules: [...failedModules] };
}
