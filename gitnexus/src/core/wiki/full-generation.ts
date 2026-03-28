import { shouldIgnorePath } from '../../config/ignore-service.js';
import {
  getAllFiles,
  getFilesWithExports,
  type FileWithExports,
} from './graph-queries.js';
import type { LLMConfig, CallLLMOptions } from './llm-client.js';
import { extractModuleFiles } from './generator-support.js';
import type { ProgressCallback, WikiMeta } from './generator.js';
import {
  buildModuleTree,
  countModules,
  flattenModuleTree,
} from './module-tree/builder.js';
import type { ModuleTreeNode } from './module-tree/types.js';

export interface RunFullGenerationOptions {
  currentCommit: string;
  wikiDir: string;
  llmConfig: LLMConfig;
  maxTokensPerModule: number;
  failedModules: string[];
  onProgress: ProgressCallback;
  slugify: (name: string) => string;
  estimateModuleTokens: (filePaths: string[]) => Promise<number>;
  streamOpts: (label: string, fixedPercent?: number) => CallLLMOptions;
  fileExists: (filePath: string) => Promise<boolean>;
  saveModuleTree: (tree: ModuleTreeNode[]) => Promise<void>;
  saveWikiMeta: (meta: WikiMeta) => Promise<void>;
  runParallel: <T>(items: T[], fn: (item: T) => Promise<number>) => Promise<number>;
}

export interface FullGenerationDeps {
  generateLeafPage: (node: ModuleTreeNode) => Promise<void>;
  generateParentPage: (node: ModuleTreeNode) => Promise<void>;
  generateOverviewPage: (moduleTree: ModuleTreeNode[]) => Promise<void>;
}

export async function runFullGeneration(
  options: RunFullGenerationOptions,
  deps: FullGenerationDeps,
): Promise<{ pagesGenerated: number; mode: 'full'; failedModules: string[] }> {
  const {
    currentCommit,
    wikiDir,
    llmConfig,
    maxTokensPerModule,
    failedModules,
    onProgress,
    slugify,
    estimateModuleTokens,
    streamOpts,
    fileExists,
    saveModuleTree,
    saveWikiMeta,
    runParallel,
  } = options;
  const {
    generateLeafPage,
    generateParentPage,
    generateOverviewPage,
  } = deps;

  let pagesGenerated = 0;

  onProgress('gather', 5, 'Querying graph for file structure...');
  const filesWithExports = await getFilesWithExports();
  const allFiles = await getAllFiles();

  const sourceFiles = allFiles.filter((filePath) => !shouldIgnorePath(filePath));
  if (sourceFiles.length === 0) {
    throw new Error('No source files found in the knowledge graph. Nothing to document.');
  }

  const exportMap = new Map(filesWithExports.map((file) => [file.filePath, file]));
  const enrichedFiles: FileWithExports[] = sourceFiles.map((filePath) => (
    exportMap.get(filePath) || { filePath, symbols: [] }
  ));

  onProgress('gather', 10, `Found ${sourceFiles.length} source files`);

  const moduleTree = await buildModuleTree({
    files: enrichedFiles,
    wikiDir,
    llmConfig,
    maxTokensPerModule,
    onProgress,
    slugify,
    estimateModuleTokens,
    streamOpts,
  });
  pagesGenerated = 0;

  const totalModules = countModules(moduleTree);
  let modulesProcessed = 0;

  const reportProgress = (moduleName?: string) => {
    modulesProcessed++;
    const percent = 30 + Math.round((modulesProcessed / totalModules) * 55);
    const detail = moduleName
      ? `${modulesProcessed}/${totalModules} — ${moduleName}`
      : `${modulesProcessed}/${totalModules} modules`;
    onProgress('modules', percent, detail);
  };

  const { leaves, parents } = flattenModuleTree(moduleTree);

  pagesGenerated += await runParallel(leaves, async (node) => {
    const pagePath = `${wikiDir}/${node.slug}.md`;
    if (await fileExists(pagePath)) {
      reportProgress(node.name);
      return 0;
    }
    try {
      await generateLeafPage(node);
      reportProgress(node.name);
      return 1;
    } catch {
      failedModules.push(node.name);
      reportProgress(`Failed: ${node.name}`);
      return 0;
    }
  });

  for (const node of parents) {
    const pagePath = `${wikiDir}/${node.slug}.md`;
    if (await fileExists(pagePath)) {
      reportProgress(node.name);
      continue;
    }
    try {
      await generateParentPage(node);
      pagesGenerated++;
      reportProgress(node.name);
    } catch {
      failedModules.push(node.name);
      reportProgress(`Failed: ${node.name}`);
    }
  }

  onProgress('overview', 88, 'Generating overview page...');
  await generateOverviewPage(moduleTree);
  pagesGenerated++;

  onProgress('finalize', 95, 'Saving metadata...');
  const moduleFiles = extractModuleFiles(moduleTree);
  await saveModuleTree(moduleTree);
  await saveWikiMeta({
    fromCommit: currentCommit,
    generatedAt: new Date().toISOString(),
    model: llmConfig.model,
    moduleFiles,
    moduleTree,
  });

  onProgress('done', 100, 'Wiki generation complete');
  return { pagesGenerated, mode: 'full', failedModules: [...failedModules] };
}
