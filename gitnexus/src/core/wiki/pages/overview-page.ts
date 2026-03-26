import fs from 'fs/promises';
import path from 'path';

import {
  getAllProcesses,
  getInterModuleEdgesForOverview,
} from '../graph-queries.js';
import {
  callLLM,
  type LLMConfig,
  type CallLLMOptions,
} from '../llm-client.js';
import {
  OVERVIEW_SYSTEM_PROMPT,
  OVERVIEW_USER_PROMPT,
  fillTemplate,
  formatProcesses,
} from '../prompts.js';
import type { ModuleTreeNode } from '../module-tree/types.js';

export interface GenerateOverviewPageOptions {
  moduleTree: ModuleTreeNode[];
  wikiDir: string;
  repoPath: string;
  llmConfig: LLMConfig;
  streamOpts: (label: string, fixedPercent?: number) => CallLLMOptions;
  readProjectInfo: () => Promise<string>;
  extractModuleFiles: (moduleTree: ModuleTreeNode[]) => Record<string, string[]>;
}

export async function generateOverviewPage(options: GenerateOverviewPageOptions): Promise<void> {
  const {
    moduleTree,
    wikiDir,
    repoPath,
    llmConfig,
    streamOpts,
    readProjectInfo,
    extractModuleFiles,
  } = options;

  // Read module overview sections
  const moduleSummaries: string[] = [];
  for (const node of moduleTree) {
    const pagePath = path.join(wikiDir, `${node.slug}.md`);
    try {
      const content = await fs.readFile(pagePath, 'utf-8');
      const overviewEnd = content.indexOf('### Architecture');
      const overview = overviewEnd > 0 ? content.slice(0, overviewEnd).trim() : content.slice(0, 600).trim();
      moduleSummaries.push(`#### ${node.name}\n${overview}`);
    } catch {
      moduleSummaries.push(`#### ${node.name}\n(Documentation pending)`);
    }
  }

  // Get inter-module edges for architecture diagram
  const moduleFiles = extractModuleFiles(moduleTree);
  const moduleEdges = await getInterModuleEdgesForOverview(moduleFiles);

  // Get top processes for key workflows
  const topProcesses = await getAllProcesses(5);

  // Read project config
  const projectInfo = await readProjectInfo();

  const edgesText = moduleEdges.length > 0
    ? moduleEdges.map(e => `${e.from} → ${e.to} (${e.count} calls)`).join('\n')
    : 'No inter-module call edges detected';

  const prompt = fillTemplate(OVERVIEW_USER_PROMPT, {
    PROJECT_INFO: projectInfo,
    MODULE_SUMMARIES: moduleSummaries.join('\n\n'),
    MODULE_EDGES: edgesText,
    TOP_PROCESSES: formatProcesses(topProcesses),
  });

  const response = await callLLM(
    prompt,
    llmConfig,
    OVERVIEW_SYSTEM_PROMPT,
    streamOpts('Generating overview', 88),
  );

  const pageContent = `# ${path.basename(repoPath)} — Wiki\n\n${response.content}`;
  await fs.writeFile(path.join(wikiDir, 'overview.md'), pageContent, 'utf-8');
}
