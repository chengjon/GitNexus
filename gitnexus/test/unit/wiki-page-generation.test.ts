import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModuleTreeNode } from '../../src/core/wiki/module-tree/types.js';

const mocks = vi.hoisted(() => ({
  estimateTokens: vi.fn(() => 50),
  callLLM: vi.fn(async () => ({ content: 'Generated content' })),
  getIntraModuleCallEdges: vi.fn(async () => [{ from: 'a', to: 'b' }]),
  getInterModuleCallEdges: vi.fn(async () => ({
    outgoing: [{ from: 'a', to: 'ext' }],
    incoming: [{ from: 'ext', to: 'a' }],
  })),
  getInterModuleEdgesForOverview: vi.fn(async () => []),
  getProcessesForFiles: vi.fn(async () => [{ name: 'CheckoutFlow' }]),
  getAllProcesses: vi.fn(async () => []),
  fillTemplate: vi.fn((_template: string, values: Record<string, string>) => JSON.stringify(values)),
  formatCallEdges: vi.fn((edges: unknown) => `edges:${JSON.stringify(edges)}`),
  formatProcesses: vi.fn((processes: unknown) => `processes:${JSON.stringify(processes)}`),
  writeFile: vi.fn(async () => undefined),
  readFile: vi.fn(async () => '# Child\n\nOverview text\n### Architecture\nDetails'),
}));

vi.mock('../../src/core/wiki/llm-client.js', () => ({
  callLLM: mocks.callLLM,
  estimateTokens: mocks.estimateTokens,
}));

vi.mock('../../src/core/wiki/graph-queries.js', () => ({
  getIntraModuleCallEdges: mocks.getIntraModuleCallEdges,
  getInterModuleCallEdges: mocks.getInterModuleCallEdges,
  getProcessesForFiles: mocks.getProcessesForFiles,
  getInterModuleEdgesForOverview: mocks.getInterModuleEdgesForOverview,
  getAllProcesses: mocks.getAllProcesses,
}));

vi.mock('../../src/core/wiki/prompts.js', () => ({
  MODULE_SYSTEM_PROMPT: 'MODULE_SYSTEM_PROMPT',
  MODULE_USER_PROMPT: 'MODULE_USER_PROMPT',
  PARENT_SYSTEM_PROMPT: 'PARENT_SYSTEM_PROMPT',
  PARENT_USER_PROMPT: 'PARENT_USER_PROMPT',
  OVERVIEW_SYSTEM_PROMPT: 'OVERVIEW_SYSTEM_PROMPT',
  OVERVIEW_USER_PROMPT: 'OVERVIEW_USER_PROMPT',
  fillTemplate: mocks.fillTemplate,
  formatCallEdges: mocks.formatCallEdges,
  formatProcesses: mocks.formatProcesses,
}));

vi.mock('fs/promises', () => ({
  __esModule: true,
  readFile: mocks.readFile,
  writeFile: mocks.writeFile,
  default: {
    readFile: mocks.readFile,
    writeFile: mocks.writeFile,
  },
}));

async function loadLeafModule(): Promise<{ generateLeafPage: (options: unknown) => Promise<void> }> {
  const leafModule = await import('../../src/core/wiki/pages/leaf-page.js');
  return {
    generateLeafPage: leafModule.generateLeafPage,
  };
}

async function loadParentModule(): Promise<{ generateParentPage: (options: unknown) => Promise<void> }> {
  const parentModule = await import('../../src/core/wiki/pages/parent-page.js');
  return {
    generateParentPage: parentModule.generateParentPage,
  };
}

async function loadOverviewModule(): Promise<{ generateOverviewPage: (options: unknown) => Promise<void> }> {
  const overviewModule = await import('../../src/core/wiki/pages/overview-page.js');
  return {
    generateOverviewPage: overviewModule.generateOverviewPage,
  };
}

