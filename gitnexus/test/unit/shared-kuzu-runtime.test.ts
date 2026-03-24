import { describe, expect, it } from 'vitest';
import { createSharedKuzuTestRuntime } from '../../test/helpers/shared-kuzu-runtime.js';

describe('createSharedKuzuTestRuntime', () => {
  it('creates a shared db, applies schema, and preloads FTS', async () => {
    const queries: string[] = [];
    const runtime = await createSharedKuzuTestRuntime({
      createTempDir: async () => ({
        dbPath: '/tmp/shared-root',
        cleanup: async () => { queries.push('cleanup-temp'); },
      }),
      createDatabase: (_dbPath) => ({ close: () => { queries.push('close-db'); } }),
      createConnection: (_db) => ({
        query: async (sql: string) => { queries.push(sql); },
        close: () => { queries.push('close-conn'); },
      }),
      nodeSchemaQueries: ['node-1', 'node-2'],
      relSchemaQueries: ['rel-1'],
      embeddingSchema: 'embed-schema',
      shouldExplicitlyCloseNativeKuzu: () => true,
    });

    expect(runtime.dbPath).toBe('/tmp/shared-root/kuzu');
    expect(queries).toEqual([
      'node-1',
      'node-2',
      'rel-1',
      'embed-schema',
      'INSTALL fts',
      'LOAD EXTENSION fts',
      'close-conn',
      'close-db',
    ]);

    await runtime.teardown();
    expect(queries.at(-1)).toBe('cleanup-temp');
  });

  it('skips explicit close on platforms where native teardown is unsafe', async () => {
    const queries: string[] = [];
    await createSharedKuzuTestRuntime({
      createTempDir: async () => ({
        dbPath: '/tmp/shared-root',
        cleanup: async () => {},
      }),
      createDatabase: (_dbPath) => ({ close: () => { queries.push('close-db'); } }),
      createConnection: (_db) => ({
        query: async (sql: string) => { queries.push(sql); },
        close: () => { queries.push('close-conn'); },
      }),
      nodeSchemaQueries: [],
      relSchemaQueries: [],
      embeddingSchema: 'embed-schema',
      shouldExplicitlyCloseNativeKuzu: () => false,
    });

    expect(queries).not.toContain('close-conn');
    expect(queries).not.toContain('close-db');
  });

  it('ignores fts install/load errors', async () => {
    const queries: string[] = [];
    await createSharedKuzuTestRuntime({
      createTempDir: async () => ({
        dbPath: '/tmp/shared-root',
        cleanup: async () => {},
      }),
      createDatabase: (_dbPath) => ({ close: () => {} }),
      createConnection: (_db) => ({
        query: async (sql: string) => {
          queries.push(sql);
          if (sql === 'INSTALL fts') {
            throw new Error('already installed');
          }
        },
        close: () => {},
      }),
      nodeSchemaQueries: [],
      relSchemaQueries: [],
      embeddingSchema: 'embed-schema',
      shouldExplicitlyCloseNativeKuzu: () => false,
    });

    expect(queries).toContain('INSTALL fts');
  });
});
