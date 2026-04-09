import { describe, expect, it } from 'vitest';
import { SupportedLanguages } from '../../src/config/supported-languages.js';
import { getLanguageSupportPolicy } from '../../src/core/tree-sitter/language-registry.js';

import {
  formatLanguageSupportSummary,
  extractLanguageSupportCheck,
  validateLanguageSupportPolicy,
} from '../../src/ci/language-support-report.js';

describe('language support CI report', () => {
  it('extracts the language-support check from doctor JSON', () => {
    const doctorResult = {
      overall: 'warn',
      checks: [
        { name: 'git-repo', status: 'pass', detail: 'ok' },
        {
          name: 'language-support',
          status: 'warn',
          detail: 'typescript:builtin=available (bundled), kotlin:optional=unavailable (missing native build), swift:optional=available (loaded)',
          data: [
            { language: 'typescript', tier: 'builtin', status: 'available', supportLevel: 'fully-supported', reasonCode: 'bundled-grammar', source: 'bundled', detail: 'bundled' },
            { language: 'kotlin', tier: 'optional', status: 'unavailable', supportLevel: 'disabled-or-unavailable', reasonCode: 'native-build-unavailable', source: 'tree-sitter-kotlin', detail: 'missing native build' },
            { language: 'swift', tier: 'optional', status: 'available', supportLevel: 'supported-with-optional-native-grammar', reasonCode: 'optional-native-grammar-loaded', source: 'tree-sitter-swift', detail: 'loaded' },
          ],
        },
      ],
    };

    expect(extractLanguageSupportCheck(doctorResult)).toEqual({
      name: 'language-support',
      status: 'warn',
      detail: 'typescript:builtin=available (bundled), kotlin:optional=unavailable (missing native build), swift:optional=available (loaded)',
      data: [
        { language: 'typescript', tier: 'builtin', status: 'available', supportLevel: 'fully-supported', reasonCode: 'bundled-grammar', source: 'bundled', detail: 'bundled' },
        { language: 'kotlin', tier: 'optional', status: 'unavailable', supportLevel: 'disabled-or-unavailable', reasonCode: 'native-build-unavailable', source: 'tree-sitter-kotlin', detail: 'missing native build' },
        { language: 'swift', tier: 'optional', status: 'available', supportLevel: 'supported-with-optional-native-grammar', reasonCode: 'optional-native-grammar-loaded', source: 'tree-sitter-swift', detail: 'loaded' },
      ],
    });
  });

  it('formats a GitHub summary from structured language-support data when available', () => {
    const summary = formatLanguageSupportSummary({
      name: 'language-support',
      status: 'warn',
      detail: 'legacy fallback detail',
      data: [
        { language: 'typescript', tier: 'builtin', status: 'available', supportLevel: 'fully-supported', reasonCode: 'bundled-grammar', source: 'bundled', detail: 'bundled' },
        { language: 'kotlin', tier: 'optional', status: 'unavailable', supportLevel: 'disabled-or-unavailable', reasonCode: 'native-build-unavailable', source: 'tree-sitter-kotlin', detail: 'missing native build' },
        { language: 'swift', tier: 'optional', status: 'available', supportLevel: 'supported-with-optional-native-grammar', reasonCode: 'optional-native-grammar-loaded', source: 'tree-sitter-swift', detail: 'loaded' },
      ],
    });

    expect(summary).toContain('- builtin: `typescript` = `available`');
    expect(summary).toContain('`fully-supported`');
    expect(summary).toContain('`bundled-grammar`');
    expect(summary).toContain('`disabled-or-unavailable`');
    expect(summary).toContain('`native-build-unavailable`');
    expect(summary).toContain('`supported-with-optional-native-grammar`');
    expect(summary).toContain('`optional-native-grammar-loaded`');
  });

  it('formats a GitHub summary with builtin and optional language groups', () => {
    const summary = formatLanguageSupportSummary({
      name: 'language-support',
      status: 'warn',
      detail: 'typescript:builtin=available (bundled), kotlin:optional=unavailable (missing native build), swift:optional=available (loaded)',
    });

    expect(summary).toContain('## Language Support');
    expect(summary).toContain('- builtin: `typescript` = `available`');
    expect(summary).toContain('- optional: `kotlin` = `unavailable`');
    expect(summary).toContain('- optional: `swift` = `available`');
  });

  it('parses semantic support levels from detail-only fallback payloads', () => {
    const summary = formatLanguageSupportSummary({
      name: 'language-support',
      status: 'warn',
      detail: [
        'typescript:builtin=available [fully-supported; bundled-grammar] (bundled)',
        'kotlin:optional=unavailable [disabled-or-unavailable; native-build-unavailable] (missing native build)',
        'swift:optional=available [supported-with-optional-native-grammar; optional-native-grammar-loaded] (loaded)',
      ].join(', '),
    });

    expect(summary).toContain('`fully-supported`');
    expect(summary).toContain('`bundled-grammar`');
    expect(summary).toContain('`disabled-or-unavailable`');
    expect(summary).toContain('`native-build-unavailable`');
    expect(summary).toContain('`supported-with-optional-native-grammar`');
    expect(summary).toContain('`optional-native-grammar-loaded`');
  });

  it('throws when doctor JSON does not include language-support', () => {
    expect(() => extractLanguageSupportCheck({ overall: 'pass', checks: [] })).toThrow(
      'language-support check missing from doctor output',
    );
  });

  it('accepts bundled languages as required and optional languages as declared states', () => {
    expect(() => validateLanguageSupportPolicy({
      name: 'language-support',
      status: 'warn',
      detail: [
        'javascript:builtin=available (bundled)',
        'typescript:builtin=available (bundled)',
        'python:builtin=available (bundled)',
        'java:builtin=available (bundled)',
        'c:builtin=available (bundled)',
        'cpp:builtin=available (bundled)',
        'csharp:builtin=available (bundled)',
        'go:builtin=available (bundled)',
        'rust:builtin=available (bundled)',
        'php:builtin=available (bundled)',
        'kotlin:optional=unavailable (missing native build)',
        'swift:optional=available (loaded)',
      ].join(', '),
    })).not.toThrow();
  });

  it('accepts multiline unavailable detail for optional languages', () => {
    expect(() => validateLanguageSupportPolicy({
      name: 'language-support',
      status: 'warn',
      detail: [
        'javascript:builtin=available (bundled)',
        'typescript:builtin=available (bundled)',
        'python:builtin=available (bundled)',
        'java:builtin=available (bundled)',
        'c:builtin=available (bundled)',
        'cpp:builtin=available (bundled)',
        'csharp:builtin=available (bundled)',
        'go:builtin=available (bundled)',
        'rust:builtin=available (bundled)',
        'php:builtin=available (bundled)',
        'kotlin:optional=available (loaded)',
        'swift:optional=unavailable (No native build was found\n    loaded from: /tmp/tree-sitter-swift)',
      ].join(', '),
    })).not.toThrow();
  });

  it('fails when a builtin language is not available', () => {
    expect(() => validateLanguageSupportPolicy({
      name: 'language-support',
      status: 'warn',
      detail: [
        'javascript:builtin=available (bundled)',
        'typescript:builtin=unavailable (unexpected)',
        'python:builtin=available (bundled)',
        'java:builtin=available (bundled)',
        'c:builtin=available (bundled)',
        'cpp:builtin=available (bundled)',
        'csharp:builtin=available (bundled)',
        'go:builtin=available (bundled)',
        'rust:builtin=available (bundled)',
        'php:builtin=available (bundled)',
        'kotlin:optional=unavailable (missing native build)',
        'swift:optional=available (loaded)',
      ].join(', '),
    })).toThrow('builtin language support must be available: typescript');
  });

  it('fails when an expected optional language declaration is missing', () => {
    expect(() => validateLanguageSupportPolicy({
      name: 'language-support',
      status: 'pass',
      detail: [
        'javascript:builtin=available (bundled)',
        'typescript:builtin=available (bundled)',
        'python:builtin=available (bundled)',
        'java:builtin=available (bundled)',
        'c:builtin=available (bundled)',
        'cpp:builtin=available (bundled)',
        'csharp:builtin=available (bundled)',
        'go:builtin=available (bundled)',
        'rust:builtin=available (bundled)',
        'php:builtin=available (bundled)',
        'kotlin:optional=available (loaded)',
      ].join(', '),
    })).toThrow('optional language declaration missing: swift');
  });

  it('uses the runtime language-support policy as the CI validation source of truth', () => {
    expect(getLanguageSupportPolicy()).toEqual({
      builtin: [
        SupportedLanguages.JavaScript,
        SupportedLanguages.TypeScript,
        SupportedLanguages.Python,
        SupportedLanguages.Java,
        SupportedLanguages.C,
        SupportedLanguages.CPlusPlus,
        SupportedLanguages.CSharp,
        SupportedLanguages.Go,
        SupportedLanguages.Rust,
        SupportedLanguages.PHP,
      ],
      optional: [
        SupportedLanguages.Kotlin,
        SupportedLanguages.Swift,
      ],
    });
  });
});
