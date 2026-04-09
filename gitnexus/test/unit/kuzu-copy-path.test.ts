import { describe, expect, it } from 'vitest';

import { normalizeKuzuCopyPath } from '../../src/core/kuzu/copy-path.js';

describe('normalizeKuzuCopyPath', () => {
  it('converts Windows separators to forward slashes for Kuzu COPY statements', () => {
    expect(normalizeKuzuCopyPath('C:\\repo\\.gitnexus\\csv\\nodes.csv')).toBe('C:/repo/.gitnexus/csv/nodes.csv');
  });

  it('leaves POSIX-style paths unchanged', () => {
    expect(normalizeKuzuCopyPath('/tmp/repo/.gitnexus/csv/nodes.csv')).toBe('/tmp/repo/.gitnexus/csv/nodes.csv');
  });
});
