import { describe, expect, it } from 'vitest';

import { normalizePlatformPath, samePlatformPath } from '../../src/lib/path-comparison.js';

describe('normalizePlatformPath', () => {
  it('normalizes Windows paths to lowercase resolved form', () => {
    expect(normalizePlatformPath('D:\\Projects\\MyApp', 'win32')).toBe('d:\\projects\\myapp');
  });

  it('preserves POSIX case while resolving the path', () => {
    expect(normalizePlatformPath('/home/user/Project', 'linux')).toBe('/home/user/Project');
  });
});

describe('samePlatformPath', () => {
  it('compares Windows paths case-insensitively', () => {
    expect(samePlatformPath('D:\\Projects\\MyApp', 'd:\\projects\\myapp', 'win32')).toBe(true);
    expect(samePlatformPath('D:\\Projects\\App1', 'D:\\Projects\\App2', 'win32')).toBe(false);
  });

  it('compares non-Windows paths case-sensitively', () => {
    expect(samePlatformPath('/home/user/Project', '/home/user/project', 'linux')).toBe(false);
    expect(samePlatformPath('/home/user/project', '/home/user/project', 'linux')).toBe(true);
  });

  it('ignores surrounding whitespace before comparing', () => {
    expect(samePlatformPath('  /repo/path  ', '/repo/path', 'linux')).toBe(true);
  });
});
