import fs from 'fs/promises';
import path from 'path';

import {
  getIntraModuleCallEdges,
  getInterModuleCallEdges,
  getProcessesForFiles,
} from '../graph-queries.js';
import {
  callLLM,
  estimateTokens,
  type LLMConfig,
  type CallLLMOptions,
} from '../llm-client.js';
import {
  MODULE_SYSTEM_PROMPT,
  MODULE_USER_PROMPT,
  fillTemplate,
  formatCallEdges,
  formatProcesses,
} from '../prompts.js';
import type { ModuleTreeNode } from '../module-tree/types.js';

export interface GenerateLeafPageOptions {
  node: ModuleTreeNode;
  wikiDir: string;
  repoPath: string;
  llmConfig: LLMConfig;
  maxTokensPerModule: number;
  streamOpts: (label: string, fixedPercent?: number) => CallLLMOptions;
  readSourceFiles: (filePaths: string[]) => Promise<string>;
  truncateSource: (source: string, maxTokens: number) => string;
}

export async function generateLeafPage(options: GenerateLeafPageOptions): Promise<void> {
  const {
    node,
    wikiDir,
    llmConfig,
    maxTokensPerModule,
    streamOpts,
    readSourceFiles,
    truncateSource,
  } = options;
  const filePaths = node.files;

  const sourceCode = await readSourceFiles(filePaths);

  const totalTokens = estimateTokens(sourceCode);
  let finalSourceCode = sourceCode;
  if (totalTokens > maxTokensPerModule) {
    finalSourceCode = truncateSource(sourceCode, maxTokensPerModule);
  }

  const [intraCalls, interCalls, processes] = await Promise.all([
    getIntraModuleCallEdges(filePaths),
    getInterModuleCallEdges(filePaths),
    getProcessesForFiles(filePaths, 5),
  ]);

  const prompt = fillTemplate(MODULE_USER_PROMPT, {
    MODULE_NAME: node.name,
    SOURCE_CODE: finalSourceCode,
    INTRA_CALLS: formatCallEdges(intraCalls),
    OUTGOING_CALLS: formatCallEdges(interCalls.outgoing),
    INCOMING_CALLS: formatCallEdges(interCalls.incoming),
    PROCESSES: formatProcesses(processes),
  });

  const response = await callLLM(
    prompt,
    llmConfig,
    MODULE_SYSTEM_PROMPT,
    streamOpts(node.name),
  );

  const pageContent = `# ${node.name}\n\n${response.content}`;
  await fs.writeFile(path.join(wikiDir, `${node.slug}.md`), pageContent, 'utf-8');
}
