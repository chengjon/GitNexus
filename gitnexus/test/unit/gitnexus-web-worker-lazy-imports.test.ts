import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const WORKER_SOURCE = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'gitnexus-web',
  'src',
  'workers',
  'ingestion.worker.ts',
);

const HEAVY_RUNTIME_MODULES = [
  '../core/embeddings/embedding-pipeline',
  '../core/embeddings/embedder',
  '../core/llm/agent',
  '../core/llm/context-builder',
  '@langchain/core/messages',
];

const getImportStatements = (source: string): string[] => {
  return source.match(/^import[\s\S]*?;$/gm) ?? [];
};

describe('gitnexus-web worker runtime lazy imports', () => {
  it('keeps heavy embedding and agent runtimes out of ingestion.worker top-level imports', () => {
    const source = fs.readFileSync(WORKER_SOURCE, 'utf-8');
    const importStatements = getImportStatements(source);

    for (const specifier of HEAVY_RUNTIME_MODULES) {
      const runtimeImport = importStatements.find((statement) => {
        return !statement.startsWith('import type') && statement.includes(`from '${specifier}'`);
      });

      expect(runtimeImport, `expected ${specifier} to stay out of top-level runtime imports`).toBeUndefined();
    }
  });

  it('loads heavy embedding and agent runtimes via dynamic import boundaries', () => {
    const source = fs.readFileSync(WORKER_SOURCE, 'utf-8');

    for (const specifier of HEAVY_RUNTIME_MODULES) {
      expect(source).toContain(`import('${specifier}')`);
    }
  });
});
