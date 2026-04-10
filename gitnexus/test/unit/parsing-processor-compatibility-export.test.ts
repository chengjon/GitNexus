import { describe, expect, it } from 'vitest';

describe('parsing-processor compatibility export', () => {
  it('keeps isNodeExported available from the historical parsing-processor path', async () => {
    const [{ isNodeExported: compatExport }, { isNodeExported: canonicalExport }] = await Promise.all([
      import('../../src/core/ingestion/parsing-processor.js'),
      import('../../src/core/ingestion/export-detection.js'),
    ]);

    expect(compatExport).toBe(canonicalExport);
    expect(typeof compatExport).toBe('function');
  });
});
