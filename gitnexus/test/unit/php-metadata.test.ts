import { beforeAll, describe, expect, it } from 'vitest';

import { SupportedLanguages } from '../../src/config/supported-languages.js';
import {
  extractEloquentRelationDescription,
  extractPhpPropertyDescription,
} from '../../src/core/ingestion/php/php-metadata.js';
import { loadLanguage, loadParser } from '../../src/core/tree-sitter/parser-loader.js';

let parser: Awaited<ReturnType<typeof loadParser>>;

function findFirstNodeOfType(node: any, type: string): any {
  if (!node) return null;
  if (node.type === type) return node;
  for (const child of node.children ?? []) {
    const found = findFirstNodeOfType(child, type);
    if (found) return found;
  }
  return null;
}

async function parsePhp(source: string) {
  await loadLanguage(SupportedLanguages.PHP, 'app/Models/User.php');
  return parser.parse(source);
}

describe('php metadata helpers', () => {
  beforeAll(async () => {
    parser = await loadParser();
  });

  it('extracts Eloquent array property descriptions', async () => {
    const tree = await parsePhp(`<?php
class User {
    protected $fillable = ['name', 'email'];
}
`);
    const propNode = findFirstNodeOfType(tree.rootNode, 'property_declaration');

    expect(extractPhpPropertyDescription('fillable', propNode)).toBe('name, email');
  });

  it('extracts keyed Eloquent cast descriptions', async () => {
    const tree = await parsePhp(`<?php
class User {
    protected $casts = ['id' => 'int', 'meta' => 'array'];
}
`);
    const propNode = findFirstNodeOfType(tree.rootNode, 'property_declaration');

    expect(extractPhpPropertyDescription('casts', propNode)).toBe('id:int, meta:array');
  });

  it('returns null for non-Eloquent properties', async () => {
    const tree = await parsePhp(`<?php
class User {
    protected $table = 'users';
}
`);
    const propNode = findFirstNodeOfType(tree.rootNode, 'property_declaration');

    expect(extractPhpPropertyDescription('table', propNode)).toBeNull();
  });

  it('extracts Eloquent relationship descriptions from methods', async () => {
    const tree = await parsePhp(`<?php
class User {
    public function posts() {
        return $this->hasMany(Post::class);
    }
}
`);
    const methodNode = findFirstNodeOfType(tree.rootNode, 'method_declaration');

    expect(extractEloquentRelationDescription(methodNode)).toBe('hasMany(Post)');
  });

  it('returns null when a method is not an Eloquent relationship', async () => {
    const tree = await parsePhp(`<?php
class User {
    public function displayName() {
        return $this->name;
    }
}
`);
    const methodNode = findFirstNodeOfType(tree.rootNode, 'method_declaration');

    expect(extractEloquentRelationDescription(methodNode)).toBeNull();
  });
});
