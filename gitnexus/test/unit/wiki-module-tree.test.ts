import { describe, expect, it } from 'vitest';
import * as moduleTreeTypes from '../../src/core/wiki/module-tree/types.js';
import type { ModuleTreeNode } from '../../src/core/wiki/module-tree/types.js';
import { parseGroupingResponse, fallbackGrouping, splitBySubdirectory, flattenModuleTree } from '../../src/core/wiki/module-tree/builder.js';

describe('wiki module tree types', () => {
  it('resolves ModuleTreeNode from the new module boundary', () => {
    const nodes: ModuleTreeNode[] = [];
    expect(Array.isArray(nodes)).toBe(true);
    expect(moduleTreeTypes).toBeTruthy();
  });

  it('parses grouping JSON inside markdown fences', () => {
    const files = [
      { filePath: 'src/auth/login.ts', symbols: [] },
      { filePath: 'src/auth/session.ts', symbols: [] },
    ];
    const content = [
      '```json',
      JSON.stringify({ Auth: ['src/auth/login.ts', 'src/auth/session.ts'] }, null, 2),
      '```',
    ].join('\n');

    expect(parseGroupingResponse(content, files as any)).toEqual({
      Auth: ['src/auth/login.ts', 'src/auth/session.ts'],
    });
  });

  it('falls back and assigns ungrouped files to Other', () => {
    const files = [
      { filePath: 'src/auth/login.ts', symbols: [] },
      { filePath: 'src/users/profile.ts', symbols: [] },
    ];

    expect(parseGroupingResponse('not-json', files as any)).toEqual(
      fallbackGrouping(files as any),
    );
  });

  it('splits oversized modules by subdirectory', () => {
    expect(splitBySubdirectory('Backend', [
      'src/auth/login.ts',
      'src/auth/session.ts',
      'src/users/profile.ts',
    ], (value) => value.toLowerCase())).toEqual([
      expect.objectContaining({
        name: 'Backend — auth',
        files: ['src/auth/login.ts', 'src/auth/session.ts'],
      }),
      expect.objectContaining({
        name: 'Backend — users',
        files: ['src/users/profile.ts'],
      }),
    ]);
  });

  it('flattens leaves before parents', () => {
    const tree: ModuleTreeNode[] = [
      {
        name: 'Backend',
        slug: 'backend',
        files: [],
        children: [
          { name: 'Auth', slug: 'auth', files: ['src/auth.ts'] },
          { name: 'Users', slug: 'users', files: ['src/users.ts'] },
        ],
      },
    ];

    expect(flattenModuleTree(tree)).toEqual({
      leaves: [
        expect.objectContaining({ slug: 'auth' }),
        expect.objectContaining({ slug: 'users' }),
      ],
      parents: [
        expect.objectContaining({ slug: 'backend' }),
      ],
    });
  });
});
