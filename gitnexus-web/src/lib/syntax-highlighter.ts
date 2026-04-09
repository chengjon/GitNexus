import SyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import diff from 'react-syntax-highlighter/dist/esm/languages/prism/diff';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import swift from 'react-syntax-highlighter/dist/esm/languages/prism/swift';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';

const registeredLanguages = {
  bash,
  c,
  cpp,
  csharp,
  css,
  diff,
  go,
  java,
  javascript,
  json,
  jsx,
  markdown,
  php,
  python,
  rust,
  sql,
  swift,
  tsx,
  typescript,
  yaml,
};

for (const [name, grammar] of Object.entries(registeredLanguages)) {
  SyntaxHighlighter.registerLanguage(name, grammar);
}

SyntaxHighlighter.alias('bash', ['shell', 'sh', 'zsh']);
SyntaxHighlighter.alias('cpp', ['c++']);
SyntaxHighlighter.alias('csharp', ['cs']);
SyntaxHighlighter.alias('javascript', ['js']);
SyntaxHighlighter.alias('markdown', ['md']);
SyntaxHighlighter.alias('python', ['py']);
SyntaxHighlighter.alias('typescript', ['ts']);
SyntaxHighlighter.alias('yaml', ['yml']);

export const baseSyntaxHighlighterTheme = {
  ...vscDarkPlus,
  'pre[class*="language-"]': {
    ...vscDarkPlus['pre[class*="language-"]'],
    background: '#0a0a10',
    margin: 0,
    fontSize: '13px',
    lineHeight: '1.6',
  },
  'code[class*="language-"]': {
    ...vscDarkPlus['code[class*="language-"]'],
    background: 'transparent',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  },
};

const languageAliases: Record<string, string> = {
  'c++': 'cpp',
  cs: 'csharp',
  js: 'javascript',
  md: 'markdown',
  py: 'python',
  shell: 'bash',
  sh: 'bash',
  ts: 'typescript',
  yml: 'yaml',
  zsh: 'bash',
};

export const normalizeCodeLanguage = (language?: string | null): string => {
  if (!language) {
    return 'text';
  }

  const normalized = language.trim().toLowerCase();
  return languageAliases[normalized] ?? normalized;
};

export const detectCodeLanguageFromPath = (filePath?: string | null): string => {
  if (!filePath) {
    return 'text';
  }

  const normalized = filePath.toLowerCase();

  if (normalized.endsWith('.tsx')) return 'tsx';
  if (normalized.endsWith('.ts')) return 'typescript';
  if (normalized.endsWith('.jsx')) return 'jsx';
  if (normalized.endsWith('.js') || normalized.endsWith('.mjs') || normalized.endsWith('.cjs')) return 'javascript';
  if (normalized.endsWith('.py')) return 'python';
  if (normalized.endsWith('.java')) return 'java';
  if (normalized.endsWith('.go')) return 'go';
  if (normalized.endsWith('.rs')) return 'rust';
  if (normalized.endsWith('.sql')) return 'sql';
  if (normalized.endsWith('.swift')) return 'swift';
  if (normalized.endsWith('.php')) return 'php';
  if (normalized.endsWith('.json')) return 'json';
  if (normalized.endsWith('.yaml') || normalized.endsWith('.yml')) return 'yaml';
  if (normalized.endsWith('.md') || normalized.endsWith('.markdown')) return 'markdown';
  if (normalized.endsWith('.css')) return 'css';
  if (normalized.endsWith('.diff') || normalized.endsWith('.patch')) return 'diff';
  if (normalized.endsWith('.sh') || normalized.endsWith('.bash') || normalized.endsWith('.zsh')) return 'bash';
  if (normalized.endsWith('.cpp') || normalized.endsWith('.cxx') || normalized.endsWith('.cc')) return 'cpp';
  if (normalized.endsWith('.c')) return 'c';
  if (normalized.endsWith('.cs')) return 'csharp';

  return 'text';
};

export { SyntaxHighlighter };
