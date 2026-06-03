/**
 * File Classification
 *
 * Classifies changed files into semantic categories (source, test, style,
 * config, etc.) to support governance gates in detect_changes.
 */

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

export function classifyFile(
  filePath: string,
  extraRules?: ClassificationRule[],
): FileClassification {
  const rules = extraRules ? [...DEFAULT_RULES, ...extraRules] : DEFAULT_RULES;
  const normalized = filePath.replace(/\\/g, '/');
  const classes: FileClass[] = [];
  for (const rule of rules) {
    if (rule.pattern.test(normalized)) {
      for (const c of rule.classes) {
        if (!classes.includes(c)) classes.push(c);
      }
    }
  }
  if (classes.length === 0) classes.push('source');
  return { path: filePath, classes };
}

export function classifyFiles(
  filePaths: string[],
  extraRules?: ClassificationRule[],
): FileClassification[] {
  return filePaths.map((p) => classifyFile(p, extraRules));
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
