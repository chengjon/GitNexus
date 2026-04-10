import { describe, expect, it } from 'vitest';
import { buildSuffixIndex, suffixResolve } from '../../src/core/ingestion/resolvers/utils.js';

describe('resolver utils suffixResolve', () => {
  const allFileList = [
    'src/components/Button.tsx',
    'src/Feature/Auth/LoginForm.tsx',
    'src/pages/index.tsx',
  ];
  const normalizedFileList = allFileList.map((filePath) => filePath.replace(/\\/g, '/'));

  it('resolves nested suffixes through the indexed path', () => {
    const index = buildSuffixIndex(normalizedFileList, allFileList);

    expect(suffixResolve(['Feature', 'Auth', 'LoginForm'], normalizedFileList, allFileList, index)).toBe(
      'src/Feature/Auth/LoginForm.tsx',
    );
  });

  it('preserves the backward-compatible no-index linear scan path', () => {
    expect(suffixResolve(['Feature', 'Auth', 'LoginForm'], normalizedFileList, allFileList)).toBe(
      'src/Feature/Auth/LoginForm.tsx',
    );
  });

  it('keeps no-index resolution case-insensitive and returns the original file path casing', () => {
    const mixedCaseNormalized = [
      'src/components/button.tsx',
      'src/feature/auth/loginform.tsx',
      'src/pages/index.tsx',
    ];

    expect(suffixResolve(['feature', 'auth', 'loginform'], mixedCaseNormalized, allFileList)).toBe(
      'src/Feature/Auth/LoginForm.tsx',
    );
  });
});
