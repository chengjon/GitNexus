/**
 * Vue SFC: script extraction + import resolution
 */
import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import {
  FIXTURES, getRelationships, getNodesByLabel,
  runPipelineFromRepo, type PipelineResult,
} from './helpers.js';

describe('Vue SFC resolution', () => {
  let result: PipelineResult;

  beforeAll(async () => {
    result = await runPipelineFromRepo(
      path.join(FIXTURES, 'vue-sfc'),
      () => {},
    );
  }, 60000);

  it('creates file nodes for vue files', () => {
    const filePaths: string[] = [];
    result.graph.forEachNode(node => {
      if (node.label === 'File') filePaths.push(node.properties.filePath);
    });

    expect(filePaths).toContain('src/App.vue');
    expect(filePaths).toContain('src/Widget.vue');
    expect(filePaths).toContain('src/user.ts');
  });

  it('extracts function definitions from script setup blocks', () => {
    expect(getNodesByLabel(result, 'Function')).toEqual([
      'fetchUsers',
      'loadUsers',
      'renderWidget',
    ]);
  });

  it('resolves imports to both .vue and .ts files', () => {
    const imports = getRelationships(result, 'IMPORTS');
    const edges = imports.map(edge => `${edge.sourceFilePath} → ${edge.targetFilePath}`).sort();

    expect(edges).toContain('src/App.vue → src/Widget.vue');
    expect(edges).toContain('src/App.vue → src/user.ts');
  });

  it('resolves calls from vue script setup into imported modules', () => {
    const calls = getRelationships(result, 'CALLS');
    const edges = calls.map(edge => `${edge.source} → ${edge.target}`).sort();

    expect(edges).toContain('loadUsers → fetchUsers');
  });
});
