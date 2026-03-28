import { describe, expect, it } from 'vitest';

import {
  formatLanguageSupportSummary,
  extractLanguageSupportCheck,
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
});
