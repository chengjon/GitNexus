import fs from 'fs/promises';
import path from 'path';
import type { FileWithExports } from '../graph-queries.js';
import { callLLM, type CallLLMOptions, type LLMConfig } from '../llm-client.js';
import {
  GROUPING_SYSTEM_PROMPT,
  GROUPING_USER_PROMPT,
  fillTemplate,
  formatDirectoryTree,
  formatFileListForGrouping,
} from '../prompts.js';
import type { ModuleTreeNode } from './types.js';

export function parseGroupingResponse(
  content: string,
  files: FileWithExports[],
): Record<string, string[]> {
  let jsonStr = content.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  let parsed: Record<string, string[]>;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return fallbackGrouping(files);
  }

  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    return fallbackGrouping(files);
  }

  const allFilePaths = new Set(files.map((f) => f.filePath));
  const assignedFiles = new Set<string>();
  const validGrouping: Record<string, string[]> = {};

  for (const [mod, paths] of Object.entries(parsed)) {
    if (!Array.isArray(paths)) continue;
    const validPaths = paths.filter((p) => {
      if (allFilePaths.has(p) && !assignedFiles.has(p)) {
        assignedFiles.add(p);
        return true;
      }
      return false;
    });
    if (validPaths.length > 0) {
      validGrouping[mod] = validPaths;
    }
  }

  const unassigned = files
    .map((f) => f.filePath)
    .filter((fp) => !assignedFiles.has(fp));
  if (unassigned.length > 0) {
    validGrouping.Other = unassigned;
  }

  return Object.keys(validGrouping).length > 0
    ? validGrouping
    : fallbackGrouping(files);
}

export function fallbackGrouping(files: FileWithExports[]): Record<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const f of files) {
    const parts = f.filePath.replace(/\\/g, '/').split('/');
    const topDir = parts.length > 1 ? parts[0] : 'Root';
    let group = groups.get(topDir);
    if (!group) {
      group = [];
      groups.set(topDir, group);
    }
    group.push(f.filePath);
  }
  return Object.fromEntries(groups);
}

export function splitBySubdirectory(
  moduleName: string,
  files: string[],
  slugify: (name: string) => string,
): ModuleTreeNode[] {
  const subGroups = new Map<string, string[]>();
  for (const fp of files) {
    const parts = fp.replace(/\\/g, '/').split('/');
    const subDir = parts.length > 2 ? parts.slice(0, 2).join('/') : parts[0];
    let group = subGroups.get(subDir);
    if (!group) {
      group = [];
      subGroups.set(subDir, group);
    }
    group.push(fp);
  }

  return Array.from(subGroups.entries()).map(([subDir, subFiles]) => ({
    name: `${moduleName} — ${path.basename(subDir)}`,
    slug: slugify(`${moduleName}-${path.basename(subDir)}`),
    files: subFiles,
  }));
}

export function countModules(tree: ModuleTreeNode[]): number {
  let count = 0;
  for (const node of tree) {
    count++;
    if (node.children) {
      count += node.children.length;
    }
  }
  return count;
}

export function flattenModuleTree(tree: ModuleTreeNode[]): { leaves: ModuleTreeNode[]; parents: ModuleTreeNode[] } {
  const leaves: ModuleTreeNode[] = [];
  const parents: ModuleTreeNode[] = [];

  for (const node of tree) {
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        leaves.push(child);
      }
      parents.push(node);
    } else {
      leaves.push(node);
    }
  }

  return { leaves, parents };
}

export interface BuildModuleTreeOptions {
  files: FileWithExports[];
  wikiDir: string;
  llmConfig: LLMConfig;
  maxTokensPerModule: number;
  onProgress: (phase: string, percent: number, detail?: string) => void;
  slugify: (name: string) => string;
  estimateModuleTokens: (filePaths: string[]) => Promise<number>;
  streamOpts: (label: string, fixedPercent?: number) => CallLLMOptions;
}

export async function buildModuleTree(options: BuildModuleTreeOptions): Promise<ModuleTreeNode[]> {
  const {
    files,
    wikiDir,
    llmConfig,
    maxTokensPerModule,
    onProgress,
    slugify,
    estimateModuleTokens,
    streamOpts,
  } = options;

  const snapshotPath = path.join(wikiDir, 'first_module_tree.json');
  try {
    const existing = await fs.readFile(snapshotPath, 'utf-8');
    const parsed = JSON.parse(existing);
    if (Array.isArray(parsed) && parsed.length > 0) {
      onProgress('grouping', 25, 'Using existing module tree (resuming)');
      return parsed;
    }
  } catch {
    // No snapshot, generate new
  }

  onProgress('grouping', 15, 'Grouping files into modules (LLM)...');

  const fileList = formatFileListForGrouping(files);
  const dirTree = formatDirectoryTree(files.map((f) => f.filePath));

  const prompt = fillTemplate(GROUPING_USER_PROMPT, {
    FILE_LIST: fileList,
    DIRECTORY_TREE: dirTree,
  });

  const response = await callLLM(
    prompt, llmConfig, GROUPING_SYSTEM_PROMPT,
    streamOpts('Grouping files', 15),
  );
  const grouping = parseGroupingResponse(response.content, files);

  const tree: ModuleTreeNode[] = [];
  for (const [moduleName, modulePaths] of Object.entries(grouping)) {
    const slug = slugify(moduleName);
    const node: ModuleTreeNode = { name: moduleName, slug, files: modulePaths };

    const totalTokens = await estimateModuleTokens(modulePaths);
    if (totalTokens > maxTokensPerModule && modulePaths.length > 3) {
      node.children = splitBySubdirectory(moduleName, modulePaths, slugify);
      node.files = [];
    }

    tree.push(node);
  }

  await fs.writeFile(snapshotPath, JSON.stringify(tree, null, 2), 'utf-8');
  onProgress('grouping', 28, `Created ${tree.length} modules`);

  return tree;
}
