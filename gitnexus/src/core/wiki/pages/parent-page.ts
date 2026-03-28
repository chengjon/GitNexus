import fs from 'fs/promises';
import path from 'path';

import {
  getIntraModuleCallEdges,
  getProcessesForFiles,
} from '../graph-queries.js';
import {
  callLLM,
  type LLMConfig,
  type CallLLMOptions,
} from '../llm-client.js';
import {
  PARENT_SYSTEM_PROMPT,
  PARENT_USER_PROMPT,
  fillTemplate,
  formatCallEdges,
  formatProcesses,
} from '../prompts.js';
import type { ModuleTreeNode } from '../module-tree/types.js';

export interface GenerateParentPageOptions {
  node: ModuleTreeNode;
  wikiDir: string;
  llmConfig: LLMConfig;
  streamOpts: (label: string, fixedPercent?: number) => CallLLMOptions;
}

export async function generateParentPage(options: GenerateParentPageOptions): Promise<void> {
  const {
    node,
    wikiDir,
    llmConfig,
    streamOpts,
  } = options;

  if (!node.children || node.children.length === 0) return;

  const childDocs: string[] = [];
  for (const child of node.children) {
    const childPage = path.join(wikiDir, `${child.slug}.md`);
    try {
      const content = await fs.readFile(childPage, 'utf-8');
      const overviewEnd = content.indexOf('### Architecture');
      const overview = overviewEnd > 0 ? content.slice(0, overviewEnd).trim() : content.slice(0, 800).trim();
      childDocs.push(`#### ${child.name}\n${overview}`);
    } catch {
      childDocs.push(`#### ${child.name}\n(Documentation not yet generated)`);
    }
  }

  const allChildFiles = node.children.flatMap(child => child.files);
  const crossCalls = await getIntraModuleCallEdges(allChildFiles);
  const processes = await getProcessesForFiles(allChildFiles, 3);

  const prompt = fillTemplate(PARENT_USER_PROMPT, {
    MODULE_NAME: node.name,
    CHILDREN_DOCS: childDocs.join('\n\n'),
    CROSS_MODULE_CALLS: formatCallEdges(crossCalls),
    CROSS_PROCESSES: formatProcesses(processes),
  });

  const response = await callLLM(
    prompt,
    llmConfig,
    PARENT_SYSTEM_PROMPT,
    streamOpts(node.name),
  );

  const pageContent = `# ${node.name}\n\n${response.content}`;
  await fs.writeFile(path.join(wikiDir, `${node.slug}.md`), pageContent, 'utf-8');
}
