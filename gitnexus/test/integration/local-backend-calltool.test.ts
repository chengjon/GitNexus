/**
 * P0 Integration Tests: Local Backend — callTool dispatch
 *
 * Tests the full LocalBackend.callTool() dispatch with a real LadybugDB
 * instance, verifying cypher, context, impact, and query tools work
 * end-to-end against seeded graph data with FTS indexes.
 */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { LocalBackend } from '../../src/mcp/local/local-backend.js';
import { listRegisteredRepos } from '../../src/storage/repo-manager.js';
import { withTestLbugDB } from '../helpers/test-indexed-db.js';
import {
  LOCAL_BACKEND_SEED_DATA,
  LOCAL_BACKEND_FTS_INDEXES,
} from '../fixtures/local-backend-seed.js';

// Partial mock: registry access is faked, but everything else — critically
// `loadMeta`, which the staleness check in LocalBackend.ensureInitialized
// calls on every throttled window — stays REAL. A factory that omitted
// loadMeta made that call site throw a TypeError that the staleness check's
// catch silently swallowed, so the code path was never actually exercised.
vi.mock('../../src/storage/repo-manager.js', async (importActual) => ({
  ...(await importActual<typeof import('../../src/storage/repo-manager.js')>()),
  listRegisteredRepos: vi.fn().mockResolvedValue([]),
  cleanupOldKuzuFiles: vi.fn().mockResolvedValue({ found: false, needsReindex: false }),
  findSiblingClones: vi.fn().mockResolvedValue([]),
}));

// ─── Block 2: callTool dispatch tests ────────────────────────────────

