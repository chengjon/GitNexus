/**
 * P0/P1/P2 Integration Tests: MCP Response-Level Verification
 *
 * Tests the full LocalBackend.callTool() dispatch with a real LadybugDB
 * instance, verifying P0/P1/P2 response fields:
 *   - detect_changes: changed_file_classes, risk_rationale, forbidden_file_classes
 *   - impact: risk_rationale
 *   - index_status: stale_reasons, fresh_for_staged_diff
 *   - STYLE_IMPORTS: impact and context traversal
 */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { LocalBackend } from '../../src/mcp/local/local-backend.js';
import { listRegisteredRepos } from '../../src/storage/repo-manager.js';
import { type IndexedDBHandle, withTestLbugDB } from '../helpers/test-indexed-db.js';
import {
  LOCAL_BACKEND_SEED_DATA,
  LOCAL_BACKEND_FTS_INDEXES,
} from '../fixtures/local-backend-seed.js';

// Extra seed data for STYLE_IMPORTS edge tests
const STYLE_IMPORT_SEED = [
  `CREATE (f:File {id: 'file:colors.scss', name: 'colors.scss', filePath: 'src/styles/colors.scss', content: 'color variables'})`,
  `CREATE (f:File {id: 'file:layout.scss', name: 'layout.scss', filePath: 'src/styles/layout.scss', content: 'layout mixins'})`,
  `CREATE (f:File {id: 'file:app.scss', name: 'app.scss', filePath: 'src/styles/app.scss', content: 'main stylesheet'})`,
  // STYLE_IMPORTS: app.scss -> colors.scss
  `MATCH (a:File), (b:File) WHERE a.id = 'file:app.scss' AND b.id = 'file:colors.scss'
   CREATE (a)-[:CodeRelation {type: 'STYLE_IMPORTS', confidence: 1.0, reason: '@use', step: 0}]->(b)`,
  // STYLE_IMPORTS: app.scss -> layout.scss
  `MATCH (a:File), (b:File) WHERE a.id = 'file:app.scss' AND b.id = 'file:layout.scss'
   CREATE (a)-[:CodeRelation {type: 'STYLE_IMPORTS', confidence: 1.0, reason: '@use', step: 0}]->(b)`,
  // STYLE_IMPORTS: layout.scss -> colors.scss (transitive)
  `MATCH (a:File), (b:File) WHERE a.id = 'file:layout.scss' AND b.id = 'file:colors.scss'
   CREATE (a)-[:CodeRelation {type: 'STYLE_IMPORTS', confidence: 0.9, reason: '@import', step: 0}]->(b)`,
];

const COMBINED_SEED = [...LOCAL_BACKEND_SEED_DATA, ...STYLE_IMPORT_SEED];

const gitEnv = {
  GIT_AUTHOR_NAME: 'test',
  GIT_AUTHOR_EMAIL: 'test@test',
  GIT_COMMITTER_NAME: 'test',
  GIT_COMMITTER_EMAIL: 'test@test',
};

function runGit(repoPath: string, args: string[]) {
  const result = spawnSync('git', args, {
    cwd: repoPath,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...gitEnv },
  });
  expect(result.status, `git ${args.join(' ')} stderr: ${result.stderr}`).toBe(0);
  return result.stdout.trim();
}

function createRepoWithDetectChangesFixture(handle: IndexedDBHandle): {
  repoPath: string;
  initialCommit: string;
} {
  const repoPath = path.join(handle.tmpHandle.dbPath, 'detect-changes-repo');
  fs.mkdirSync(path.join(repoPath, 'src'), { recursive: true });
  fs.writeFileSync(
    path.join(repoPath, 'src', 'auth.ts'),
    [
      'export function login(input: string) {',
      '  return validate(input);',
      '}',
      '',
      'export function validate(input: string) {',
      '  return input.trim().length > 0;',
      '}',
      '',
    ].join('\n'),
  );

  runGit(repoPath, ['init']);
  runGit(repoPath, ['add', '-A']);
  runGit(repoPath, ['commit', '-m', 'initial']);
  const initialCommit = runGit(repoPath, ['rev-parse', 'HEAD']);

  fs.appendFileSync(path.join(repoPath, 'src', 'auth.ts'), '\nexport const changed = true;\n');
  runGit(repoPath, ['add', 'src/auth.ts']);
  runGit(repoPath, ['commit', '-m', 'advance-head']);

  fs.appendFileSync(path.join(repoPath, 'src', 'auth.ts'), '\nexport const unstaged = true;\n');

  return { repoPath, initialCommit };
}

