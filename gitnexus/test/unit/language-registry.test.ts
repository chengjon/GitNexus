import { describe, expect, it } from 'vitest';
import { SupportedLanguages } from '../../src/config/supported-languages.js';
import { createLanguageMap } from '../../src/core/tree-sitter/language-registry.js';

describe('language-registry', () => {
  it('omits optional languages when their native bindings are unavailable', () => {
    const map = createLanguageMap((moduleName) => {
      if (moduleName === 'tree-sitter-kotlin' || moduleName === 'tree-sitter-swift') {
        throw new Error(`No native build was found for ${moduleName}`);
      }

      throw new Error(`Unexpected optional module request: ${moduleName}`);
    });

    expect(map).not.toHaveProperty(SupportedLanguages.Kotlin);
    expect(map).not.toHaveProperty(SupportedLanguages.Swift);
  });

  it('includes optional languages when their loaders succeed', () => {
    const fakeKotlin = { grammar: 'kotlin' };
    const fakeSwift = { grammar: 'swift' };

    const map = createLanguageMap((moduleName) => {
      if (moduleName === 'tree-sitter-kotlin') return fakeKotlin;
      if (moduleName === 'tree-sitter-swift') return fakeSwift;

      throw new Error(`Unexpected optional module request: ${moduleName}`);
    });

    expect(map[SupportedLanguages.Kotlin]).toBe(fakeKotlin);
    expect(map[SupportedLanguages.Swift]).toBe(fakeSwift);
  });

  it('rethrows unexpected loader failures', () => {
    expect(() => createLanguageMap((moduleName) => {
      if (moduleName === 'tree-sitter-kotlin') {
        throw new Error('Unexpected parse error inside optional loader');
      }

      if (moduleName === 'tree-sitter-swift') {
        return { grammar: 'swift' };
      }

      throw new Error(`Unexpected optional module request: ${moduleName}`);
    })).toThrow('Unexpected parse error inside optional loader');
  });
});