withTestLbugDB(
  'local-backend-calltool',
  (handle) => {
    describe('callTool dispatch with real DB', () => {
      let backend: LocalBackend;

      beforeAll(async () => {
        // backend is created in afterSetup and attached to the handle
        const ext = handle as typeof handle & { _backend?: LocalBackend };
        if (!ext._backend) {
          throw new Error(
            'LocalBackend not initialized — afterSetup did not attach _backend to handle',
          );
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

      it('cypher no-match write probe returns read-only error or empty rows', async () => {
        const result = await backend.callTool('cypher', {
          query:
            "MATCH (n:Function) WHERE n.name = '__missing__' SET n.name = 'x' RETURN n.name AS name",
        });
        if (result?.error) {
          expect(result.error).toMatch(/write operations|read-only/i);
          return;
        }
        // Read-only mode may silently drop the SET and return empty markdown
        if (result?.markdown !== undefined) {
          expect(result.row_count).toBe(0);
          return;
        }
        expect(result).toEqual([]);
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

      it.each(['name', 'symbol'] as const)(
        'impact tool resolves the %s compatibility alias against a real index',
        async (alias) => {
          const result = await backend.callTool('impact', {
            [alias]: 'validate',
            direction: 'upstream',
          });
          expect(result).not.toHaveProperty('error');
          expect(result.target?.name).toBe('validate');
          const directDeps = result.byDepth[1] || result.byDepth['1'] || [];
          expect(directDeps.map((d: any) => d.name)).toContain('login');
        },
      );

      it('context tool resolves the file compatibility alias against a real index', async () => {
        const result = await backend.callTool('context', {
          name: 'authenticate',
          file: 'src/base.ts',
        });
        expect(result).not.toHaveProperty('error');
        expect(result.status).toBe('found');
        expect(result.symbol?.name).toBe('authenticate');
        expect(result.symbol?.filePath).toBe('src/base.ts');
      });

      it('query tool returns results for keyword search', async () => {
        const result = await backend.callTool('query', { query: 'login' });
        expect(result).not.toHaveProperty('error');
        expect(result).toHaveProperty('processes');
        expect(result).toHaveProperty('definitions');
        expect(result.processes.map((p: any) => p.id)).toContain('proc:login-flow');
        expect(result.process_symbols.map((s: any) => s.id)).toContain('func:login');

        // #553: query response carries per-phase timing metadata.
        expect(result.timing).toBeDefined();
        expect(typeof result.timing.wall).toBe('number');
        expect(result.timing.wall).toBeGreaterThanOrEqual(0);
        // At least one of the search phases must have fired for any
        // non-error response — bm25 and/or vector always runs.
        expect(result.timing.bm25 ?? result.timing.vector).toBeGreaterThanOrEqual(0);

        // Success path (FTS present + Process/Community tables exist): no degraded
        // signal. Guards R6 — the response shape stays byte-identical when nothing
        // fails (the `warning`/`partial` fields appear only on degradation).
        expect(result).not.toHaveProperty('warning');
        expect(result).not.toHaveProperty('partial');
      });

      // #2175: end-to-end proof that the renamed parameters work against a real
      // index (Claude Code drops a tool arg named exactly "query").
      it('query tool returns results via the new search_query param (#2175)', async () => {
        const result = await backend.callTool('query', { search_query: 'login' });
        expect(result).not.toHaveProperty('error');
        expect(result).toHaveProperty('processes');
        expect(result.processes.map((p: any) => p.id)).toContain('proc:login-flow');
        expect(result.process_symbols.map((s: any) => s.id)).toContain('func:login');
      });

      it('cypher tool executes via the new statement param (#2175)', async () => {
        const result = await backend.callTool('cypher', {
          statement: 'MATCH (n:Function) RETURN n.name AS name ORDER BY n.name',
        });
        expect(result).toHaveProperty('markdown');
        expect(result).toHaveProperty('row_count');
        expect(result.row_count).toBeGreaterThanOrEqual(3);
        expect(result.markdown).toContain('login');
      });

      // PR #222 port: the query tool batches per-symbol process/cohesion/content
      // lookups (N+1 → 2-3 `WHERE n.id IN $nodeIds` queries). These assertions
      // guard the batch-adaptation hazards that a naive cherry-pick would break:
      // (1) each symbol keeps ITS OWN community (the per-node first-row pick that
      //     replaced the per-symbol `LIMIT 1`), and (2) content maps to the right
      //     node — both depend on the +1 positional-index shift after prepending
      //     `n.id AS nodeId`. func:login is MEMBER_OF comm:auth ("Authentication");
      //     func:validate has no community, so it must NOT inherit login's.
      it('query batches per-symbol enrichment without cross-assigning community/content', async () => {
        const findSym = (res: any, id: string) =>
          (res.process_symbols ?? []).find((s: any) => s.id === id) ??
          (res.definitions ?? []).find((s: any) => s.id === id);

        const loginRes = await backend.callTool('query', {
          query: 'login',
          include_content: true,
        });
        expect(loginRes).not.toHaveProperty('error');
        const login = findSym(loginRes, 'func:login');
        expect(login).toBeDefined();
        // Community correctly associated to its own node (not dropped, not leaked).
        expect(login.module).toBe('Authentication');
        // Content correctly mapped to its own node (positional [1] after nodeId).
        expect(login.content).toBe('function login() {}');

        const validateRes = await backend.callTool('query', {
          query: 'validate',
          include_content: true,
        });
        expect(validateRes).not.toHaveProperty('error');
        const validate = findSym(validateRes, 'func:validate');
        expect(validate).toBeDefined();
        // validate has no MEMBER_OF edge — a flat batched `LIMIT 1` would have
        // leaked some other node's community onto it. It must have none.
        expect(validate.module).toBeUndefined();
        expect(validate.content).toBe('function validate() {}');
      });

      // PR #222 port: a symbol in MULTIPLE processes is what fully exercises the
      // +1 positional shift in the batched STEP_IN_PROCESS aggregation — with a
      // single process row, `row.pid ?? row[1]` succeeds whether the shift is
      // right or wrong. func:validate is a step in BOTH proc:login-flow (step 2)
      // and proc:beta-flow (step 3), so both rows for the one node must be parsed
      // (pid=row[1], step=row[6]); an off-by-one would drop a process or mis-pair
      // pid↔step. Also pins process ranking (totalScore via the regroup-by-nodeId).
      it('query batches a multi-process symbol and ranks processes (positional shift across rows)', async () => {
        const res = await backend.callTool('query', { query: 'validate' });
        expect(res).not.toHaveProperty('error');
        const processIds = (res.processes ?? []).map((p: any) => p.id);
        // Both of validate's processes must appear — both STEP_IN_PROCESS rows
        // were parsed and grouped by the correct pid (row[1]).
        expect(processIds).toContain('proc:login-flow');
        expect(processIds).toContain('proc:beta-flow');

        // process_symbols dedups by id, so validate appears once carrying the
        // pid+step of its top-ranked process — they must come from the SAME
        // shifted row: login-flow⇒step 2, beta-flow⇒step 3.
        const v = (res.process_symbols ?? []).find((s: any) => s.id === 'func:validate');
        expect(v).toBeDefined();
        expect(v.step_index).toBe(v.process_id === 'proc:beta-flow' ? 3 : 2);

        // Ranking: 'login' surfaces proc:login-flow as the top process.
        const loginRes = await backend.callTool('query', { query: 'login' });
        expect((loginRes.processes ?? [])[0]?.id).toBe('proc:login-flow');
      });

      it('tool_map returns per-tool flows without cross-attributing same-file tools', async () => {
        const result = await backend.callTool('tool_map', {});
        expect(result).not.toHaveProperty('error');

        const tools = new Map(result.tools.map((tool: any) => [tool.name, tool]));
        expect(tools.get('alpha')?.description).toBe('Calls chain A.');
        expect(tools.get('beta')?.description).toBe('Calls chain B.');
        expect(tools.get('alpha')?.flows).toEqual(['AlphaFlow']);
        expect(tools.get('beta')?.flows).toEqual(['BetaFlow']);
      });

      it('unknown tool throws', async () => {
        await expect(backend.callTool('nonexistent_tool', {})).rejects.toThrow(/unknown tool/i);
      });
    });

    describe('impact tool relationTypes filtering', () => {
      let backend: LocalBackend;

      beforeAll(async () => {
        const ext = handle as typeof handle & { _backend?: LocalBackend };
        if (!ext._backend) {
          throw new Error(
            'LocalBackend not initialized — afterSetup did not attach _backend to handle',
          );
        }
        backend = ext._backend;
      });

      it('filters by HAS_METHOD only', async () => {
        const result = await backend.callTool('impact', {
          target: 'AuthService',
          direction: 'downstream',
          relationTypes: ['HAS_METHOD'],
        });
        expect(result).not.toHaveProperty('error');
        expect(result.impactedCount).toBeGreaterThanOrEqual(1);
        const d1 = result.byDepth[1] || result.byDepth['1'] || [];
        const names = d1.map((d: any) => d.name);
        expect(names).toContain('authenticate');
        // Should NOT include CALLS-reachable symbols like validate/hash
        expect(names).not.toContain('validate');
        expect(names).not.toContain('hash');
      });

      it('filters by OVERRIDES only', async () => {
        // The seed has two Method nodes named 'authenticate' (AuthService's
        // override and BaseService's base). Per #470, `impact` now returns
        // a ranked-ambiguous response when the target name hits multiple
        // symbols, so we must disambiguate with file_path to get the
        // AuthService override (the one with the outgoing METHOD_OVERRIDES
        // edge we want to follow downstream).
        const result = await backend.callTool('impact', {
          target: 'authenticate',
          file_path: 'src/auth.ts',
          direction: 'downstream',
          relationTypes: ['METHOD_OVERRIDES'],
        });
        expect(result).not.toHaveProperty('error');
        expect(result.status).not.toBe('ambiguous');
        // AuthService.authenticate overrides BaseService.authenticate
        expect(result.impactedCount).toBeGreaterThanOrEqual(1);
        const d1 = result.byDepth[1] || result.byDepth['1'] || [];
        const names = d1.map((d: any) => d.name);
        expect(names).toContain('authenticate');
      });

      it('expands legacy OVERRIDES to include METHOD_OVERRIDES (dual-read)', async () => {
        // Pass the LEGACY alias 'OVERRIDES' — impactByUid should flatMap-expand
        // it to ['OVERRIDES', 'METHOD_OVERRIDES'] so the METHOD_OVERRIDES edge
        // between BaseService.authenticate and AuthService.authenticate is found.
        // file_path hint disambiguates the two 'authenticate' methods per #470.
        const result = await backend.callTool('impact', {
          target: 'authenticate',
          file_path: 'src/auth.ts',
          direction: 'downstream',
          relationTypes: ['OVERRIDES'],
        });
        expect(result).not.toHaveProperty('error');
        expect(result.status).not.toBe('ambiguous');
        expect(result.impactedCount).toBeGreaterThanOrEqual(1);
        const d1 = result.byDepth[1] || result.byDepth['1'] || [];
        const names = d1.map((d: any) => d.name);
        expect(names).toContain('authenticate');
      });

      it('does not return HAS_METHOD results when filtering by CALLS only', async () => {
        const result = await backend.callTool('impact', {
          target: 'AuthService',
          direction: 'downstream',
          relationTypes: ['CALLS'],
        });
        expect(result).not.toHaveProperty('error');
        // AuthService has no outgoing CALLS edges, only HAS_METHOD
        expect(result.impactedCount).toBe(0);
      });
    });

    describe('tool parameter edge cases', () => {
      let backend: LocalBackend;

      beforeAll(async () => {
        const ext = handle as typeof handle & { _backend?: LocalBackend };
        if (!ext._backend) {
          throw new Error(
            'LocalBackend not initialized — afterSetup did not attach _backend to handle',
          );
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

      it('cypher tool returns error or empty for invalid Cypher syntax', async () => {
        const result = await backend.callTool('cypher', {
          query: 'THIS IS NOT VALID CYPHER AT ALL',
        });
        // LadybugDB may throw (→ error + recovery) or silently return empty
        if (result?.error) {
          expect(result.error).toBeTruthy();
        } else {
          expect(result.row_count ?? 0).toBe(0);
        }
      });

      it('context tool returns error when no name or uid provided', async () => {
        const result = await backend.callTool('context', {});
        expect(result).toHaveProperty('error');
        expect(result.error).toMatch(/required/i);
      });

      // ─── impact error handling tests (#321) ───────────────────────────
      // Verify that impact() returns structured JSON instead of crashing

      it('impact tool returns recovery guidance for unknown symbol', async () => {
        const result = await backend.callTool('impact', {
          target: 'nonexistent_symbol_xyz_999',
          direction: 'upstream',
        });

        expect(result).toBeDefined();
        expect(result.status).toBe('not_found');
        expect(result.error).toBe("Target 'nonexistent_symbol_xyz_999' not found");
        expect(result.impactedCount).toBe(0);
        expect(result.risk).toBe('UNKNOWN');
        expect(result.suggestion).toContain('query');
        expect(result.suggestion).toContain('context');
        expect(result.suggestion).toContain('target_uid');
        expect(result.next_actions).toEqual([
          expect.objectContaining({
            tool: 'query',
            params: { query: 'nonexistent_symbol_xyz_999' },
          }),
          expect.objectContaining({
            tool: 'context',
            params: { name: '<candidate_name>' },
          }),
          expect.objectContaining({
            tool: 'impact',
            params: {
              target_uid: '<resolved_uid>',
              direction: 'upstream',
            },
          }),
        ]);
      });

      it('impact error response has consistent target shape', async () => {
        const result = await backend.callTool('impact', {
          target: 'nonexistent_symbol_xyz_999',
          direction: 'downstream',
        });
        // When an error is returned, target must be an object (not raw string)
        // so downstream API consumers can safely access result.target.name
        if (result.error && result.target !== undefined) {
          expect(typeof result.target).toBe('object');
          expect(result.target).not.toBeNull();
        }
      });

      it('impact partial results: traversalComplete flag when depth fails', async () => {
        // Even if traversal fails at some depth, partial results should be returned
        // and partial:true should only be set when some results were collected
        const result = await backend.callTool('impact', {
          target: 'validate',
          direction: 'upstream',
          maxDepth: 10, // Large depth to trigger multi-level traversal
        });
        // Should succeed (validate exists in seed data)
        expect(result).not.toHaveProperty('error');
        if (result.partial) {
          // If partial, must still have some results
          expect(result.impactedCount).toBeGreaterThan(0);
        }
      });
    });
  },
  {
    seed: LOCAL_BACKEND_SEED_DATA,
    ftsIndexes: LOCAL_BACKEND_FTS_INDEXES,
    poolAdapter: true,
    afterSetup: async (handle) => {
      // Configure listRegisteredRepos mock with handle values
      vi.mocked(listRegisteredRepos).mockResolvedValue([
        {
          name: 'test-repo',
          path: '/test/repo',
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
  },
);

// ─── Block 3: index_status metadata ──────────────────────────────────

withTestLbugDB(
  'local-backend-index-status',
  (handle) => {
    describe('index_status in tool responses', () => {
      let backend: LocalBackend;

      beforeAll(async () => {
        const ext = handle as typeof handle & { _backend?: LocalBackend };
        if (!ext._backend) {
          throw new Error('LocalBackend not initialized');
        }
        backend = ext._backend;
      });

      it('query response includes index_status with has_embeddings', async () => {
        const result = await backend.callTool('query', { query: 'validate' });
        expect(result).toHaveProperty('index_status');
        expect(result.index_status).toHaveProperty('stale');
        expect(result.index_status).toHaveProperty('has_embeddings');
        expect(typeof result.index_status.has_embeddings).toBe('boolean');
      });

      it('impact success response includes index_status', async () => {
        const result = await backend.callTool('impact', {
          target: 'validate',
          direction: 'upstream',
        });
        expect(result).toHaveProperty('index_status');
        expect(result.index_status).toHaveProperty('stale');
        expect(result.index_status).toHaveProperty('has_embeddings');
      });

      it('impact not-found response includes index_status alongside recovery guidance', async () => {
        const result = await backend.callTool('impact', {
          target: 'nonexistent_symbol_xyz_999',
          direction: 'upstream',
        });
        expect(result.status).toBe('not_found');
        expect(result).toHaveProperty('index_status');
        expect(result.index_status).toHaveProperty('stale');
        expect(result.index_status).toHaveProperty('has_embeddings');
        expect(result).toHaveProperty('suggestion');
        expect(result).toHaveProperty('next_actions');
      });
    });
  },
  {
    seed: LOCAL_BACKEND_SEED_DATA,
    ftsIndexes: LOCAL_BACKEND_FTS_INDEXES,
    poolAdapter: true,
    afterSetup: async (handle) => {
      vi.mocked(listRegisteredRepos).mockResolvedValue([
        {
          name: 'test-repo',
          path: '/test/repo',
          storagePath: handle.tmpHandle.dbPath,
          indexedAt: new Date().toISOString(),
          lastCommit: 'abc1234',
          stats: { files: 2, nodes: 3, communities: 1, processes: 1, embeddings: 0 },
        },
      ]);

      const backend = new LocalBackend();
      await backend.init();
      (handle as any)._backend = backend;
    },
  },
);

// ─── impact BFS bound parameters (#1907 review F5) ───────────────────────
// Isolated DB with a frontier node whose id contains a single quote. The
// parameterized query carries it as data and avoids parser errors from
// string-interpolated Cypher.
withTestLbugDB(
  'local-backend-impact-param',
  (handle) => {
    describe('impact BFS bound parameters (#1907 F5)', () => {
      let backend: LocalBackend;

      beforeAll(() => {
        const ext = handle as typeof handle & { _backend?: LocalBackend };
        if (!ext._backend) {
          throw new Error('LocalBackend not initialized — afterSetup did not attach _backend');
        }
        backend = ext._backend;
      });

      it('traverses a caller whose id contains a single quote without a query error', async () => {
        const result = await backend.callTool('impact', { target: 'sink', direction: 'upstream' });
        expect(result).not.toHaveProperty('error');
        const d1 = result.byDepth?.[1] || result.byDepth?.['1'] || [];
        const callerIds = d1.map((d: any) => d.uid ?? d.id);
        expect(callerIds).toContain("func:o'd");
      });

      it('returns an empty result (not an error) for a symbol with no callers', async () => {
        const result = await backend.callTool('impact', {
          target: 'sink',
          direction: 'downstream',
        });
        expect(result).not.toHaveProperty('error');
        expect(result.impactedCount).toBe(0);
      });
    });
  },
  {
    seed: [
      `CREATE (a:Function {id: "func:o'd", name: 'odd', filePath: 'src/q.ts', startLine: 1, endLine: 3, isExported: true, content: 'function odd() {}', description: 'caller with a quote in its id'})`,
      `CREATE (b:Function {id: 'func:sink', name: 'sink', filePath: 'src/q.ts', startLine: 5, endLine: 8, isExported: true, content: 'function sink() {}', description: 'callee'})`,
      `MATCH (a:Function), (b:Function) WHERE a.id = "func:o'd" AND b.id = 'func:sink'
       CREATE (a)-[:CodeRelation {type: 'CALLS', confidence: 1.0, reason: 'direct', step: 0}]->(b)`,
    ],
    poolAdapter: true,
    afterSetup: async (handle) => {
      vi.mocked(listRegisteredRepos).mockResolvedValue([
        {
          name: 'param-repo',
          path: '/param/repo',
          storagePath: handle.tmpHandle.dbPath,
          indexedAt: new Date().toISOString(),
          lastCommit: 'abc123',
          stats: { files: 1, nodes: 2, communities: 0, processes: 0 },
        },
      ]);
      const backend = new LocalBackend();
      await backend.init();
      (handle as any)._backend = backend;
    },
  },
);

// ─── Block 4: enrichment pattern tests ───────────────────────────────

withTestLbugDB(
  'local-backend-enrichment',
  (handle) => {
    describe('enrichment patterns across tools', () => {
      let backend: LocalBackend;

      beforeAll(async () => {
        const ext = handle as typeof handle & { _backend?: LocalBackend };
        if (!ext._backend) throw new Error('LocalBackend not initialized');
        backend = ext._backend;
      });

      // --- overview ---

      it('overview returns index_status', async () => {
        const result = await backend.callTool('overview', {});
        expect(result).toHaveProperty('index_status');
        expect(result.index_status).toHaveProperty('stale');
        expect(result.index_status).toHaveProperty('has_embeddings');
        expect(result).toHaveProperty('clusters');
        expect(result).toHaveProperty('processes');
      });

      // --- context recovery ---

      it('context not_found includes recovery steps', async () => {
        const result = await backend.callTool('context', {
          name: 'nonexistent_xyz_symbol_999',
        });
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('recovery');
        expect(result.recovery).toHaveProperty('steps');
        expect(result.recovery.steps.length).toBeGreaterThanOrEqual(1);
      });

      // --- detect_changes next_steps on empty ---

      it('detect_changes includes next_steps when no changes detected', async () => {
        const result = await backend.callTool('detect_changes', {
          scope: 'unstaged',
        });
        // Test DB has no git worktree, so it will error or return empty
        if (!result.error) {
          expect(result.summary).toBeDefined();
          if (result.summary?.changed_files === 0) {
            expect(result).toHaveProperty('next_steps');
            expect(result.next_steps.length).toBeGreaterThanOrEqual(1);
          }
        }
      });

      // --- routeMap empty + index_status ---

      it('route_map returns index_status and next_steps on empty', async () => {
        const result = await backend.callTool('route_map', {});
        expect(result).toHaveProperty('index_status');
        expect(result).toHaveProperty('total');
        if (result.total === 0) {
          expect(result).toHaveProperty('next_steps');
          expect(result.next_steps.length).toBeGreaterThanOrEqual(1);
        }
      });

      // --- toolMap index_status ---

      it('tool_map returns index_status', async () => {
        const result = await backend.callTool('tool_map', {});
        expect(result).toHaveProperty('index_status');
        expect(result.index_status).toHaveProperty('stale');
        expect(result.index_status).toHaveProperty('has_embeddings');
      });

      // --- shapeCheck index_status ---

      it('shape_check returns index_status and next_steps on empty', async () => {
        const result = await backend.callTool('shape_check', {});
        expect(result).toHaveProperty('index_status');
        if (result.total === 0) {
          expect(result).toHaveProperty('next_steps');
        }
      });

      // --- apiImpact recovery on missing params ---

      it('api_impact returns recovery when no params provided', async () => {
        const result = await backend.callTool('api_impact', {});
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('recovery');
        expect(result.recovery).toHaveProperty('steps');
        expect(result.recovery.steps.length).toBeGreaterThanOrEqual(1);
      });

      it('api_impact returns next_steps on not-found route', async () => {
        const result = await backend.callTool('api_impact', {
          route: '/nonexistent/route',
        });
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('next_steps');
        expect(result).toHaveProperty('index_status');
      });

      // --- detect_changes error recovery for missing base_ref ---

      it('detect_changes returns recovery for compare scope without base_ref', async () => {
        const result = await backend.callTool('detect_changes', {
          scope: 'compare',
        });
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('recovery');
        expect(result.recovery).toHaveProperty('steps');
      });

      // --- list_repos not tested here (needs empty repo list mock) ---
    });
  },
  {
    seed: LOCAL_BACKEND_SEED_DATA,
    ftsIndexes: LOCAL_BACKEND_FTS_INDEXES,
    poolAdapter: true,
    afterSetup: async (handle) => {
      vi.mocked(listRegisteredRepos).mockResolvedValue([
        {
          name: 'test-repo',
          path: '/test/repo',
          storagePath: handle.tmpHandle.dbPath,
          indexedAt: new Date().toISOString(),
          lastCommit: 'abc12345',
          stats: { files: 2, nodes: 3, communities: 1, processes: 1, embeddings: 0 },
        },
      ]);

      const backend = new LocalBackend();
      await backend.init();
      (handle as any)._backend = backend;
    },
  },
);
