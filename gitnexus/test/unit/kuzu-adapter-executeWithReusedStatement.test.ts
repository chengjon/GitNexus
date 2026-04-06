import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const preparedStatement = {
    isSuccess: vi.fn(() => true),
    getErrorMessage: vi.fn(() => ''),
  };

  const query = vi.fn(async () => []);
  const prepare = vi.fn(async () => preparedStatement);
  const execute = vi.fn(async () => ({ getAll: async () => [] }));
  const closeConnection = vi.fn(async () => undefined);
  const closeDatabase = vi.fn(async () => undefined);

  class Database {
    close = closeDatabase;
    constructor(_dbPath: string) {}
  }

  class Connection {
    query = query;
    prepare = prepare;
    execute = execute;
    close = closeConnection;
    constructor(_db: unknown) {}
  }

  return {
    preparedStatement,
    query,
    prepare,
    execute,
    closeConnection,
    closeDatabase,
    Database,
    Connection,
    stat: vi.fn(async () => {
      throw new Error('missing');
    }),
    mkdir: vi.fn(async () => undefined),
    rmdir: vi.fn(async () => undefined),
    rm: vi.fn(async () => undefined),
    readdir: vi.fn(async () => []),
  };
});

vi.mock('kuzu', () => ({
  default: {
    Database: mocks.Database,
    Connection: mocks.Connection,
  },
}));

vi.mock('fs/promises', () => ({
  default: {
    stat: mocks.stat,
    mkdir: mocks.mkdir,
    rmdir: mocks.rmdir,
    rm: mocks.rm,
    readdir: mocks.readdir,
  },
}));

async function loadKuzuAdapterModule(): Promise<{
  initKuzu: (dbPath: string) => Promise<unknown>;
  closeKuzu: () => Promise<void>;
  executeWithReusedStatement: (
    cypher: string,
    paramsList: Array<Record<string, unknown>>,
  ) => Promise<void>;
}> {
  const mod = await import('../../src/core/kuzu/kuzu-adapter.js');
  return {
    initKuzu: mod.initKuzu,
    closeKuzu: mod.closeKuzu,
    executeWithReusedStatement: mod.executeWithReusedStatement,
  };
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.preparedStatement.isSuccess.mockReturnValue(true);
  mocks.preparedStatement.getErrorMessage.mockReturnValue('');
  mocks.stat.mockImplementation(async () => {
    throw new Error('missing');
  });
});

describe('executeWithReusedStatement', () => {
  it('prepares once and reuses the statement across all sub-batches', async () => {
    const { initKuzu, closeKuzu, executeWithReusedStatement } = await loadKuzuAdapterModule();

    await initKuzu('/tmp/repo/.gitnexus/kuzu');
    await executeWithReusedStatement(
      'CREATE (e:CodeEmbedding {nodeId: $nodeId, embedding: $embedding})',
      [
        { nodeId: 'node-1', embedding: [1] },
        { nodeId: 'node-2', embedding: [2] },
        { nodeId: 'node-3', embedding: [3] },
        { nodeId: 'node-4', embedding: [4] },
        { nodeId: 'node-5', embedding: [5] },
      ],
    );

    expect(mocks.prepare).toHaveBeenCalledTimes(1);
    expect(mocks.execute).toHaveBeenCalledTimes(5);

    await closeKuzu();
  });

  it('rejects on execution failure without advancing to the next sub-batch', async () => {
    const { initKuzu, closeKuzu, executeWithReusedStatement } = await loadKuzuAdapterModule();
    let pendingFirstBatch = 0;
    let nextBatchStartedEarly = false;
    let callCount = 0;

    mocks.execute.mockImplementation(async () => {
      callCount += 1;

      if (callCount <= 4) {
        pendingFirstBatch += 1;
        if (callCount === 2) {
          pendingFirstBatch -= 1;
          throw new Error('synthetic execute failure');
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
        pendingFirstBatch -= 1;
        return { getAll: async () => [] };
      }

      if (pendingFirstBatch > 0) {
        nextBatchStartedEarly = true;
      }

      return { getAll: async () => [] };
    });

    await initKuzu('/tmp/repo/.gitnexus/kuzu');
    await expect(executeWithReusedStatement(
      'CREATE (e:CodeEmbedding {nodeId: $nodeId, embedding: $embedding})',
      [
        { nodeId: 'node-1', embedding: [1] },
        { nodeId: 'node-2', embedding: [2] },
        { nodeId: 'node-3', embedding: [3] },
        { nodeId: 'node-4', embedding: [4] },
        { nodeId: 'node-5', embedding: [5] },
      ],
    )).rejects.toThrow('synthetic execute failure');

    expect(nextBatchStartedEarly).toBe(false);
    expect(mocks.execute).toHaveBeenCalledTimes(2);

    await closeKuzu();
  });
});
