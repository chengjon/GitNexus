import { describe, expect, it } from 'vitest';
import * as moduleTreeTypes from '../../src/core/wiki/module-tree/types.js';
import type { ModuleTreeNode } from '../../src/core/wiki/module-tree/types.js';

describe('wiki module tree types', () => {
  it('resolves ModuleTreeNode from the new module boundary', () => {
    const nodes: ModuleTreeNode[] = [];
    expect(Array.isArray(nodes)).toBe(true);
    expect(moduleTreeTypes).toBeTruthy();
  });
});
