import { describe, expect, it, vi } from 'vitest';

import {
  createFTSIndex,
  dropFTSIndex,
  loadFTSExtension,
  queryFTS,
  type KuzuFtsRuntime,
} from '../../src/core/kuzu/fts.js';

function makeRuntime(overrides: Partial<KuzuFtsRuntime> = {}): KuzuFtsRuntime {
  let loaded = false;
  const conn = {
    query: vi.fn(async () => undefined),
  };

  return {
    getConnection: () => conn as any,
    isFTSLoaded: () => loaded,
    setFTSLoaded: (value: boolean) => {
      loaded = value;
    },
    ...overrides,
  };
}

describe('kuzu fts helpers', () => {
  it('loads the FTS extension once and marks runtime state', async () => {
    const runtime = makeRuntime();
    const conn = runtime.getConnection() as any;

    await loadFTSExtension(runtime);
    await loadFTSExtension(runtime);

    expect(conn.query).toHaveBeenCalledTimes(2);
    expect(conn.query).toHaveBeenNthCalledWith(1, 'INSTALL fts');
    expect(conn.query).toHaveBeenNthCalledWith(2, 'LOAD EXTENSION fts');
    expect(runtime.isFTSLoaded()).toBe(true);
  });

  it('creates an FTS index after ensuring the extension is loaded', async () => {
    const runtime = makeRuntime();
    const conn = runtime.getConnection() as any;

    await createFTSIndex(runtime, 'Function', 'function_fts', ['name', 'content']);

    expect(conn.query).toHaveBeenNthCalledWith(1, 'INSTALL fts');
    expect(conn.query).toHaveBeenNthCalledWith(2, 'LOAD EXTENSION fts');
    expect(conn.query).toHaveBeenNthCalledWith(
      3,
      "CALL CREATE_FTS_INDEX('Function', 'function_fts', ['name', 'content'], stemmer := 'porter')",
    );
  });

  it('maps QUERY_FTS_INDEX rows into the public result shape', async () => {
    const getAll = vi.fn(async () => [
      [{ id: 'func:1', name: 'login', filePath: 'src/auth.ts' }, 1.25],
    ]);
    const runtime = makeRuntime({
      getConnection: () => ({
        query: vi.fn(async () => ({
          getAll,
        })),
      } as any),
    });

    const results = await queryFTS(runtime, 'Function', 'function_fts', "user's auth", 5, true);

    expect(results).toEqual([
      {
        nodeId: 'func:1',
        id: 'func:1',
        name: 'login',
        filePath: 'src/auth.ts',
        score: 1.25,
      },
    ]);
  });

  it('returns an empty array when the FTS index does not exist', async () => {
    const runtime = makeRuntime({
      getConnection: () => ({
        query: vi.fn(async () => {
          throw new Error('index does not exist');
        }),
      } as any),
    });

    await expect(queryFTS(runtime, 'Function', 'missing_fts', 'auth')).resolves.toEqual([]);
  });

  it('ignores drop requests for missing indexes', async () => {
    const query = vi.fn(async () => {
      throw new Error('missing');
    });
    const runtime = makeRuntime({
      getConnection: () => ({ query } as any),
    });

    await expect(dropFTSIndex(runtime, 'Function', 'missing_fts')).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledWith("CALL DROP_FTS_INDEX('Function', 'missing_fts')");
  });
});
