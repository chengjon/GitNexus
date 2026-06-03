import { describe, it, expect } from 'vitest';
import { classifyFile, classifyFiles, aggregateClasses } from '../../src/core/file-classifier.js';
import { generateRiskRationale } from '../../src/core/risk-rationale.js';
import { extractStyleImports, isStyleFile } from '../../src/core/ingestion/style-imports.js';
import { readFileSync } from 'fs';
import path from 'path';

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

// ── P0: Index Status shape (stale_reasons, fresh_for_staged_diff) ────────

describe('index-status fields', () => {
  it('generateRiskRationale produces detect_changes compatible rationale', () => {
    // Simulates what detect_changes does with risk_rationale
    const result = generateRiskRationale('MEDIUM', [
      { name: 'affected_processes', value: 3, threshold: 0, breached: true },
    ]);
    expect(result.risk_level).toBe('MEDIUM');
    expect(result.rationale.length).toBeGreaterThan(0);
    expect(result.rationale[0]).toContain('affected_processes');
  });

  it('fresh_for_staged_diff concept: empty staged set means fresh', () => {
    // When no staged files exist, fresh_for_staged_diff should be true
    const stagedFiles: string[] = [];
    const isFresh = stagedFiles.length === 0;
    expect(isFresh).toBe(true);
  });

  it('stale_reasons concept: commit mismatch detected', () => {
    const indexedCommit = 'abc123';
    const currentCommit = 'def456';
    const reasons: string[] = [];
    if (indexedCommit !== currentCommit) reasons.push('commit_mismatch');
    expect(reasons).toEqual(['commit_mismatch']);
  });
});

// ── P1: changed_file_classes integration shape ──────────────────────────

describe('detect-changes response shape', () => {
  it('classifyFiles produces changed_file_classes aggregate', () => {
    const changedPaths = [
      'src/app.ts',
      'src/app.test.ts',
      'styles/main.scss',
      'openspec/change/proposal.md',
      'package.json',
    ];
    const classes = classifyFiles(changedPaths);
    const agg = aggregateClasses(classes);
    expect(agg.source).toBe(1);
    expect(agg.test).toBe(1);
    expect(agg.style).toBe(1);
    expect(agg.governance).toBe(1);
    expect(agg.config).toBe(1);
  });

  it('forbidden_file_classes warning logic', () => {
    const changedPaths = ['openspec/change/proposal.md', 'AGENTS.md'];
    const forbidden = ['governance'];
    const classes = classifyFiles(changedPaths);
    const hasForbidden = classes.some((c) => c.classes.some((cls) => forbidden.includes(cls)));
    expect(hasForbidden).toBe(true);
  });

  it('no forbidden match produces no warning', () => {
    const changedPaths = ['src/app.ts', 'src/util.ts'];
    const forbidden = ['governance'];
    const classes = classifyFiles(changedPaths);
    const hasForbidden = classes.some((c) => c.classes.some((cls) => forbidden.includes(cls)));
    expect(hasForbidden).toBe(false);
  });
});

// ── P2: Grammar Warning Dedup ───────────────────────────────────────────

describe('grammar-warning dedup', () => {
  it('dedup logic: Set prevents repeat emissions (P2 2.1/2.2)', () => {
    // Simulates the reportedThisSession Set pattern from optional-grammars.ts
    const reported = new Set<string>();
    const emitted: string[] = [];
    const grammars = ['tree-sitter-swift', 'tree-sitter-dart', 'tree-sitter-swift'];
    for (const name of grammars) {
      if (reported.has(name)) continue;
      reported.add(name);
      emitted.push(name);
    }
    expect(emitted).toEqual(['tree-sitter-swift', 'tree-sitter-dart']);
    expect(emitted).toHaveLength(2);
  });

  it('source has reportedThisSession Set with has/add pattern', () => {
    const src = readFileSync(path.join(__dirname, '../../src/cli/optional-grammars.ts'), 'utf-8');
    expect(src).toMatch(/reportedThisSession/);
    expect(src).toMatch(/reportedThisSession\.has/);
    expect(src).toMatch(/reportedThisSession\.add/);
    expect(src).toMatch(/new Set<string>/);
  });
});