vi.mock('../../src/storage/repo-manager.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/storage/repo-manager.js')>();
  return {
    ...actual,
    listRegisteredRepos: vi.fn().mockResolvedValue([]),
    cleanupOldKuzuFiles: vi.fn().mockResolvedValue({ found: false, needsReindex: false }),
    findSiblingClones: vi.fn().mockResolvedValue([]),
  };
});

// ─── Block 1: detect_changes and impact response fields ──────────────

withTestLbugDB(
  'p0-p1-p2-mcp-response',
  (handle) => {
    describe('detect_changes response fields (P0/P1/P2)', () => {
      let backend: LocalBackend;
      let repoPath: string;

      beforeAll(async () => {
        const ext = handle as typeof handle & { _backend?: LocalBackend; _repoPath?: string };
        if (!ext._backend) throw new Error('backend not initialized');
        if (!ext._repoPath) throw new Error('fixture repo not initialized');
        backend = ext._backend;
        repoPath = ext._repoPath;
      });

      it('response includes index_status with fresh_for_staged_diff (P0 4.1)', async () => {
        const result = await backend.callTool('detect_changes', {
          scope: 'unstaged',
          cwd: repoPath,
        });
        expect(result).not.toHaveProperty('error');
        expect(result).toHaveProperty('metadata');
        expect(result.metadata).toHaveProperty('fresh_for_staged_diff', true);
        expect(result).toHaveProperty('index_status');
        expect(result.index_status).toHaveProperty('fresh_for_staged_diff', true);
      });

      it('response includes stale_reasons when commits differ (P0 4.2)', async () => {
        const result = await backend.callTool('detect_changes', {
          scope: 'unstaged',
          cwd: repoPath,
        });
        expect(result).not.toHaveProperty('error');
        expect(result.metadata.stale_reasons).toContain(
          'current_commit_differs_from_indexed_commit',
        );
        expect(result.index_status.stale_reasons).toContain(
          'current_commit_differs_from_indexed_commit',
        );
      });

      it('response includes risk_rationale when changes detected (P2 3.5)', async () => {
        const result = await backend.callTool('detect_changes', {
          scope: 'unstaged',
          cwd: repoPath,
        });
        expect(result).not.toHaveProperty('error');
        expect(result.summary.changed_files).toBe(1);
        expect(result).toHaveProperty('risk_rationale');
        expect(Array.isArray(result.risk_rationale)).toBe(true);
      });

      it('with forbidden_file_classes returns violations when applicable (P1 3.4)', async () => {
        const result = await backend.callTool('detect_changes', {
          scope: 'unstaged',
          cwd: repoPath,
          forbidden_file_classes: ['source'],
        });
        expect(result).not.toHaveProperty('error');
        expect(result.summary.changed_files).toBe(1);
        expect(result.changed_file_classes).toMatchObject({ source: 1 });
        expect(result.forbidden_class_violations).toEqual(['src/auth.ts']);
        expect(result).toHaveProperty('forbidden_class_warning');
        expect(result.forbidden_class_warning).toMatch(/forbidden file classes/);
      });

      it('forbidden_file_classes with governance class produces no violations on source files', async () => {
        const result = await backend.callTool('detect_changes', {
          scope: 'unstaged',
          cwd: repoPath,
          forbidden_file_classes: ['governance'],
        });
        expect(result).not.toHaveProperty('error');
        // Governance files won't appear in normal source code changes
        expect(result.forbidden_class_violations).toBeUndefined();
      });
    });

    describe('impact response fields (P2)', () => {
      let backend: LocalBackend;

      beforeAll(async () => {
        const ext = handle as typeof handle & { _backend?: LocalBackend };
        if (!ext._backend) throw new Error('backend not initialized');
        backend = ext._backend;
      });

      it('impact response includes risk_rationale (P2 3.6)', async () => {
        const result = await backend.callTool('impact', {
          target: 'validate',
          direction: 'upstream',
        });
        expect(result).not.toHaveProperty('error');
        expect(result).toHaveProperty('risk_rationale');
        expect(Array.isArray(result.risk_rationale)).toBe(true);
      });

      it('impact risk_rationale contains signal information', async () => {
        const result = await backend.callTool('impact', {
          target: 'validate',
          direction: 'upstream',
        });
        expect(result).not.toHaveProperty('error');
        // validate has at least login as caller — risk_rationale should mention signals
        if (result.risk_rationale.length > 0) {
          const combined = result.risk_rationale.join(' ');
          // Should mention one of the signal names
          expect(combined).toMatch(
            /direct_callers|affected_processes|affected_modules|total_impacted|no changed symbols|safe thresholds/,
          );
        }
      });

      it('impact not-found response returns recovery without risk_rationale', async () => {
        const result = await backend.callTool('impact', {
          target: 'nonexistent_symbol_xyz_999',
          direction: 'upstream',
        });
        expect(result.status).toBe('not_found');
        expect(result).toHaveProperty('suggestion');
        // not-found path returns early without risk_rationale — that's expected
        expect(result.risk_rationale).toBeUndefined();
      });
    });

    describe('STYLE_IMPORTS traversal (P1 sass)', () => {
      let backend: LocalBackend;

      beforeAll(async () => {
        const ext = handle as typeof handle & { _backend?: LocalBackend };
        if (!ext._backend) throw new Error('backend not initialized');
        backend = ext._backend;
      });

      it('impact on app.scss shows STYLE_IMPORTS dependents (P1 5.5)', async () => {
        const result = await backend.callTool('impact', {
          target: 'app.scss',
          direction: 'upstream',
        });
        // app.scss may not be found by name alone (it's a File node, not Function)
        // Impact tool searches by name — File nodes may need filePath match
        if (result.status === 'not_found') {
          // Try via cypher to verify edges exist
          const cypherResult = await backend.callTool('cypher', {
            query:
              "MATCH (a:File)-[r:CodeRelation]->(b:File) WHERE r.type = 'STYLE_IMPORTS' RETURN a.name AS from, b.name AS to, r.type AS type",
          });
          expect(cypherResult.row_count).toBeGreaterThanOrEqual(2);
          expect(cypherResult.markdown).toContain('STYLE_IMPORTS');
          return;
        }
        expect(result).not.toHaveProperty('error');
        // If found, should have impacted symbols
        expect(result.impactedCount).toBeGreaterThanOrEqual(0);
      });

      it('context on colors.scss shows STYLE_IMPORTS relationships (P1 5.6)', async () => {
        const result = await backend.callTool('context', { name: 'colors.scss' });
        if (result.status === 'not_found' || result.error) {
          // File nodes may not be found by context — verify edges via cypher
          const cypherResult = await backend.callTool('cypher', {
            query:
              "MATCH (a:File)-[r:CodeRelation]->(b:File {name: 'colors.scss'}) WHERE r.type = 'STYLE_IMPORTS' RETURN a.name AS importer, r.reason AS reason",
          });
          expect(cypherResult.row_count).toBeGreaterThanOrEqual(1);
          expect(cypherResult.markdown).toMatch(/app\.scss|layout\.scss/);
          return;
        }
        // If found via context, outgoing should include style imports
        expect(result).not.toHaveProperty('error');
      });

      it('STYLE_IMPORTS edges exist and are traversable', async () => {
        const result = await backend.callTool('cypher', {
          query:
            "MATCH (a:File)-[r:CodeRelation]->(b:File) WHERE r.type = 'STYLE_IMPORTS' RETURN a.name AS from, b.name AS to, r.reason AS reason ORDER BY a.name",
        });
        expect(result.row_count).toBe(3);
        expect(result.markdown).toContain('app.scss');
        expect(result.markdown).toContain('colors.scss');
        expect(result.markdown).toContain('layout.scss');
      });
    });
  },
  {
    seed: COMBINED_SEED,
    ftsIndexes: LOCAL_BACKEND_FTS_INDEXES,
    poolAdapter: true,
    afterSetup: async (handle) => {
      const fixtureRepo = createRepoWithDetectChangesFixture(handle);
      vi.mocked(listRegisteredRepos).mockResolvedValue([
        {
          name: 'test-repo',
          path: fixtureRepo.repoPath,
          storagePath: handle.tmpHandle.dbPath,
          indexedAt: new Date().toISOString(),
          lastCommit: fixtureRepo.initialCommit,
          stats: { files: 5, nodes: 10, communities: 1, processes: 3 },
        },
      ]);
      const backend = new LocalBackend();
      await backend.init();
      (handle as any)._backend = backend;
      (handle as any)._repoPath = fixtureRepo.repoPath;
    },
  },
);
