import path from 'path';
import kuzu from 'kuzu';
import { createTempDir, type TestDBHandle } from './test-db.js';
import { shouldExplicitlyCloseNativeKuzu } from './native-teardown-policy.js';
import {
  NODE_SCHEMA_QUERIES,
  REL_SCHEMA_QUERIES,
  EMBEDDING_SCHEMA,
} from '../../src/core/kuzu/schema.js';

interface KuzuDbHandleLike {
  close?: () => unknown;
}

interface KuzuConnLike {
  query: (sql: string) => Promise<unknown>;
  close?: () => unknown;
}

interface SharedKuzuRuntimeDeps {
  createTempDir: (prefix: string) => Promise<TestDBHandle>;
  createDatabase: (dbPath: string) => KuzuDbHandleLike;
  createConnection: (db: KuzuDbHandleLike) => KuzuConnLike;
  nodeSchemaQueries: string[];
  relSchemaQueries: string[];
  embeddingSchema: string;
  shouldExplicitlyCloseNativeKuzu: () => boolean;
}

export interface SharedKuzuTestRuntime {
  dbPath: string;
  teardown: () => Promise<void>;
}

const DEFAULT_DEPS: SharedKuzuRuntimeDeps = {
  createTempDir,
  createDatabase: (dbPath: string) => new kuzu.Database(dbPath),
  createConnection: (db: KuzuDbHandleLike) => new kuzu.Connection(db as kuzu.Database),
  nodeSchemaQueries: [...NODE_SCHEMA_QUERIES],
  relSchemaQueries: [...REL_SCHEMA_QUERIES],
  embeddingSchema: EMBEDDING_SCHEMA,
  shouldExplicitlyCloseNativeKuzu: () => shouldExplicitlyCloseNativeKuzu(),
};

export async function createSharedKuzuTestRuntime(
  deps: SharedKuzuRuntimeDeps = DEFAULT_DEPS,
): Promise<SharedKuzuTestRuntime> {
  const tmpHandle = await deps.createTempDir('gitnexus-shared-');
  const dbPath = path.join(tmpHandle.dbPath, 'kuzu');
  const db = deps.createDatabase(dbPath);
  const conn = deps.createConnection(db);

  for (const q of deps.nodeSchemaQueries) {
    await conn.query(q);
  }
  for (const q of deps.relSchemaQueries) {
    await conn.query(q);
  }
  await conn.query(deps.embeddingSchema);

  try {
    await conn.query('INSTALL fts');
    await conn.query('LOAD EXTENSION fts');
  } catch {
    // FTS may already be installed — not fatal for tests.
  }

  if (deps.shouldExplicitlyCloseNativeKuzu()) {
    conn.close?.();
    db.close?.();
  }

  return {
    dbPath,
    teardown: async () => {
      await tmpHandle.cleanup();
    },
  };
}
