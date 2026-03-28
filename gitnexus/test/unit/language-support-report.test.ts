import { describe, expect, it } from 'vitest';

import {
  formatLanguageSupportSummary,
  extractLanguageSupportCheck,
  validateLanguageSupportPolicy,
} from '../../scripts/ci/language-support-report.mjs';

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
        },
      ],
    };

    expect(extractLanguageSupportCheck(doctorResult)).toEqual({
      name: 'language-support',
      status: 'warn',
      detail: 'typescript:builtin=available (bundled), kotlin:optional=unavailable (missing native build), swift:optional=available (loaded)',
    });
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
});
