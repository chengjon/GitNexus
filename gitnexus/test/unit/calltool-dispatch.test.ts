/**
 * Unit Tests: LocalBackend callTool dispatch & lifecycle
 *
 * Tests the callTool dispatch logic, resolveRepo, init/disconnect,
 * error cases, and silent failure patterns — all with mocked KuzuDB.
 *
 * These are pure unit tests that mock the KuzuDB layer to test
 * the dispatch and error handling logic in isolation.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';

// We need to mock the KuzuDB adapter and repo-manager BEFORE importing LocalBackend
vi.mock('../../src/mcp/core/kuzu-adapter.js', () => ({
  initKuzu: vi.fn().mockResolvedValue(undefined),
  executeQuery: vi.fn().mockResolvedValue([]),
  executeParameterized: vi.fn().mockResolvedValue([]),
  closeKuzu: vi.fn().mockResolvedValue(undefined),
  isKuzuReady: vi.fn().mockReturnValue(true),
}));

vi.mock('../../src/storage/repo-manager.js', () => ({
  listRegisteredRepos: vi.fn().mockResolvedValue([]),
}));

// Also mock the search modules to avoid loading onnxruntime
vi.mock('../../src/core/search/bm25-index.js', () => ({
  searchFTSFromKuzu: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../src/mcp/core/embedder.js', () => ({
  embedQuery: vi.fn().mockResolvedValue([]),
  getEmbeddingDims: vi.fn().mockReturnValue(384),
}));

vi.mock('child_process', () => ({
  execFileSync: vi.fn(),
}));

import { LocalBackend, isWriteQuery, CYPHER_WRITE_RE, VALID_NODE_LABELS } from '../../src/mcp/local/local-backend.js';
import {
  isWriteQuery as sharedIsWriteQuery,
  CYPHER_WRITE_RE as SHARED_CYPHER_WRITE_RE,
  VALID_NODE_LABELS as SHARED_VALID_NODE_LABELS,
} from '../../src/mcp/local/tools/shared/query-safety.js';
import { formatCypherAsMarkdown } from '../../src/mcp/local/tools/shared/cypher-format.js';
import { listRegisteredRepos } from '../../src/storage/repo-manager.js';
import { initKuzu, executeQuery, executeParameterized, isKuzuReady, closeKuzu } from '../../src/mcp/core/kuzu-adapter.js';
import { execFileSync } from 'child_process';

// ─── Helpers ─────────────────────────────────────────────────────────

const MOCK_REPO_ENTRY = {
  name: 'test-project',
  path: '/tmp/test-project',
  storagePath: '/tmp/.gitnexus/test-project',
  indexedAt: '2024-06-01T12:00:00Z',
  lastCommit: 'abc1234567890',
  stats: { files: 10, nodes: 50, edges: 100, communities: 3, processes: 5 },
};

function setupSingleRepo() {
  (listRegisteredRepos as any).mockResolvedValue([MOCK_REPO_ENTRY]);
}

function setupMultipleRepos() {
  (listRegisteredRepos as any).mockResolvedValue([
    MOCK_REPO_ENTRY,
    {
      ...MOCK_REPO_ENTRY,
      name: 'other-project',
      path: '/tmp/other-project',
      storagePath: '/tmp/.gitnexus/other-project',
    },
  ]);
}

function setupNoRepos() {
  (listRegisteredRepos as any).mockResolvedValue([]);
}

function setupCaseCollisionRepos() {
  (listRegisteredRepos as any).mockResolvedValue([
    {
      ...MOCK_REPO_ENTRY,
      name: 'gitnexus',
      path: path.resolve('/tmp/gitnexus-lower'),
      storagePath: '/tmp/.gitnexus/gitnexus-lower',
    },
    {
      ...MOCK_REPO_ENTRY,
      name: 'GitNexus',
      path: path.resolve('/tmp/GitNexus-upper'),
      storagePath: '/tmp/.gitnexus/GitNexus-upper',
    },
  ]);
}

// ─── LocalBackend lifecycle ──────────────────────────────────────────

describe('LocalBackend.init', () => {
  let backend: LocalBackend;

  beforeEach(() => {
    backend = new LocalBackend();
    vi.clearAllMocks();
  });

  it('returns true when repos are available', async () => {
    setupSingleRepo();
    const result = await backend.init();
    expect(result).toBe(true);
  });

  it('returns false when no repos are registered', async () => {
    setupNoRepos();
    const result = await backend.init();
    expect(result).toBe(false);
  });

  it('calls listRegisteredRepos with validate: true', async () => {
    setupSingleRepo();
    await backend.init();
    expect(listRegisteredRepos).toHaveBeenCalledWith({ validate: true });
  });
});

describe('LocalBackend.disconnect', () => {
  let backend: LocalBackend;

  beforeEach(() => {
    backend = new LocalBackend();
    vi.clearAllMocks();
  });

  it('does not throw when no repos are initialized', async () => {
    setupNoRepos();
    await backend.init();
    await expect(backend.disconnect()).resolves.not.toThrow();
  });

  it('calls closeKuzu on disconnect', async () => {
    setupSingleRepo();
    await backend.init();
    await backend.disconnect();
    expect(closeKuzu).toHaveBeenCalled();
  });
});

// ─── callTool dispatch ───────────────────────────────────────────────

describe('LocalBackend.callTool', () => {
  let backend: LocalBackend;

  beforeEach(async () => {
    vi.clearAllMocks();
    backend = new LocalBackend();
    setupSingleRepo();
    await backend.init();
  });

  it('routes list_repos without needing repo param', async () => {
    const result = await backend.callTool('list_repos', {});
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].name).toBe('test-project');
  });

  it('throws for unknown tool name', async () => {
    await expect(backend.callTool('nonexistent_tool', {}))
      .rejects.toThrow('Unknown tool: nonexistent_tool');
  });

  it('dispatches query tool', async () => {
    (executeParameterized as any).mockResolvedValue([]);
    const result = await backend.callTool('query', { query: 'auth' });
    expect(result).toHaveProperty('processes');
    expect(result).toHaveProperty('definitions');
  });

  it('query tool returns error for empty query', async () => {
    const result = await backend.callTool('query', { query: '' });
    expect(result.error).toContain('query parameter is required');
  });

  it('query tool returns error for whitespace-only query', async () => {
    const result = await backend.callTool('query', { query: '   ' });
    expect(result.error).toContain('query parameter is required');
  });

  it('dispatches cypher tool and blocks write queries', async () => {
    const result = await backend.callTool('cypher', { query: 'CREATE (n:Test)' });
    expect(result).toHaveProperty('error');
    expect(result.error).toContain('Write operations');
  });

  it('dispatches cypher tool with valid read query', async () => {
    (executeQuery as any).mockResolvedValue([
      { name: 'test', filePath: 'src/test.ts' },
    ]);
    const result = await backend.callTool('cypher', {
      query: 'MATCH (n:Function) RETURN n.name AS name, n.filePath AS filePath LIMIT 5',
    });
    // formatCypherAsMarkdown returns { markdown, row_count } for tabular results
    expect(result).toHaveProperty('markdown');
    expect(result).toHaveProperty('row_count');
    expect(result.row_count).toBe(1);
  });

  it('dispatches context tool', async () => {
    (executeParameterized as any).mockResolvedValue([
      { id: 'func:main', name: 'main', type: 'Function', filePath: 'src/index.ts', startLine: 1, endLine: 10 },
    ]);
    const result = await backend.callTool('context', { name: 'main' });
    expect(result.status).toBe('found');
    expect(result.symbol.name).toBe('main');
  });

  it('context tool returns error when name and uid are both missing', async () => {
    const result = await backend.callTool('context', {});
    expect(result.error).toContain('Either "name" or "uid"');
  });

  it('context tool returns not-found for missing symbol', async () => {
    (executeParameterized as any).mockResolvedValue([]);
    const result = await backend.callTool('context', { name: 'doesNotExist' });
    expect(result.error).toContain('not found');
  });

  it('context tool returns disambiguation for multiple matches', async () => {
    (executeParameterized as any).mockResolvedValue([
      { id: 'func:main:1', name: 'main', type: 'Function', filePath: 'src/a.ts', startLine: 1, endLine: 5 },
      { id: 'func:main:2', name: 'main', type: 'Function', filePath: 'src/b.ts', startLine: 1, endLine: 5 },
    ]);
    const result = await backend.callTool('context', { name: 'main' });
    expect(result.status).toBe('ambiguous');
    expect(result.candidates).toHaveLength(2);
  });

  it('dispatches impact tool', async () => {
    // impact() calls executeParameterized to find target, then executeQuery for traversal
    (executeParameterized as any).mockResolvedValue([
      { id: 'func:main', name: 'main', type: 'Function', filePath: 'src/index.ts' },
    ]);
    (executeQuery as any).mockResolvedValue([]);

    const result = await backend.callTool('impact', { target: 'main', direction: 'upstream' });
    expect(result).toBeDefined();
    expect(result.target).toBeDefined();
  });

  it('impact tool sanitizes untyped minConfidence before query interpolation', async () => {
    (executeParameterized as any).mockResolvedValue([
      { id: 'func:main', name: 'main', type: 'Function', filePath: 'src/index.ts' },
    ]);
    (executeQuery as any).mockResolvedValue([]);

    const result = await backend.callTool('impact', {
      target: 'main',
      direction: 'upstream',
      minConfidence: 'Infinity' as any,
    });

    expect(result).toBeDefined();
    expect(result.error).toBeUndefined();
    const traversalQuery = vi.mocked(executeQuery).mock.calls[0]?.[1] as string;
    expect(traversalQuery).not.toContain('Infinity');
    expect(traversalQuery).not.toContain('r.confidence >=');
  });

  it('impact tool preserves zero confidence values in traversal results', async () => {
    (executeParameterized as any).mockResolvedValue([
      { id: 'func:main', name: 'main', type: 'Function', filePath: 'src/index.ts' },
    ]);
    vi.mocked(executeQuery)
      .mockResolvedValueOnce([
        {
          sourceId: 'func:main',
          id: 'func:caller',
          name: 'caller',
          type: 'Function',
          filePath: 'src/caller.ts',
          relType: 'CALLS',
          confidence: 0,
        },
      ] as any)
      .mockResolvedValueOnce([] as any)
      .mockResolvedValueOnce([] as any)
      .mockResolvedValueOnce([] as any);

    const result = await backend.callTool('impact', { target: 'main', direction: 'upstream' });
    const direct = result.byDepth[1] || result.byDepth['1'] || [];
    expect(direct).toHaveLength(1);
    expect(direct[0].confidence).toBe(0);
  });

  it('dispatches impact tool for file path targets', async () => {
    (executeParameterized as any)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 'file:view', name: 'Tdx.vue', type: 'File', filePath: 'web/frontend/src/views/market/Tdx.vue' },
      ]);
    (executeQuery as any).mockResolvedValue([]);

    const result = await backend.callTool('impact', {
      target: 'web/frontend/src/views/market/Tdx.vue',
      direction: 'upstream',
    });

    expect(result).toBeDefined();
    expect(result.error).toBeUndefined();
    expect(result.target).toMatchObject({
      name: 'Tdx.vue',
      filePath: 'web/frontend/src/views/market/Tdx.vue',
    });
  });

  it.each([
    ['unstaged', undefined, ['diff', '--name-only']],
    ['staged', undefined, ['diff', '--staged', '--name-only']],
    ['all', undefined, ['diff', 'HEAD', '--name-only']],
    ['compare', 'main', ['diff', 'main', '--name-only']],
  ] as const)('dispatches detect_changes tool for %s scope', async (scope, baseRef, expectedArgs) => {
    vi.mocked(execFileSync).mockReturnValue('src/auth.ts\n' as any);

    const result = await backend.callTool('detect_changes', {
      scope,
      ...(baseRef ? { base_ref: baseRef } : {}),
    });

    expect(vi.mocked(execFileSync)).toHaveBeenCalledWith(
      'git',
      expectedArgs,
      expect.objectContaining({
        cwd: '/tmp/test-project',
        encoding: 'utf-8',
      }),
    );
    expect(result).toEqual(expect.objectContaining({
      summary: expect.objectContaining({
        changed_count: expect.any(Number),
        affected_count: expect.any(Number),
        changed_files: 1,
        risk_level: expect.any(String),
      }),
      changed_symbols: expect.any(Array),
      affected_processes: expect.any(Array),
    }));
  });

  it('detect_changes reports git execution path metadata and warnings for cwd mismatch', async () => {
    vi.mocked(execFileSync).mockReturnValue('src/auth.ts\n' as any);

    const result = await backend.callTool('detect_changes', { scope: 'unstaged' });

    expect(result).toEqual(expect.objectContaining({
      metadata: expect.objectContaining({
        git_repo_path: '/tmp/test-project',
        process_cwd: expect.any(String),
        scope: 'unstaged',
      }),
      warnings: expect.arrayContaining([
        expect.stringContaining('/tmp/test-project'),
      ]),
    }));
  });

  it('detect_changes compare scope requires base_ref', async () => {
    const result = await backend.callTool('detect_changes', { scope: 'compare' });
    expect(result).toEqual({ error: 'base_ref is required for "compare" scope' });
  });

  it('detect_changes surfaces git diff errors', async () => {
    vi.mocked(execFileSync).mockImplementation(() => {
      throw new Error('fatal: not a git repository');
    });

    const result = await backend.callTool('detect_changes', { scope: 'unstaged' });
    expect(result).toEqual(expect.objectContaining({
      error: 'Git diff failed: fatal: not a git repository',
      metadata: expect.objectContaining({
        git_repo_path: '/tmp/test-project',
        process_cwd: expect.any(String),
        scope: 'unstaged',
      }),
      warnings: expect.any(Array),
    }));
  });

  it('detect_changes filters out path-collision symbols for similarly named files', async () => {
    vi.mocked(execFileSync).mockReturnValue('src/auth.ts\n' as any);
    (executeParameterized as any).mockImplementation(async (_repoId: string, query: string) => {
      if (query.includes('n.filePath = $relativePath')) {
        return [
          { id: 'file:auth.ts', name: 'auth.ts', type: 'File', filePath: 'src/auth.ts' },
          { id: 'file:auth.tsx', name: 'auth.tsx', type: 'File', filePath: 'src/auth.tsx' },
        ];
      }
      if (query.includes(`MATCH (n {id: $nodeId})-[r:CodeRelation {type: 'STEP_IN_PROCESS'}]->(p:Process)`)) {
        return [];
      }
      return [];
    });

    const result = await backend.callTool('detect_changes', { scope: 'unstaged' });

    expect(result.changed_symbols).toHaveLength(1);
    expect(result.changed_symbols[0].filePath).toBe('src/auth.ts');
  });

  it('dispatches rename tool', async () => {
    (executeParameterized as any)
      .mockResolvedValueOnce([
        { id: 'func:oldName', name: 'oldName', type: 'Function', filePath: 'src/test.ts', startLine: 1, endLine: 5 },
      ])
      .mockResolvedValue([]);

    const result = await backend.callTool('rename', {
      symbol_name: 'oldName',
      new_name: 'newName',
      dry_run: true,
    });
    expect(result).toBeDefined();
  });

  it('rename returns error when both symbol_name and symbol_uid are missing', async () => {
    const result = await backend.callTool('rename', { new_name: 'newName' });
    expect(result.error).toContain('Either symbol_name or symbol_uid');
  });

  it('rename defaults dry_run=true, keeps graph confidence tags, and surfaces traversal errors', async () => {
    await fs.mkdir('/tmp/test-project/src', { recursive: true });
    await fs.writeFile('/tmp/test-project/src/test.ts', 'function oldName() {}\n', 'utf-8');

    (executeParameterized as any)
      .mockResolvedValueOnce([
        { id: 'func:oldName', name: 'oldName', type: 'Function', filePath: 'src/test.ts', startLine: 1, endLine: 5 },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    vi.mocked(execFileSync).mockReturnValue('' as any);

    const dryRunResult = await backend.callTool('rename', {
      symbol_name: 'oldName',
      new_name: 'newName',
    });

    expect(dryRunResult.applied).toBe(false);
    expect(dryRunResult.graph_edits).toBe(1);
    expect(dryRunResult.changes[0].edits[0].confidence).toBe('graph');

    (executeParameterized as any)
      .mockResolvedValueOnce([
        { id: 'func:oldName', name: 'oldName', type: 'Function', filePath: '../escape.ts', startLine: 1, endLine: 5 },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    vi.mocked(execFileSync).mockReturnValue('' as any);

    const traversalResult = await backend.callTool('rename', {
      symbol_name: 'oldName',
      new_name: 'newName',
      dry_run: true,
    });

    expect(traversalResult.error).toContain('Path traversal blocked: ../escape.ts');

    expect((backend as any).rename).toBeUndefined();
  });

  it('rename previews and applies all matching lines in graph-covered files', async () => {
    await fs.mkdir('/tmp/test-project/src', { recursive: true });
    await fs.writeFile(
      '/tmp/test-project/src/test.ts',
      'function oldName() {}\nconst followup = oldName();\n',
      'utf-8',
    );

    (executeParameterized as any)
      .mockResolvedValueOnce([
        { id: 'func:oldName', name: 'oldName', type: 'Function', filePath: 'src/test.ts', startLine: 1, endLine: 5 },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    vi.mocked(execFileSync).mockReturnValue('' as any);

    const preview = await backend.callTool('rename', {
      symbol_name: 'oldName',
      new_name: 'newName',
      dry_run: true,
    });
    expect(preview.applied).toBe(false);
    expect(preview.changes).toHaveLength(1);
    expect(preview.changes[0].edits).toHaveLength(2);
    expect(preview.changes[0].edits[0].line).toBe(1);
    expect(preview.changes[0].edits[1].line).toBe(2);

    (executeParameterized as any)
      .mockResolvedValueOnce([
        { id: 'func:oldName', name: 'oldName', type: 'Function', filePath: 'src/test.ts', startLine: 1, endLine: 5 },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    vi.mocked(execFileSync).mockReturnValue('' as any);

    const applied = await backend.callTool('rename', {
      symbol_name: 'oldName',
      new_name: 'newName',
      dry_run: false,
    });
    expect(applied.applied).toBe(true);

    const updated = await fs.readFile('/tmp/test-project/src/test.ts', 'utf-8');
    const [line1, line2] = updated.split('\n');
    expect(line1).toContain('newName');
    expect(line2).toContain('newName');
    expect(line2).not.toContain('oldName');
  });

  it('rename escapes regex metacharacters when building ripgrep pattern', async () => {
    await fs.mkdir('/tmp/test-project/src', { recursive: true });
    await fs.writeFile('/tmp/test-project/src/test.ts', 'const value = old.Name;\n', 'utf-8');

    (executeParameterized as any)
      .mockResolvedValueOnce([
        { id: 'sym:old.dot', name: 'old.Name', type: 'Function', filePath: 'src/test.ts', startLine: 1, endLine: 1 },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    vi.mocked(execFileSync).mockReturnValue('' as any);

    await backend.callTool('rename', {
      symbol_name: 'old.Name',
      new_name: 'new.Name',
      dry_run: true,
    });

    expect(vi.mocked(execFileSync)).toHaveBeenCalledWith(
      'rg',
      expect.arrayContaining(['\\bold\\.Name\\b']),
      expect.objectContaining({
        cwd: '/tmp/test-project',
        encoding: 'utf-8',
        timeout: 5000,
      }),
    );
  });

  it('rename reports skipped text-search coverage when ripgrep fails', async () => {
    await fs.mkdir('/tmp/test-project/src', { recursive: true });
    await fs.writeFile('/tmp/test-project/src/test.ts', 'function oldName() {}\n', 'utf-8');

    (executeParameterized as any)
      .mockResolvedValueOnce([
        { id: 'func:oldName', name: 'oldName', type: 'Function', filePath: 'src/test.ts', startLine: 1, endLine: 5 },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    vi.mocked(execFileSync).mockImplementation(() => {
      throw new Error('rg timed out');
    });

    const result = await backend.callTool('rename', {
      symbol_name: 'oldName',
      new_name: 'newName',
      dry_run: true,
    });

    expect(result.status).toBe('success');
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.stringMatching(/text-search coverage/i),
      expect.stringMatching(/ripgrep/i),
    ]));
  });

  // Legacy tool aliases
  it('dispatches "search" as alias for query', async () => {
    (executeParameterized as any).mockResolvedValue([]);
    const result = await backend.callTool('search', { query: 'auth' });
    expect(result).toHaveProperty('processes');
  });

  it('dispatches "explore" as alias for context', async () => {
    (executeParameterized as any).mockResolvedValue([
      { id: 'func:main', name: 'main', type: 'Function', filePath: 'src/index.ts', startLine: 1, endLine: 10 },
    ]);
    const result = await backend.callTool('explore', { name: 'main' });
    // explore calls context — which may return found or ambiguous depending on mock
    expect(result).toBeDefined();
    expect(result.status === 'found' || result.symbol || result.error === undefined).toBeTruthy();
  });

  it('preserves read-only callTool dispatch contract for core tools and aliases', async () => {
    (executeQuery as any).mockResolvedValue([{ name: 'main', filePath: 'src/index.ts' }]);
    (executeParameterized as any).mockImplementation(async (_repoId: string, query: string) => {
      if (query.includes('MATCH (n) WHERE n.name = $symName')) {
        return [{ id: 'func:main', name: 'main', type: 'Function', filePath: 'src/index.ts', startLine: 1, endLine: 10 }];
      }
      if (query.includes('MATCH (caller)-[r:CodeRelation]->(n {id: $symId})')) {
        return [{ relType: 'CALLS', uid: 'func:caller', name: 'caller', filePath: 'src/caller.ts', kind: 'Function' }];
      }
      if (query.includes('MATCH (n {id: $symId})-[r:CodeRelation]->(target)')) {
        return [{ relType: 'CALLS', uid: 'func:callee', name: 'callee', filePath: 'src/callee.ts', kind: 'Function' }];
      }
      if (query.includes(`MATCH (n {id: $symId})-[r:CodeRelation {type: 'STEP_IN_PROCESS'}]->(p:Process)`)) {
        return [{ pid: 'proc:login', label: 'Login', step: 1, stepCount: 3 }];
      }
      return [];
    });

    const queryResult = await backend.callTool('query', { query: 'main' });
    expect(queryResult).toEqual(expect.objectContaining({
      processes: expect.any(Array),
      definitions: expect.any(Array),
    }));

    const cypherResult = await backend.callTool('cypher', {
      query: 'MATCH (n:Function) RETURN n.name AS name, n.filePath AS filePath LIMIT 1',
    });
    expect(cypherResult).toEqual(expect.objectContaining({
      markdown: expect.any(String),
      row_count: 1,
    }));

    const contextResult = await backend.callTool('context', { name: 'main' });
    expect(contextResult).toEqual(expect.objectContaining({
      status: 'found',
      symbol: expect.objectContaining({ name: 'main' }),
    }));

    const searchAliasResult = await backend.callTool('search', { query: 'main' });
    expect(searchAliasResult).toEqual(expect.objectContaining({
      processes: expect.any(Array),
      definitions: expect.any(Array),
    }));

    const exploreAliasResult = await backend.callTool('explore', { name: 'main' });
    expect(exploreAliasResult).toEqual(expect.objectContaining({
      status: 'found',
      symbol: expect.objectContaining({ name: 'main' }),
    }));
  });
});

describe('LocalBackend shared query-safety compatibility exports', () => {
  it('re-exported regex and predicate remain aligned with shared module', () => {
    expect(CYPHER_WRITE_RE).toBe(SHARED_CYPHER_WRITE_RE);
    expect(isWriteQuery).toBe(sharedIsWriteQuery);
    expect(VALID_NODE_LABELS).toBe(SHARED_VALID_NODE_LABELS);
    expect(sharedIsWriteQuery('DELETE n')).toBe(isWriteQuery('DELETE n'));
    expect(sharedIsWriteQuery('MATCH (n) RETURN n')).toBe(isWriteQuery('MATCH (n) RETURN n'));
  });
});

// ─── Repo resolution ────────────────────────────────────────────────

describe('LocalBackend.resolveRepo', () => {
  let backend: LocalBackend;

  beforeEach(async () => {
    vi.clearAllMocks();
    backend = new LocalBackend();
  });

  it('resolves single repo without param', async () => {
    setupSingleRepo();
    await backend.init();
    const result = await backend.callTool('list_repos', {});
    expect(result).toHaveLength(1);
  });

  it('throws when no repos are registered', async () => {
    setupNoRepos();
    await backend.init();
    await expect(backend.callTool('query', { query: 'test' }))
      .rejects.toThrow('No indexed repositories');
  });

  it('throws for ambiguous repos without param', async () => {
    setupMultipleRepos();
    await backend.init();
    await expect(backend.callTool('query', { query: 'test' }))
      .rejects.toThrow('Multiple repositories indexed');
  });

  it('resolves repo by name parameter', async () => {
    setupMultipleRepos();
    await backend.init();
    // With repo param, it should resolve correctly
    (executeParameterized as any).mockResolvedValue([]);
    const result = await backend.callTool('query', {
      query: 'auth',
      repo: 'test-project',
    });
    expect(result).toHaveProperty('processes');
  });

  it('throws for unknown repo name', async () => {
    setupSingleRepo();
    await backend.init();
    await expect(backend.callTool('query', { query: 'test', repo: 'nonexistent' }))
      .rejects.toThrow('not found');
  });

  it('resolves repo case-insensitively', async () => {
    setupSingleRepo();
    await backend.init();
    (executeParameterized as any).mockResolvedValue([]);
    // Should match even with different case
    const result = await backend.callTool('query', {
      query: 'test',
      repo: 'Test-Project',
    });
    expect(result).toHaveProperty('processes');
  });

  it('refreshes registry on repo miss', async () => {
    setupNoRepos();
    await backend.init();

    // Now make a repo appear
    (listRegisteredRepos as any).mockResolvedValue([MOCK_REPO_ENTRY]);

    // The resolve should re-read the registry and find the new repo
    (executeParameterized as any).mockResolvedValue([]);
    const result = await backend.callTool('query', {
      query: 'test',
      repo: 'test-project',
    });
    expect(result).toHaveProperty('processes');
    // listRegisteredRepos should have been called again
    expect(listRegisteredRepos).toHaveBeenCalledTimes(2); // once in init, once in refreshRepos
  });

  it('prefers exact case-sensitive repo names before internal id matches', async () => {
    setupCaseCollisionRepos();
    await backend.init();

    const repo = await backend.resolveRepo('GitNexus');

    expect(repo.repoPath).toBe(path.resolve('/tmp/GitNexus-upper'));
    expect(repo.name).toBe('GitNexus');
  });

  it('prefers exact repo paths before name or id fallbacks', async () => {
    setupCaseCollisionRepos();
    await backend.init();

    const repo = await backend.resolveRepo(path.resolve('/tmp/gitnexus-lower'));

    expect(repo.repoPath).toBe(path.resolve('/tmp/gitnexus-lower'));
    expect(repo.name).toBe('gitnexus');
  });

  it('throws when a repo parameter is ambiguous after case-insensitive matching', async () => {
    setupCaseCollisionRepos();
    await backend.init();

    await expect(backend.resolveRepo('GITNEXUS'))
      .rejects.toThrow(/Use one of:/i);
  });

  it('keeps repo ids deterministic for duplicate names across refresh order changes', async () => {
    const lower = {
      ...MOCK_REPO_ENTRY,
      name: 'gitnexus',
      path: path.resolve('/tmp/gitnexus-lower'),
      storagePath: '/tmp/.gitnexus/gitnexus-lower',
    };
    const upper = {
      ...MOCK_REPO_ENTRY,
      name: 'GitNexus',
      path: path.resolve('/tmp/GitNexus-upper'),
      storagePath: '/tmp/.gitnexus/GitNexus-upper',
    };

    (listRegisteredRepos as any).mockResolvedValue([lower, upper]);
    const backendA = new LocalBackend();
    await backendA.init();
    const idsA = new Map(
      (backendA as any).runtime
        .getRepos()
        .map((repo: any) => [repo.repoPath, repo.id]),
    );

    (listRegisteredRepos as any).mockResolvedValue([upper, lower]);
    const backendB = new LocalBackend();
    await backendB.init();
    const idsB = new Map(
      (backendB as any).runtime
        .getRepos()
        .map((repo: any) => [repo.repoPath, repo.id]),
    );

    expect(idsA.get(lower.path)).toBe(idsB.get(lower.path));
    expect(idsA.get(upper.path)).toBe(idsB.get(upper.path));
    expect(idsA.get(lower.path)).not.toBe(idsA.get(upper.path));
  });
});

// ─── getContext ──────────────────────────────────────────────────────

describe('LocalBackend.getContext', () => {
  let backend: LocalBackend;

  beforeEach(async () => {
    vi.clearAllMocks();
    backend = new LocalBackend();
    setupSingleRepo();
    await backend.init();
  });

  it('returns context for single repo without specifying id', () => {
    const ctx = backend.getContext();
    expect(ctx).not.toBeNull();
    expect(ctx!.projectName).toBe('test-project');
    expect(ctx!.stats.fileCount).toBe(10);
    expect(ctx!.stats.functionCount).toBe(50);
  });

  it('returns context by repo id', () => {
    const ctx = backend.getContext('test-project');
    expect(ctx).not.toBeNull();
    expect(ctx!.projectName).toBe('test-project');
  });

  it('returns single repo context even with unknown id (single-repo fallback)', () => {
    // When only 1 repo is registered, getContext falls through the id check
    // and returns the single repo's context. This is intentional behavior.
    const ctx = backend.getContext('nonexistent');
    // The id doesn't match, but since repos.size === 1, it returns that single context
    // This is the actual behavior — test documents it
    expect(ctx).not.toBeNull();
    expect(ctx!.projectName).toBe('test-project');
  });
});

// ─── KuzuDB lazy initialization ──────────────────────────────────────

describe('ensureInitialized', () => {
  let backend: LocalBackend;

  beforeEach(async () => {
    vi.clearAllMocks();
    backend = new LocalBackend();
    setupSingleRepo();
    await backend.init();
  });

  it('calls initKuzu on first tool call', async () => {
    (executeParameterized as any).mockResolvedValue([]);
    await backend.callTool('query', { query: 'test' });
    expect(initKuzu).toHaveBeenCalled();
  });

  it('retries initKuzu if connection was evicted', async () => {
    (executeParameterized as any).mockResolvedValue([]);
    // First call initializes
    await backend.callTool('query', { query: 'test' });
    expect(initKuzu).toHaveBeenCalledTimes(1);

    // Simulate idle eviction
    (isKuzuReady as any).mockReturnValueOnce(false);
    await backend.callTool('query', { query: 'test' });
    expect(initKuzu).toHaveBeenCalledTimes(2);
  });

  it('handles initKuzu failure gracefully', async () => {
    (initKuzu as any).mockRejectedValueOnce(new Error('DB locked'));
    await expect(backend.callTool('query', { query: 'test' }))
      .rejects.toThrow('DB locked');
  });

  it.each([
    ['query', { query: 'test' }],
    ['context', { name: 'main' }],
    ['impact', { target: 'main', direction: 'upstream' }],
  ])('returns actionable missing-kuzu guidance for %s', async (method, params) => {
    (initKuzu as any).mockRejectedValueOnce(
      new Error('KuzuDB not found at /tmp/.gitnexus/test-project/kuzu. Run: gitnexus analyze'),
    );

    await expect(backend.callTool(method as string, params))
      .rejects.toThrow('Run: gitnexus analyze');
  });
});

// ─── Cypher write blocking through callTool ──────────────────────────

describe('callTool cypher write blocking', () => {
  let backend: LocalBackend;

  beforeEach(async () => {
    vi.clearAllMocks();
    backend = new LocalBackend();
    setupSingleRepo();
    await backend.init();
  });

  const writeQueries = [
    'CREATE (n:Function {name: "test"})',
    'MATCH (n) DELETE n',
    'MATCH (n) SET n.name = "hacked"',
    'MERGE (n:Function {name: "test"})',
    'MATCH (n) REMOVE n.name',
    'DROP TABLE Function',
    'ALTER TABLE Function ADD COLUMN foo STRING',
    'COPY Function FROM "file.csv"',
    'MATCH (n) DETACH DELETE n',
  ];

  for (const query of writeQueries) {
    it(`blocks write query: ${query.slice(0, 30)}...`, async () => {
      const result = await backend.callTool('cypher', { query });
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Write operations');
    });
  }

  it('allows read query through callTool', async () => {
    (executeQuery as any).mockResolvedValue([]);
    const result = await backend.callTool('cypher', {
      query: 'MATCH (n:Function) RETURN n.name LIMIT 5',
    });
    // Should not have error property with write-block message
    expect(result.error).toBeUndefined();
  });
});

// ─── listRepos ──────────────────────────────────────────────────────

describe('LocalBackend.listRepos', () => {
  let backend: LocalBackend;

  beforeEach(async () => {
    vi.clearAllMocks();
    backend = new LocalBackend();
  });

  it('returns empty array when no repos', async () => {
    setupNoRepos();
    await backend.init();
    const repos = await backend.callTool('list_repos', {});
    expect(repos).toEqual([]);
  });

  it('returns repo metadata', async () => {
    setupSingleRepo();
    await backend.init();
    const repos = await backend.callTool('list_repos', {});
    expect(repos).toHaveLength(1);
    expect(repos[0]).toEqual(expect.objectContaining({
      name: 'test-project',
      path: '/tmp/test-project',
      indexedAt: expect.any(String),
      lastCommit: expect.any(String),
    }));
  });

  it('returns index diagnostics for incomplete indexes', async () => {
    (listRegisteredRepos as any).mockResolvedValue([
      {
        ...MOCK_REPO_ENTRY,
        kuzuPath: '/tmp/.gitnexus/test-project/kuzu',
        indexState: 'missing_kuzu',
        suggestedFix: 'Run: gitnexus analyze',
      },
    ]);

    await backend.init();
    const repos = await backend.callTool('list_repos', {});

    expect(repos[0]).toEqual(expect.objectContaining({
      name: 'test-project',
      storagePath: '/tmp/.gitnexus/test-project',
      kuzuPath: '/tmp/.gitnexus/test-project/kuzu',
      indexState: 'missing_kuzu',
      suggestedFix: expect.stringContaining('gitnexus analyze'),
    }));
  });

  it('re-reads registry on each listRepos call', async () => {
    setupSingleRepo();
    await backend.init();
    await backend.callTool('list_repos', {});
    await backend.callTool('list_repos', {});
    // listRegisteredRepos called: once in init, once per listRepos
    expect(listRegisteredRepos).toHaveBeenCalledTimes(3);
  });
});

// ─── Cypher KuzuDB not ready ────────────────────────────────────────

describe('cypher tool KuzuDB not ready', () => {
  let backend: LocalBackend;

  beforeEach(async () => {
    vi.clearAllMocks();
    backend = new LocalBackend();
    setupSingleRepo();
    await backend.init();
  });

  it('returns error when KuzuDB is not ready', async () => {
    (isKuzuReady as any).mockReturnValue(false);
    // initKuzu will succeed but isKuzuReady returns false after ensureInitialized
    // Actually ensureInitialized checks isKuzuReady and re-inits — let's make that pass
    // then the cypher method checks isKuzuReady again
    (isKuzuReady as any)
      .mockReturnValueOnce(false)  // ensureInitialized check
      .mockReturnValueOnce(false); // cypher's own check

    const result = await backend.callTool('cypher', {
      query: 'MATCH (n) RETURN n LIMIT 1',
    });
    expect(result.error).toContain('KuzuDB not ready');
  });
});

// ─── formatCypherAsMarkdown ──────────────────────────────────────────

describe('cypher result formatting', () => {
  let backend: LocalBackend;

  beforeEach(async () => {
    // Full reset of all mocks to prevent state leaking from other tests
    vi.resetAllMocks();
    (listRegisteredRepos as any).mockResolvedValue([MOCK_REPO_ENTRY]);
    (initKuzu as any).mockResolvedValue(undefined);
    (isKuzuReady as any).mockReturnValue(true);
    (closeKuzu as any).mockResolvedValue(undefined);
    (executeParameterized as any).mockResolvedValue([]);

    backend = new LocalBackend();
    await backend.init();
  });

  it('formats tabular results as markdown table', async () => {
    (executeQuery as any).mockResolvedValue([
      { name: 'main', filePath: 'src/index.ts' },
      { name: 'helper', filePath: 'src/utils.ts' },
    ]);
    const result = await backend.callTool('cypher', {
      query: 'MATCH (n:Function) RETURN n.name AS name, n.filePath AS filePath',
    });
    expect(result).toHaveProperty('markdown');
    expect(result.markdown).toContain('name');
    expect(result.markdown).toContain('main');
    expect(result.row_count).toBe(2);
  });

  it('returns empty array as-is', async () => {
    (executeQuery as any).mockResolvedValue([]);
    const result = await backend.callTool('cypher', {
      query: 'MATCH (n:Function) RETURN n.name LIMIT 0',
    });
    expect(result).toEqual([]);
  });

  it('returns error object when cypher fails', async () => {
    (executeQuery as any).mockRejectedValue(new Error('Syntax error'));
    const result = await backend.callTool('cypher', {
      query: 'INVALID CYPHER SYNTAX',
    });
    expect(result).toHaveProperty('error');
    expect(result.error).toContain('Syntax error');
  });

  it('returns non-tabular primitive arrays as-is', async () => {
    (executeQuery as any).mockResolvedValue([1, 2, 3]);
    const result = await backend.callTool('cypher', {
      query: 'MATCH (n) RETURN 1 AS one',
    });
    expect(result).toEqual([1, 2, 3]);
  });

  it('returns array-shaped row results as-is without formatter crash', async () => {
    const arrayRows = [['main'], ['helper']];
    (executeQuery as any).mockResolvedValue(arrayRows);
    const result = await backend.callTool('cypher', {
      query: 'MATCH (n:Function) RETURN n.name',
    });
    expect(result).toEqual(arrayRows);
  });

  it('returns structured error when cypher query param is missing', async () => {
    const result = await backend.callTool('cypher', {} as any);
    expect(result).toEqual({
      error: 'query parameter is required and cannot be empty.',
    });
  });

  it('throws clear error when cypher formatter is misused with non-tabular input', () => {
    expect(() => formatCypherAsMarkdown([] as any)).toThrow('formatCypherAsMarkdown expected a non-empty array of row objects');
    expect(() => formatCypherAsMarkdown([null] as any)).toThrow('formatCypherAsMarkdown expected each row to be a plain object');
  });
});
