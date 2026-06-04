/**
 * File Classification
 *
 * Classifies changed files into semantic categories (source, test, style,
 * config, etc.) to support governance gates in detect_changes.
 */

import fs from 'fs/promises';
import path from 'path';

export type FileClass =
  | 'source'
  | 'test'
  | 'config'
  | 'build'
  | 'style'
  | 'documentation'
  | 'governance'
  | 'data'
  | 'generated'
  | 'script'
  | 'asset'
  | 'unknown';

export interface FileClassification {
  path: string;
  classes: FileClass[];
}

export interface ClassificationRule {
  pattern: RegExp;
  classes: FileClass[];
}

export interface FileClassifierOptions {
  extraRules?: ClassificationRule[];
  overrideRules?: ClassificationRule[];
}

export interface RepoClassificationRuleConfig {
  pattern: string;
  flags?: string;
  classes: FileClass[];
}

const FILE_CLASSES: readonly FileClass[] = [
  'source',
  'test',
  'config',
  'build',
  'style',
  'documentation',
  'governance',
  'data',
  'generated',
  'script',
  'asset',
  'unknown',
];

const FILE_CLASS_SET = new Set<string>(FILE_CLASSES);

const DEFAULT_RULES: ClassificationRule[] = [
  // Test patterns
  { pattern: /(^|\/)(__tests__|__mocks__|spec|tests?|fixtures?)\//i, classes: ['test'] },
  { pattern: /\.(test|spec)\.(ts|tsx|js|jsx|py|rb|go|rs|java|kt|vue)$/i, classes: ['test'] },
  { pattern: /_test\.(go|py|rb)$/i, classes: ['test'] },
  { pattern: /\/conftest\.py$/i, classes: ['test'] },

  // Governance patterns
  { pattern: /(^|\/)openspec\//i, classes: ['governance'] },
  {
    pattern: /(^|\/)(DEVELOPMENT_RULES|DoD|GUARDRAILS|CONTRIBUTING|TESTING|ARCHITECTURE)\.md$/i,
    classes: ['governance'],
  },
  { pattern: /(^|\/)AGENTS\.md$/i, classes: ['governance'] },
  { pattern: /(^|\/)CLAUDE\.md$/i, classes: ['governance'] },

  // Config patterns
  { pattern: /\.(json|yaml|yml|toml|ini|rc)$/i, classes: ['config'] },
  { pattern: /(^|\/|\.)env/i, classes: ['config'] },
  {
    pattern: /(^|\/)(tsconfig|jsconfig|eslint|prettier|babel|vitest|jest)\./i,
    classes: ['config'],
  },

  // Style patterns
  { pattern: /\.(css|scss|sass|less|styl)$/i, classes: ['style'] },

  // Build patterns
  { pattern: /(^|\/)(Dockerfile|Makefile|docker-compose|Jenkinsfile)/i, classes: ['build'] },
  { pattern: /\.(dockerfile|cmake|gradle)$/i, classes: ['build'] },
  { pattern: /(^|\/)(webpack|vite|rollup|esbuild)\./i, classes: ['build'] },

  // Documentation
  { pattern: /\.(md|mdx|rst|adoc)$/i, classes: ['documentation'] },

  // Data
  { pattern: /\.(sql|graphql|proto|thrift)$/i, classes: ['data'] },

  // Script
  { pattern: /\.(sh|bash|zsh|fish|ps1|bat)$/i, classes: ['script'] },

  // Generated
  { pattern: /\.(generated|auto|min)\./i, classes: ['generated'] },
  { pattern: /(^|\/)(dist|build|out|\.next)\//i, classes: ['generated'] },

  // Asset
  { pattern: /\.(png|jpg|jpeg|gif|svg|ico|webp|avif)$/i, classes: ['asset'] },
  { pattern: /\.(woff|woff2|ttf|eot|otf)$/i, classes: ['asset'] },
];

function isFileClass(value: unknown): value is FileClass {
  return typeof value === 'string' && FILE_CLASS_SET.has(value);
}

function collectMatchingClasses(normalizedPath: string, rules: ClassificationRule[]): FileClass[] {
  const classes: FileClass[] = [];
  for (const rule of rules) {
    if (rule.pattern.test(normalizedPath)) {
      for (const c of rule.classes) {
        if (!classes.includes(c)) classes.push(c);
      }
    }
  }
  return classes;
}

function normalizeOptions(
  rulesOrOptions?: ClassificationRule[] | FileClassifierOptions,
): FileClassifierOptions {
  if (Array.isArray(rulesOrOptions)) return { extraRules: rulesOrOptions };
  return rulesOrOptions ?? {};
}

export function classifyFile(
  filePath: string,
  rulesOrOptions?: ClassificationRule[] | FileClassifierOptions,
): FileClassification {
  const options = normalizeOptions(rulesOrOptions);
  const normalized = filePath.replace(/\\/g, '/');

  const overrideClasses = collectMatchingClasses(normalized, options.overrideRules ?? []);
  if (overrideClasses.length > 0) {
    return { path: filePath, classes: overrideClasses };
  }

  const rules = options.extraRules ? [...DEFAULT_RULES, ...options.extraRules] : DEFAULT_RULES;
  const classes = collectMatchingClasses(normalized, rules);
  if (classes.length === 0) classes.push('source');
  return { path: filePath, classes };
}

export function classifyFiles(
  filePaths: string[],
  rulesOrOptions?: ClassificationRule[] | FileClassifierOptions,
): FileClassification[] {
  return filePaths.map((p) => classifyFile(p, rulesOrOptions));
}

export function aggregateClasses(classifications: FileClassification[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of classifications) {
    for (const cls of c.classes) {
      counts[cls] = (counts[cls] ?? 0) + 1;
    }
  }
  return counts;
}

export async function loadRepoFileClassificationRules(
  repoPath: string,
): Promise<ClassificationRule[]> {
  let raw: string;
  try {
    raw = await fs.readFile(path.join(repoPath, '.gitnexus', 'config.json'), 'utf8');
  } catch {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const rules = (parsed as any)?.fileClassification?.rules;
  if (!Array.isArray(rules)) return [];

  const compiled: ClassificationRule[] = [];
  for (const rule of rules as RepoClassificationRuleConfig[]) {
    if (!rule || typeof rule.pattern !== 'string' || !Array.isArray(rule.classes)) continue;
    const classes = rule.classes.filter(isFileClass);
    if (classes.length === 0) continue;
    try {
      compiled.push({
        pattern: new RegExp(rule.pattern, typeof rule.flags === 'string' ? rule.flags : 'i'),
        classes,
      });
    } catch {
      // Invalid repo-local rules are ignored; detect_changes classification is best-effort.
    }
  }

  return compiled;
}
