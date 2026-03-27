/**
 * Wiki Generator
 * 
 * Orchestrates the full wiki generation pipeline:
 *   Phase 0: Validate prerequisites + gather graph structure
 *   Phase 1: Build module tree (one LLM call)
 *   Phase 2: Generate module pages (one LLM call per module, bottom-up)
 *   Phase 3: Generate overview page
 * 
 * Supports incremental updates via git diff + module-file mapping.
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync, execFileSync } from 'child_process';

import {
  initWikiDb,
  closeWikiDb,
  getFilesWithExports,
  getAllFiles,
  getInterFileCallEdges,
  type FileWithExports,
} from './graph-queries.js';
import { generateHTMLViewer } from './html-viewer.js';

import {
  estimateTokens,
  type LLMConfig,
  type CallLLMOptions,
} from './llm-client.js';

import {
  GROUPING_SYSTEM_PROMPT,
} from './prompts.js';
import { extractModuleFiles, readProjectInfo } from './generator-support.js';
import { runIncrementalUpdate } from './incremental-update.js';
import { generateLeafPage } from './pages/leaf-page.js';
import { generateParentPage } from './pages/parent-page.js';
import { generateOverviewPage } from './pages/overview-page.js';

import { shouldIgnorePath } from '../../config/ignore-service.js';
import type { ModuleTreeNode } from './module-tree/types.js';
import {
  buildModuleTree,
  countModules,
  flattenModuleTree,
} from './module-tree/builder.js';

// ─── Types ────────────────────────────────────────────────────────────

export interface WikiOptions {
  force?: boolean;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  maxTokensPerModule?: number;
  concurrency?: number;
}

export interface WikiMeta {
  fromCommit: string;
  generatedAt: string;
  model: string;
  moduleFiles: Record<string, string[]>;
  moduleTree: ModuleTreeNode[];
}

export type ProgressCallback = (phase: string, percent: number, detail?: string) => void;

// ─── Constants ────────────────────────────────────────────────────────

const DEFAULT_MAX_TOKENS_PER_MODULE = 30_000;
const WIKI_DIR = 'wiki';

// ─── Generator Class ──────────────────────────────────────────────────

export class WikiGenerator {
  private repoPath: string;
  private storagePath: string;
  private wikiDir: string;
  private kuzuPath: string;
  private llmConfig: LLMConfig;
  private maxTokensPerModule: number;
  private concurrency: number;
  private options: WikiOptions;
  private onProgress: ProgressCallback;
  private failedModules: string[] = [];

  constructor(
    repoPath: string,
    storagePath: string,
    kuzuPath: string,
    llmConfig: LLMConfig,
    options: WikiOptions = {},
    onProgress?: ProgressCallback,
  ) {
    this.repoPath = repoPath;
    this.storagePath = storagePath;
    this.wikiDir = path.join(storagePath, WIKI_DIR);
    this.kuzuPath = kuzuPath;
    this.options = options;
    this.llmConfig = llmConfig;
    this.maxTokensPerModule = options.maxTokensPerModule ?? DEFAULT_MAX_TOKENS_PER_MODULE;
    this.concurrency = options.concurrency ?? 3;
    const progressFn = onProgress || (() => {});
    this.onProgress = (phase, percent, detail) => {
      if (percent > 0) this.lastPercent = percent;
      progressFn(phase, percent, detail);
    };
  }

  private lastPercent = 0;

  /**
   * Create streaming options that report LLM progress to the progress bar.
   * Uses the last known percent so streaming doesn't reset the bar backwards.
   */
  private streamOpts(label: string, fixedPercent?: number): CallLLMOptions {
    return {
      onChunk: (chars: number) => {
        const tokens = Math.round(chars / 4);
        const pct = fixedPercent ?? this.lastPercent;
        this.onProgress('stream', pct, `${label} (${tokens} tok)`);
      },
    };
  }

  /**
   * Main entry point. Runs the full pipeline or incremental update.
   */
  async run(): Promise<{ pagesGenerated: number; mode: 'full' | 'incremental' | 'up-to-date'; failedModules: string[] }> {
    await fs.mkdir(this.wikiDir, { recursive: true });

    const existingMeta = await this.loadWikiMeta();
    const currentCommit = this.getCurrentCommit();
    const forceMode = this.options.force;

    // Up-to-date check (skip if --force)
    if (!forceMode && existingMeta && existingMeta.fromCommit === currentCommit) {
      // Still regenerate the HTML viewer in case it's missing
      await this.ensureHTMLViewer();
      return { pagesGenerated: 0, mode: 'up-to-date', failedModules: [] };
    }

    // Force mode: delete snapshot to force full re-grouping
    if (forceMode) {
      try { await fs.unlink(path.join(this.wikiDir, 'first_module_tree.json')); } catch {}
      // Delete existing module pages so they get regenerated
      const existingFiles = await fs.readdir(this.wikiDir).catch(() => [] as string[]);
      for (const f of existingFiles) {
        if (f.endsWith('.md')) {
          try { await fs.unlink(path.join(this.wikiDir, f)); } catch {}
        }
      }
    }

    // Init graph
    this.onProgress('init', 2, 'Connecting to knowledge graph...');
    await initWikiDb(this.kuzuPath);

    let result: { pagesGenerated: number; mode: 'full' | 'incremental' | 'up-to-date'; failedModules: string[] };
    try {
      if (!forceMode && existingMeta && existingMeta.fromCommit) {
        result = await runIncrementalUpdate({
          existingMeta,
          currentCommit,
          wikiDir: this.wikiDir,
          llmConfig: this.llmConfig,
          failedModules: this.failedModules,
          onProgress: this.onProgress,
          getChangedFiles: (fromCommit, toCommit) => this.getChangedFiles(fromCommit, toCommit),
          slugify: (name) => this.slugify(name),
          findNodeBySlug: (tree, slug) => this.findNodeBySlug(tree, slug),
          saveWikiMeta: async (meta) => this.saveWikiMeta(meta),
          deleteSnapshot: async () => {
            try {
              await fs.unlink(path.join(this.wikiDir, 'first_module_tree.json'));
            } catch {}
          },
          fullGeneration: async (commit) => this.fullGeneration(commit),
          runParallel: async (items, fn) => this.runParallel(items, fn),
        }, {
          generateLeafPage: async (node) => {
            await generateLeafPage({
              node,
              wikiDir: this.wikiDir,
              repoPath: this.repoPath,
              llmConfig: this.llmConfig,
              maxTokensPerModule: this.maxTokensPerModule,
              streamOpts: (label, fixedPercent) => this.streamOpts(label, fixedPercent),
              readSourceFiles: (filePaths) => this.readSourceFiles(filePaths),
              truncateSource: (source, maxTokens) => this.truncateSource(source, maxTokens),
            });
          },
          generateParentPage: async (node) => {
            await generateParentPage({
              node,
              wikiDir: this.wikiDir,
              llmConfig: this.llmConfig,
              streamOpts: (label, fixedPercent) => this.streamOpts(label, fixedPercent),
            });
          },
          generateOverviewPage: async (moduleTree) => {
            await generateOverviewPage({
              moduleTree,
              wikiDir: this.wikiDir,
              repoPath: this.repoPath,
              llmConfig: this.llmConfig,
              streamOpts: (label, fixedPercent) => this.streamOpts(label, fixedPercent),
              readProjectInfo: () => readProjectInfo(this.repoPath),
              extractModuleFiles: (tree) => extractModuleFiles(tree),
            });
          },
        });
      } else {
        result = await this.fullGeneration(currentCommit);
      }
    } finally {
      await closeWikiDb();
    }

    // Always generate the HTML viewer after wiki content changes
    await this.ensureHTMLViewer();

    return result;
  }

  // ─── HTML Viewer ─────────────────────────────────────────────────────

  private async ensureHTMLViewer(): Promise<void> {
    // Only generate if there are markdown pages to bundle
    const dirEntries = await fs.readdir(this.wikiDir).catch(() => [] as string[]);
    const hasMd = dirEntries.some(f => f.endsWith('.md'));
    if (!hasMd) return;

    this.onProgress('html', 98, 'Building HTML viewer...');
    const repoName = path.basename(this.repoPath);
    await generateHTMLViewer(this.wikiDir, repoName);
  }

  // ─── Full Generation ────────────────────────────────────────────────

  private async fullGeneration(currentCommit: string): Promise<{ pagesGenerated: number; mode: 'full'; failedModules: string[] }> {
    let pagesGenerated = 0;

    // Phase 0: Gather structure
    this.onProgress('gather', 5, 'Querying graph for file structure...');
    const filesWithExports = await getFilesWithExports();
    const allFiles = await getAllFiles();

    // Filter to source files only
    const sourceFiles = allFiles.filter(f => !shouldIgnorePath(f));
    if (sourceFiles.length === 0) {
      throw new Error('No source files found in the knowledge graph. Nothing to document.');
    }

    // Build enriched file list (merge exports into all source files)
    const exportMap = new Map(filesWithExports.map(f => [f.filePath, f]));
    const enrichedFiles: FileWithExports[] = sourceFiles.map(fp => {
      return exportMap.get(fp) || { filePath: fp, symbols: [] };
    });

    this.onProgress('gather', 10, `Found ${sourceFiles.length} source files`);

    // Phase 1: Build module tree
    const moduleTree = await buildModuleTree({
      files: enrichedFiles,
      wikiDir: this.wikiDir,
      llmConfig: this.llmConfig,
      maxTokensPerModule: this.maxTokensPerModule,
      onProgress: this.onProgress,
      slugify: (name) => this.slugify(name),
      estimateModuleTokens: async (filePaths) => this.estimateModuleTokens(filePaths),
      streamOpts: (label, fixedPercent) => this.streamOpts(label, fixedPercent),
    });
    pagesGenerated = 0;

    // Phase 2: Generate module pages (parallel with concurrency limit)
    const totalModules = countModules(moduleTree);
    let modulesProcessed = 0;

    const reportProgress = (moduleName?: string) => {
      modulesProcessed++;
      const percent = 30 + Math.round((modulesProcessed / totalModules) * 55);
      const detail = moduleName
        ? `${modulesProcessed}/${totalModules} — ${moduleName}`
        : `${modulesProcessed}/${totalModules} modules`;
      this.onProgress('modules', percent, detail);
    };

    // Flatten tree into layers: leaves first, then parents
    // Leaves can run in parallel; parents must wait for their children
    const { leaves, parents } = flattenModuleTree(moduleTree);

    // Process all leaf modules in parallel
    pagesGenerated += await this.runParallel(leaves, async (node) => {
      const pagePath = path.join(this.wikiDir, `${node.slug}.md`);
      if (await this.fileExists(pagePath)) {
        reportProgress(node.name);
        return 0;
      }
      try {
        await generateLeafPage({
          node,
          wikiDir: this.wikiDir,
          repoPath: this.repoPath,
          llmConfig: this.llmConfig,
          maxTokensPerModule: this.maxTokensPerModule,
          streamOpts: (label, fixedPercent) => this.streamOpts(label, fixedPercent),
          readSourceFiles: (filePaths) => this.readSourceFiles(filePaths),
          truncateSource: (source, maxTokens) => this.truncateSource(source, maxTokens),
        });
        reportProgress(node.name);
        return 1;
      } catch (err: any) {
        this.failedModules.push(node.name);
        reportProgress(`Failed: ${node.name}`);
        return 0;
      }
    });

    // Process parent modules sequentially (they depend on child docs)
    for (const node of parents) {
      const pagePath = path.join(this.wikiDir, `${node.slug}.md`);
      if (await this.fileExists(pagePath)) {
        reportProgress(node.name);
        continue;
      }
      try {
        await generateParentPage({
          node,
          wikiDir: this.wikiDir,
          llmConfig: this.llmConfig,
          streamOpts: (label, fixedPercent) => this.streamOpts(label, fixedPercent),
        });
        pagesGenerated++;
        reportProgress(node.name);
      } catch (err: any) {
        this.failedModules.push(node.name);
        reportProgress(`Failed: ${node.name}`);
      }
    }

    // Phase 3: Generate overview
    this.onProgress('overview', 88, 'Generating overview page...');
    await generateOverviewPage({
      moduleTree,
      wikiDir: this.wikiDir,
      repoPath: this.repoPath,
      llmConfig: this.llmConfig,
      streamOpts: (label, fixedPercent) => this.streamOpts(label, fixedPercent),
      readProjectInfo: () => readProjectInfo(this.repoPath),
      extractModuleFiles: (tree) => extractModuleFiles(tree),
    });
    pagesGenerated++;

    // Save metadata
    this.onProgress('finalize', 95, 'Saving metadata...');
    const moduleFiles = extractModuleFiles(moduleTree);
    await this.saveModuleTree(moduleTree);
    await this.saveWikiMeta({
      fromCommit: currentCommit,
      generatedAt: new Date().toISOString(),
      model: this.llmConfig.model,
      moduleFiles,
      moduleTree,
    });

    this.onProgress('done', 100, 'Wiki generation complete');
    return { pagesGenerated, mode: 'full', failedModules: [...this.failedModules] };
  }

  // ─── Helpers ────────────────────────────────────────────────────────

  private getCurrentCommit(): string {
    try {
      return execSync('git rev-parse HEAD', { cwd: this.repoPath }).toString().trim();
    } catch {
      return '';
    }
  }

  private getChangedFiles(fromCommit: string, toCommit: string): string[] {
    try {
      const output = execFileSync(
        'git', ['diff', `${fromCommit}..${toCommit}`, '--name-only'],
        { cwd: this.repoPath },
      ).toString().trim();
      return output ? output.split('\n').filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  private async readSourceFiles(filePaths: string[]): Promise<string> {
    const parts: string[] = [];
    for (const fp of filePaths) {
      const fullPath = path.join(this.repoPath, fp);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        parts.push(`\n--- ${fp} ---\n${content}`);
      } catch {
        parts.push(`\n--- ${fp} ---\n(file not readable)`);
      }
    }
    return parts.join('\n');
  }

  private truncateSource(source: string, maxTokens: number): string {
    // Rough truncation: keep first maxTokens*4 chars and add notice
    const maxChars = maxTokens * 4;
    if (source.length <= maxChars) return source;
    return source.slice(0, maxChars) + '\n\n... (source truncated for context window limits)';
  }

  private async estimateModuleTokens(filePaths: string[]): Promise<number> {
    let total = 0;
    for (const fp of filePaths) {
      try {
        const content = await fs.readFile(path.join(this.repoPath, fp), 'utf-8');
        total += estimateTokens(content);
      } catch {
        // File not readable, skip
      }
    }
    return total;
  }

  /**
   * Run async tasks in parallel with a concurrency limit and adaptive rate limiting.
   * If a 429 rate limit is hit, concurrency is temporarily reduced.
   */
  private async runParallel<T>(
    items: T[],
    fn: (item: T) => Promise<number>,
  ): Promise<number> {
    let total = 0;
    let activeConcurrency = this.concurrency;
    let running = 0;
    let idx = 0;

    return new Promise((resolve, reject) => {
      const next = () => {
        while (running < activeConcurrency && idx < items.length) {
          const item = items[idx++];
          running++;

          fn(item)
            .then((count) => {
              total += count;
              running--;
              if (idx >= items.length && running === 0) {
                resolve(total);
              } else {
                next();
              }
            })
            .catch((err) => {
              running--;
              // On rate limit, reduce concurrency temporarily
              if (err.message?.includes('429')) {
                activeConcurrency = Math.max(1, activeConcurrency - 1);
                this.onProgress('modules', this.lastPercent, `Rate limited — concurrency → ${activeConcurrency}`);
                // Re-queue the item
                idx--;
                setTimeout(next, 5000);
              } else {
                if (idx >= items.length && running === 0) {
                  resolve(total);
                } else {
                  next();
                }
              }
            });
        }
      };

      if (items.length === 0) {
        resolve(0);
      } else {
        next();
      }
    });
  }

  private findNodeBySlug(tree: ModuleTreeNode[], slug: string): ModuleTreeNode | null {
    for (const node of tree) {
      if (node.slug === slug) return node;
      if (node.children) {
        const found = this.findNodeBySlug(node.children, slug);
        if (found) return found;
      }
    }
    return null;
  }

  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  private async fileExists(fp: string): Promise<boolean> {
    try {
      await fs.access(fp);
      return true;
    } catch {
      return false;
    }
  }

  private async loadWikiMeta(): Promise<WikiMeta | null> {
    try {
      const raw = await fs.readFile(path.join(this.wikiDir, 'meta.json'), 'utf-8');
      return JSON.parse(raw) as WikiMeta;
    } catch {
      return null;
    }
  }

  private async saveWikiMeta(meta: WikiMeta): Promise<void> {
    await fs.writeFile(
      path.join(this.wikiDir, 'meta.json'),
      JSON.stringify(meta, null, 2),
      'utf-8',
    );
  }

  private async saveModuleTree(tree: ModuleTreeNode[]): Promise<void> {
    await fs.writeFile(
      path.join(this.wikiDir, 'module_tree.json'),
      JSON.stringify(tree, null, 2),
      'utf-8',
    );
  }
}
