/**
 * P0 Integration Tests: Local Backend — callTool dispatch
 *
 * Tests the full LocalBackend.callTool() dispatch with a real KuzuDB
 * instance, verifying cypher, context, impact, and query tools work
 * end-to-end against seeded graph data with FTS indexes.
 */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { LocalBackend } from '../../src/mcp/local/local-backend.js';
import { listRegisteredRepos } from '../../src/storage/repo-manager.js';
import { withTestKuzuDB } from '../helpers/test-indexed-db.js';
import { LOCAL_BACKEND_SEED_DATA, LOCAL_BACKEND_FTS_INDEXES } from '../fixtures/local-backend-seed.js';

vi.mock('../../src/storage/repo-manager.js', () => ({
  listRegisteredRepos: vi.fn().mockResolvedValue([]),
}));

// ─── Block 2: callTool dispatch tests ────────────────────────────────

withTestKuzuDB('local-backend-calltool', (handle) => {

  describe('callTool dispatch with real DB', () => {
    let backend: LocalBackend;

    beforeAll(async () => {
      // backend is created in afterSetup and attached to the handle
      const ext = handle as typeof handle & { _backend?: LocalBackend };
      if (!ext._backend) {
        throw new Error('LocalBackend not initialized — afterSetup did not attach _backend to handle');
      }
      backend = ext._backend;
    });

    it('cypher tool returns function names', async () => {
      const result = await backend.callTool('cypher', {
        query: 'MATCH (n:Function) RETURN n.name AS name ORDER BY n.name',
      });
      // cypher tool wraps results as markdown
      expect(result).toHaveProperty('markdown');
      expect(result).toHaveProperty('row_count');
      expect(result.row_count).toBeGreaterThanOrEqual(3);
      expect(result.markdown).toContain('login');
      expect(result.markdown).toContain('validate');
      expect(result.markdown).toContain('hash');
    });

    it('cypher tool blocks write queries', async () => {
      const result = await backend.callTool('cypher', {
        query: "CREATE (n:Function {id: 'x', name: 'x', filePath: '', startLine: 0, endLine: 0, isExported: false, content: '', description: ''})",
      });
      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/write operations/i);
    });

    it('context tool returns symbol info with callers and callees', async () => {
      const result = await backend.callTool('context', { name: 'login' });
      expect(result).not.toHaveProperty('error');
      expect(result.status).toBe('found');
      // Should have the symbol identity
      expect(result.symbol).toBeDefined();
      expect(result.symbol.name).toBe('login');
      expect(result.symbol.filePath).toBe('src/auth.ts');
      // login calls validate and hash — should appear in outgoing.calls
      expect(result.outgoing).toBeDefined();
      expect(result.outgoing.calls).toBeDefined();
      expect(result.outgoing.calls.length).toBeGreaterThanOrEqual(2);
      const calleeNames = result.outgoing.calls.map((c: any) => c.name);
      expect(calleeNames).toContain('validate');
      expect(calleeNames).toContain('hash');
    });

    it('impact tool returns upstream dependents', async () => {
      const result = await backend.callTool('impact', {
        target: 'validate',
        direction: 'upstream',
      });
      expect(result).not.toHaveProperty('error');
      // validate is called by login, so login should appear at depth 1
      expect(result.impactedCount).toBeGreaterThanOrEqual(1);
      expect(result.byDepth).toBeDefined();
      const directDeps = result.byDepth[1] || result.byDepth['1'] || [];
      expect(directDeps.length).toBeGreaterThanOrEqual(1);
      const depNames = directDeps.map((d: any) => d.name);
      expect(depNames).toContain('login');
    });

    it('impact tool resolves file path targets', async () => {
      const result = await backend.callTool('impact', {
        target: 'src/auth.ts',
        direction: 'upstream',
      });

      expect(result).not.toHaveProperty('error');
      expect(result.target).toBeDefined();
      expect(result.target.name).toBe('auth.ts');
      expect(result.target.filePath).toBe('src/auth.ts');
    });

    it('detect_changes compare scope validates base_ref', async () => {
      const result = await backend.callTool('detect_changes', {
        scope: 'compare',
      });

      expect(result).toEqual({
        error: 'base_ref is required for "compare" scope',
      });
    });

    it('rename tool keeps default dry-run behavior through callTool', async () => {
      const result = await backend.callTool('rename', {
        symbol_name: 'login',
        new_name: 'loginRenamed',
      });

      expect(result).not.toHaveProperty('error');
      expect(result.status).toBe('success');
      expect(result.old_name).toBe('login');
      expect(result.new_name).toBe('loginRenamed');
      expect(result.applied).toBe(false);
    });

    it('rename previews and applies all matching lines in graph-covered files', async () => {
      const authFile = path.join(handle.tmpHandle.dbPath, 'repo', 'src', 'auth.ts');
      await fs.writeFile(
        authFile,
        'function login() { return true; }\nconst secondUse = login();\nconst thirdUse = login();\nfunction validate() { return true; }\n',
        'utf-8',
      );

      const preview = await backend.callTool('rename', {
        symbol_name: 'login',
        new_name: 'loginRenamed',
        dry_run: true,
      });
      expect(preview).not.toHaveProperty('error');
      expect(preview.applied).toBe(false);
      expect(preview.changes).toHaveLength(1);
      expect(preview.changes[0].file_path).toBe('src/auth.ts');
      expect(preview.changes[0].edits).toHaveLength(3);
      expect(preview.changes[0].edits[0].line).toBe(1);
      expect(preview.changes[0].edits[1].line).toBe(2);
      expect(preview.changes[0].edits[2].line).toBe(3);

      const applied = await backend.callTool('rename', {
        symbol_name: 'login',
        new_name: 'loginRenamed',
        dry_run: false,
      });
      expect(applied).not.toHaveProperty('error');
      expect(applied.applied).toBe(true);

      const updated = await fs.readFile(authFile, 'utf-8');
      const [line1, line2, line3] = updated.split('\n');
      expect(line1).toContain('loginRenamed');
      expect(line2).toContain('loginRenamed');
      expect(line2).not.toContain('login()');
      expect(line3).toContain('loginRenamed');
      expect(line3).not.toContain('login()');
    });

    it('query tool returns results for keyword search', async () => {
      const result = await backend.callTool('query', { query: 'login' });
      expect(result).not.toHaveProperty('error');
      // Should have some combination of processes, process_symbols, or definitions
      expect(result).toHaveProperty('processes');
      expect(result).toHaveProperty('definitions');
      // The search should find something (FTS or graph-based)
      const totalResults =
        (result.processes?.length || 0) +
        (result.process_symbols?.length || 0) +
        (result.definitions?.length || 0);
      expect(totalResults).toBeGreaterThanOrEqual(1);
    });

    it('search/explore aliases keep query/context behavior', async () => {
      const searchResult = await backend.callTool('search', { query: 'login' });
      expect(searchResult).not.toHaveProperty('error');
      expect(searchResult).toHaveProperty('processes');
      expect(searchResult).toHaveProperty('definitions');

      const exploreResult = await backend.callTool('explore', { name: 'login' });
      expect(exploreResult).not.toHaveProperty('error');
      expect(exploreResult.status).toBe('found');
      expect(exploreResult.symbol.name).toBe('login');
    });

    it('unknown tool throws', async () => {
      await expect(
        backend.callTool('nonexistent_tool', {}),
      ).rejects.toThrow(/unknown tool/i);
    });
  });

  describe('tool parameter edge cases', () => {
    let backend: LocalBackend;

    beforeAll(async () => {
      const ext = handle as typeof handle & { _backend?: LocalBackend };
      if (!ext._backend) {
        throw new Error('LocalBackend not initialized — afterSetup did not attach _backend to handle');
      }
      backend = ext._backend;
    });

    it('context tool returns error for nonexistent symbol', async () => {
      const result = await backend.callTool('context', { name: 'nonexistent_xyz_symbol_999' });
      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/not found/i);
    });

    it('query tool returns error for empty query', async () => {
      const result = await backend.callTool('query', { query: '' });
      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/required/i);
    });

    it('query tool returns error for missing query param', async () => {
      const result = await backend.callTool('query', {});
      expect(result).toHaveProperty('error');
    });

    it('cypher tool returns error for invalid Cypher syntax', async () => {
      const result = await backend.callTool('cypher', { query: 'THIS IS NOT VALID CYPHER AT ALL' });
      expect(result).toHaveProperty('error');
    });

    it('context tool returns error when no name or uid provided', async () => {
      const result = await backend.callTool('context', {});
      expect(result).toHaveProperty('error');
      expect(result.error).toMatch(/required/i);
    });
  });

}, {
  seed: LOCAL_BACKEND_SEED_DATA,
  ftsIndexes: LOCAL_BACKEND_FTS_INDEXES,
  poolAdapter: true,
  afterSetup: async (handle) => {
    const repoPath = path.join(handle.tmpHandle.dbPath, 'repo');
    await fs.mkdir(path.join(repoPath, 'src'), { recursive: true });
    await fs.writeFile(
      path.join(repoPath, 'src', 'auth.ts'),
      'function login() { return validate(); }\nfunction validate() { return true; }\n',
      'utf-8',
    );
    await fs.writeFile(
      path.join(repoPath, 'src', 'utils.ts'),
      'function hash() { return "x"; }\n',
      'utf-8',
    );

    // Configure listRegisteredRepos mock with handle values
    vi.mocked(listRegisteredRepos).mockResolvedValue([
      {
        name: 'test-repo',
        path: repoPath,
        storagePath: handle.tmpHandle.dbPath,
        indexedAt: new Date().toISOString(),
        lastCommit: 'abc123',
        stats: { files: 2, nodes: 3, communities: 1, processes: 1 },
      },
    ]);

    const backend = new LocalBackend();
    await backend.init();
    // Stash backend on handle so tests can access it
    (handle as any)._backend = backend;
  },
});
