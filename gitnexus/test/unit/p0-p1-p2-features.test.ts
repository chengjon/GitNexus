import { describe, it, expect } from 'vitest';
import { classifyFile, classifyFiles, aggregateClasses } from '../../src/core/file-classifier.js';
import { generateRiskRationale } from '../../src/core/risk-rationale.js';
import { extractStyleImports, isStyleFile } from '../../src/core/ingestion/style-imports.js';

// ── File Classifier ──────────────────────────────────────────────────────

describe('file-classifier', () => {
  it('classifies .scss files as style', () => {
    expect(classifyFile('src/styles/colors.scss').classes).toContain('style');
  });

  it('classifies test files as test', () => {
    expect(classifyFile('src/app.test.ts').classes).toContain('test');
    expect(classifyFile('src/app.spec.js').classes).toContain('test');
    expect(classifyFile('src/__tests__/foo.ts').classes).toContain('test');
  });

  it('classifies config files as config', () => {
    expect(classifyFile('tsconfig.json').classes).toContain('config');
    expect(classifyFile('.env.local').classes).toContain('config');
    expect(classifyFile('docker-compose.yml').classes).toContain('config');
  });

  it('classifies governance files', () => {
    expect(classifyFile('openspec/changes/proposal.md').classes).toContain('governance');
    expect(classifyFile('AGENTS.md').classes).toContain('governance');
  });

  it('classifies source files as source (default)', () => {
    expect(classifyFile('src/app.ts').classes).toEqual(['source']);
    expect(classifyFile('lib/utils.py').classes).toEqual(['source']);
  });

  it('classifiesFiles aggregates results', () => {
    const results = classifyFiles(['a.test.ts', 'b.scss', 'c.json']);
    expect(results).toHaveLength(3);
    const agg = aggregateClasses(results);
    expect(agg.test).toBe(1);
    expect(agg.style).toBe(1);
    expect(agg.config).toBe(1);
  });

  it('supports extraRules override', () => {
    const result = classifyFile('custom.xyz', [{ pattern: /\.xyz$/i, classes: ['data'] }]);
    expect(result.classes).toContain('data');
  });
});

// ── Risk Rationale ───────────────────────────────────────────────────────

describe('risk-rationale', () => {
  it('returns positive rationale for LOW risk with no signals breached', () => {
    const result = generateRiskRationale('LOW', [
      { name: 'affected_processes', value: 0, threshold: 5, breached: false },
    ]);
    expect(result.risk_level).toBe('LOW');
    expect(result.rationale).toHaveLength(1);
    expect(result.rationale[0]).toMatch(/no changed symbols/i);
  });

  it('returns breached signal rationale for HIGH risk', () => {
    const result = generateRiskRationale('HIGH', [
      { name: 'affected_processes', value: 12, threshold: 5, breached: true },
    ]);
    expect(result.risk_level).toBe('HIGH');
    expect(result.rationale).toHaveLength(1);
    expect(result.rationale[0]).toContain('affected_processes');
    expect(result.rationale[0]).toContain('12');
  });

  it('returns safe-threshold rationale for LOW with non-zero safe values', () => {
    const result = generateRiskRationale('LOW', [
      { name: 'direct_callers', value: 2, threshold: 5, breached: false },
    ]);
    expect(result.rationale[0]).toMatch(/safe thresholds/);
  });

  it('handles multiple breached signals', () => {
    const result = generateRiskRationale('CRITICAL', [
      { name: 'direct_callers', value: 10, threshold: 3, breached: true },
      { name: 'affected_processes', value: 20, threshold: 5, breached: true },
    ]);
    expect(result.rationale).toHaveLength(2);
  });
});

// ── Style Imports ────────────────────────────────────────────────────────

describe('style-imports', () => {
  it('isStyleFile detects scss/sass/less/css', () => {
    expect(isStyleFile('a.scss')).toBe(true);
    expect(isStyleFile('a.sass')).toBe(true);
    expect(isStyleFile('a.less')).toBe(true);
    expect(isStyleFile('a.css')).toBe(true);
    expect(isStyleFile('a.ts')).toBe(false);
  });

  it('extracts @use imports', () => {
    const result = extractStyleImports('@use "colors";\n@use \'layout\';', 'styles/app.scss');
    expect(result).toHaveLength(2);
    expect(result[0].rawSpecifier).toBe('colors');
    expect(result[0].resolvedPath).toBe('styles/colors.scss');
  });

  it('extracts @import and @forward directives', () => {
    const result = extractStyleImports('@import "base";\n@forward "components";', 'app.scss');
    expect(result).toHaveLength(2);
    expect(result[0].rawSpecifier).toBe('base');
    expect(result[1].rawSpecifier).toBe('components');
  });

  it('resolves relative paths from source directory', () => {
    const result = extractStyleImports('@use "colors"', 'deep/nested/app.scss');
    expect(result[0].resolvedPath).toBe('deep/nested/colors.scss');
  });

  it('returns empty array for file with no style imports', () => {
    const result = extractStyleImports('.foo { color: red; }', 'app.scss');
    expect(result).toEqual([]);
  });
});