function makeLeafNode(): ModuleTreeNode {
  return {
    name: 'Auth',
    slug: 'auth',
    files: ['src/auth/login.ts'],
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.estimateTokens.mockReturnValue(50);
  mocks.readFile.mockResolvedValue('# Child\n\nOverview text\n### Architecture\nDetails');
  mocks.getInterModuleEdgesForOverview.mockResolvedValue([]);
  mocks.getAllProcesses.mockResolvedValue([]);
});

describe('wiki page generation contracts', () => {
  it('assembles the leaf page prompt from source and graph data', async () => {
    const { generateLeafPage } = await loadLeafModule();
    const readSourceFiles = vi.fn(async () => 'export const login = () => true;');
    const truncateSource = vi.fn((source: string) => source);

    await generateLeafPage({
      node: makeLeafNode(),
      wikiDir: '/tmp/wiki',
      repoPath: '/tmp/repo',
      llmConfig: { model: 'mock-model' },
      maxTokensPerModule: 1000,
      streamOpts: () => ({}),
      readSourceFiles,
      truncateSource,
    } as any);

    expect(readSourceFiles).toHaveBeenCalledWith(['src/auth/login.ts']);
    expect(mocks.getIntraModuleCallEdges).toHaveBeenCalledWith(['src/auth/login.ts']);
    expect(mocks.getInterModuleCallEdges).toHaveBeenCalledWith(['src/auth/login.ts']);
    expect(mocks.getProcessesForFiles).toHaveBeenCalledWith(['src/auth/login.ts'], 5);

    const promptValues = mocks.fillTemplate.mock.calls[0]?.[1];
    expect(promptValues).toMatchObject({
      MODULE_NAME: 'Auth',
      SOURCE_CODE: 'export const login = () => true;',
      INTRA_CALLS: expect.stringContaining('edges:'),
      OUTGOING_CALLS: expect.stringContaining('edges:'),
      INCOMING_CALLS: expect.stringContaining('edges:'),
      PROCESSES: expect.stringContaining('processes:'),
    });
    expect(mocks.callLLM.mock.calls[0]?.[2]).toBe('MODULE_SYSTEM_PROMPT');
  });

  it('uses truncation when source token budget is exceeded', async () => {
    const { generateLeafPage } = await loadLeafModule();
    const readSourceFiles = vi.fn(async () => 'VERY_LONG_SOURCE');
    const truncateSource = vi.fn(() => 'TRUNCATED_SOURCE');
    mocks.estimateTokens.mockReturnValue(5000);

    await generateLeafPage({
      node: makeLeafNode(),
      wikiDir: '/tmp/wiki',
      repoPath: '/tmp/repo',
      llmConfig: { model: 'mock-model' },
      maxTokensPerModule: 100,
      streamOpts: () => ({}),
      readSourceFiles,
      truncateSource,
    } as any);

    expect(truncateSource).toHaveBeenCalledWith('VERY_LONG_SOURCE', 100);
    const promptValues = mocks.fillTemplate.mock.calls[0]?.[1];
    expect(promptValues.SOURCE_CODE).toBe('TRUNCATED_SOURCE');
  });

  it('assembles the parent page prompt from child docs and graph data', async () => {
    const { generateParentPage } = await loadParentModule();
    const node: ModuleTreeNode = {
      name: 'Backend',
      slug: 'backend',
      files: [],
      children: [
        { name: 'Auth', slug: 'auth', files: ['src/auth/login.ts'] },
        { name: 'Billing', slug: 'billing', files: ['src/billing/invoice.ts'] },
      ],
    };

    mocks.readFile
      .mockResolvedValueOnce('# Auth\n\nAuth overview\n### Architecture\nDetailed')
      .mockRejectedValueOnce(new Error('missing'));

    await generateParentPage({
      node,
      wikiDir: '/tmp/wiki',
      llmConfig: { model: 'mock-model' },
      streamOpts: () => ({}),
    } as any);

    expect(mocks.readFile).toHaveBeenCalledWith(path.join('/tmp/wiki', 'auth.md'), 'utf-8');
    expect(mocks.readFile).toHaveBeenCalledWith(path.join('/tmp/wiki', 'billing.md'), 'utf-8');
    expect(mocks.getIntraModuleCallEdges).toHaveBeenCalledWith([
      'src/auth/login.ts',
      'src/billing/invoice.ts',
    ]);
    expect(mocks.getProcessesForFiles).toHaveBeenCalledWith([
      'src/auth/login.ts',
      'src/billing/invoice.ts',
    ], 3);

    const promptValues = mocks.fillTemplate.mock.calls[0]?.[1];
    expect(promptValues).toMatchObject({
      MODULE_NAME: 'Backend',
      CROSS_MODULE_CALLS: expect.stringContaining('edges:'),
      CROSS_PROCESSES: expect.stringContaining('processes:'),
    });
    expect(promptValues.CHILDREN_DOCS).toContain('#### Auth');
    expect(promptValues.CHILDREN_DOCS).toContain('Auth overview');
    expect(promptValues.CHILDREN_DOCS).toContain('# Auth');
    expect(promptValues.CHILDREN_DOCS).not.toContain('### Architecture');
    expect(promptValues.CHILDREN_DOCS).not.toContain('Detailed');
    expect(promptValues.CHILDREN_DOCS).toContain('#### Billing');
    expect(promptValues.CHILDREN_DOCS).toContain('(Documentation not yet generated)');
    expect(mocks.callLLM.mock.calls[0]?.[2]).toBe('PARENT_SYSTEM_PROMPT');
    expect(mocks.writeFile).toHaveBeenCalledWith(
      path.join('/tmp/wiki', 'backend.md'),
      expect.stringContaining('# Backend'),
      'utf-8',
    );
  });

  it('assembles overview module summaries with trim and pending fallbacks', async () => {
    const { generateOverviewPage } = await loadOverviewModule();
    const longOverview = `# Users\n\n${'A'.repeat(700)}\nTRIMMED_SUFFIX`;
    const expectedUsersOverview = longOverview.slice(0, 600).trim();
    const moduleTree: ModuleTreeNode[] = [
      { name: 'Auth', slug: 'auth', files: ['src/auth/login.ts'] },
      { name: 'Users', slug: 'users', files: ['src/users/profile.ts'] },
      { name: 'Billing', slug: 'billing', files: ['src/billing/invoice.ts'] },
    ];
    const extractModuleFiles = vi.fn(() => ({
      Auth: ['src/auth/login.ts'],
      Users: ['src/users/profile.ts'],
      Billing: ['src/billing/invoice.ts'],
    }));
    const readProjectInfo = vi.fn(async () => 'Project info text');

    mocks.readFile
      .mockResolvedValueOnce('# Auth\n\nAuth summary\n### Architecture\nHidden details')
      .mockResolvedValueOnce(longOverview)
      .mockRejectedValueOnce(new Error('missing'));
    mocks.getInterModuleEdgesForOverview.mockResolvedValue([]);
    mocks.getAllProcesses.mockResolvedValue([{ name: 'BootstrapFlow' }]);

    await generateOverviewPage({
      moduleTree,
      wikiDir: '/tmp/wiki',
      repoPath: '/tmp/sample-repo',
      llmConfig: { model: 'mock-model' },
      streamOpts: () => ({}),
      readProjectInfo,
      extractModuleFiles,
    } as any);

    expect(mocks.readFile).toHaveBeenCalledWith(path.join('/tmp/wiki', 'auth.md'), 'utf-8');
    expect(mocks.readFile).toHaveBeenCalledWith(path.join('/tmp/wiki', 'users.md'), 'utf-8');
    expect(mocks.readFile).toHaveBeenCalledWith(path.join('/tmp/wiki', 'billing.md'), 'utf-8');

    const promptValues = mocks.fillTemplate.mock.calls[0]?.[1];
    expect(promptValues.MODULE_SUMMARIES).toContain('#### Auth');
    expect(promptValues.MODULE_SUMMARIES).toContain('Auth summary');
    expect(promptValues.MODULE_SUMMARIES).not.toContain('Hidden details');
    expect(promptValues.MODULE_SUMMARIES).toContain('#### Users');
    expect(promptValues.MODULE_SUMMARIES).toContain(expectedUsersOverview);
    expect(promptValues.MODULE_SUMMARIES).not.toContain('TRIMMED_SUFFIX');
    expect(promptValues.MODULE_SUMMARIES).toContain('#### Billing');
    expect(promptValues.MODULE_SUMMARIES).toContain('(Documentation pending)');
  });

  it('assembles overview prompt inputs from project info and graph data', async () => {
    const { generateOverviewPage } = await loadOverviewModule();
    const moduleTree: ModuleTreeNode[] = [
      { name: 'Auth', slug: 'auth', files: ['src/auth/login.ts'] },
    ];
    const extractModuleFiles = vi.fn(() => ({
      Auth: ['src/auth/login.ts'],
    }));
    const readProjectInfo = vi.fn(async () => 'Project info text');

    mocks.readFile.mockResolvedValueOnce('# Auth\n\nAuth summary\n### Architecture\nHidden details');
    mocks.getInterModuleEdgesForOverview.mockResolvedValue([]);
    mocks.getAllProcesses.mockResolvedValue([{ name: 'BootstrapFlow' }]);

    await generateOverviewPage({
      moduleTree,
      wikiDir: '/tmp/wiki',
      repoPath: '/tmp/sample-repo',
      llmConfig: { model: 'mock-model' },
      streamOpts: () => ({}),
      readProjectInfo,
      extractModuleFiles,
    } as any);

    expect(extractModuleFiles).toHaveBeenCalledWith(moduleTree);
    expect(mocks.getInterModuleEdgesForOverview).toHaveBeenCalledWith({
      Auth: ['src/auth/login.ts'],
    });
    expect(mocks.getAllProcesses).toHaveBeenCalledWith(5);

    expect(mocks.fillTemplate.mock.calls[0]?.[0]).toBe('OVERVIEW_USER_PROMPT');
    const promptValues = mocks.fillTemplate.mock.calls[0]?.[1];
    expect(promptValues.PROJECT_INFO).toBe('Project info text');
    expect(promptValues.MODULE_EDGES).toBe('No inter-module call edges detected');
    expect(promptValues.TOP_PROCESSES).toContain('processes:');
  });

  it('writes overview output using overview.md and repo title', async () => {
    const { generateOverviewPage } = await loadOverviewModule();
    const moduleTree: ModuleTreeNode[] = [
      { name: 'Auth', slug: 'auth', files: ['src/auth/login.ts'] },
    ];

    await generateOverviewPage({
      moduleTree,
      wikiDir: '/tmp/wiki',
      repoPath: '/tmp/sample-repo',
      llmConfig: { model: 'mock-model' },
      streamOpts: () => ({}),
      readProjectInfo: async () => 'Project info text',
      extractModuleFiles: () => ({
        Auth: ['src/auth/login.ts'],
      }),
    } as any);

    expect(mocks.callLLM.mock.calls[0]?.[2]).toBe('OVERVIEW_SYSTEM_PROMPT');
    expect(mocks.writeFile).toHaveBeenCalledWith(
      path.join('/tmp/wiki', 'overview.md'),
      expect.stringContaining('# sample-repo — Wiki'),
      'utf-8',
    );
  });

  it('writes generated page output using slug.md naming', async () => {
    const { generateLeafPage } = await loadLeafModule();

    await generateLeafPage({
      node: makeLeafNode(),
      wikiDir: '/tmp/wiki',
      repoPath: '/tmp/repo',
      llmConfig: { model: 'mock-model' },
      maxTokensPerModule: 1000,
      streamOpts: () => ({}),
      readSourceFiles: async () => 'const ok = true;',
      truncateSource: (source: string) => source,
    } as any);

    expect(mocks.writeFile).toHaveBeenCalledWith(
      path.join('/tmp/wiki', 'auth.md'),
      expect.stringContaining('# Auth'),
      'utf-8',
    );
  });
});
