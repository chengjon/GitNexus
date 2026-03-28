export interface KuzuFtsRuntime {
  getConnection(): { query: (cypher: string) => Promise<any> } | null;
  isFTSLoaded(): boolean;
  setFTSLoaded(value: boolean): void;
}

const requireConnection = (runtime: KuzuFtsRuntime) => {
  const conn = runtime.getConnection();
  if (!conn) {
    throw new Error('KuzuDB not initialized. Call initKuzu first.');
  }
  return conn;
};

export const loadFTSExtension = async (runtime: KuzuFtsRuntime): Promise<void> => {
  if (runtime.isFTSLoaded()) return;

  const conn = requireConnection(runtime);
  try {
    await conn.query('INSTALL fts');
    await conn.query('LOAD EXTENSION fts');
    runtime.setFTSLoaded(true);
  } catch (err: any) {
    const msg = err?.message || '';
    if (msg.includes('already loaded') || msg.includes('already installed') || msg.includes('already exists')) {
      runtime.setFTSLoaded(true);
    } else {
      console.error('GitNexus: FTS extension load failed:', msg);
    }
  }
};

export const createFTSIndex = async (
  runtime: KuzuFtsRuntime,
  tableName: string,
  indexName: string,
  properties: string[],
  stemmer: string = 'porter',
): Promise<void> => {
  const conn = requireConnection(runtime);
  await loadFTSExtension(runtime);

  const propList = properties.map((property) => `'${property}'`).join(', ');
  const cypher = `CALL CREATE_FTS_INDEX('${tableName}', '${indexName}', [${propList}], stemmer := '${stemmer}')`;

  try {
    await conn.query(cypher);
  } catch (err: any) {
    if (!err?.message?.includes('already exists')) {
      throw err;
    }
  }
};

export const queryFTS = async (
  runtime: KuzuFtsRuntime,
  tableName: string,
  indexName: string,
  query: string,
  limit: number = 20,
  conjunctive: boolean = false,
): Promise<Array<{ nodeId: string; name: string; filePath: string; score: number; [key: string]: any }>> => {
  const conn = requireConnection(runtime);
  const escapedQuery = query.replace(/\\/g, '\\\\').replace(/'/g, "''");
  const cypher = `
    CALL QUERY_FTS_INDEX('${tableName}', '${indexName}', '${escapedQuery}', conjunctive := ${conjunctive})
    RETURN node, score
    ORDER BY score DESC
    LIMIT ${limit}
  `;

  try {
    const queryResult = await conn.query(cypher);
    const result = Array.isArray(queryResult) ? queryResult[0] : queryResult;
    const rows = await result.getAll();

    return rows.map((row: any) => {
      const node = row.node || row[0] || {};
      const score = row.score ?? row[1] ?? 0;
      return {
        nodeId: node.nodeId || node.id || '',
        name: node.name || '',
        filePath: node.filePath || '',
        score: typeof score === 'number' ? score : parseFloat(score) || 0,
        ...node,
      };
    });
  } catch (err: any) {
    if (err?.message?.includes('does not exist')) {
      return [];
    }
    throw err;
  }
};

export const dropFTSIndex = async (
  runtime: KuzuFtsRuntime,
  tableName: string,
  indexName: string,
): Promise<void> => {
  const conn = requireConnection(runtime);

  try {
    await conn.query(`CALL DROP_FTS_INDEX('${tableName}', '${indexName}')`);
  } catch {
    // Index may not exist.
  }
};
