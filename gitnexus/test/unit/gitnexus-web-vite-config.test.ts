import { describe, expect, it } from 'vitest';

const ONNX_EXTERNAL_WASM_CONDITION = 'onnxruntime-web-use-extern-wasm';
const MERMAID_ALIAS_REPLACEMENT = 'node_modules/mermaid/dist/mermaid.esm.min.mjs';
const EMPTY_BROWSER_MODULE = 'src/shims/empty-browser-module.js';

describe('gitnexus-web vite config parity', () => {
  it('keeps app and inline Vite configs aligned on the ONNX external-wasm resolution condition', async () => {
    const [{ default: appConfig }, { default: inlineConfig }] = await Promise.all([
      import('../../../gitnexus-web/vite.config.ts'),
      import('../../../gitnexus-web/vite.inline.config.mjs'),
    ]);

    const appConditions = appConfig.resolve?.conditions ?? [];
    const inlineConditions = inlineConfig.resolve?.conditions ?? [];

    expect(appConditions).toContain(ONNX_EXTERNAL_WASM_CONDITION);
    expect(inlineConditions).toContain(ONNX_EXTERNAL_WASM_CONDITION);
    expect(appConditions).toEqual(inlineConditions);
  });

  it('keeps the mermaid alias scoped to the bare package name so subpath imports keep working', async () => {
    const [{ default: appConfig }, { default: inlineConfig }] = await Promise.all([
      import('../../../gitnexus-web/vite.config.ts'),
      import('../../../gitnexus-web/vite.inline.config.mjs'),
    ]);

    const appAliasEntries = Array.isArray(appConfig.resolve?.alias)
      ? appConfig.resolve.alias
      : [];
    const inlineAliasEntries = Array.isArray(inlineConfig.resolve?.alias)
      ? inlineConfig.resolve.alias
      : [];

    const findMermaidAlias = (entries: Array<{ find: unknown; replacement: string }>) => {
      return entries.find((entry) => {
        return entry.find instanceof RegExp
          && entry.find.source === '^mermaid$'
          && entry.replacement.includes(MERMAID_ALIAS_REPLACEMENT);
      });
    };

    expect(findMermaidAlias(appAliasEntries)).toBeDefined();
    expect(findMermaidAlias(inlineAliasEntries)).toBeDefined();
  });

  it('keeps web-tree-sitter browser shims aligned in app and inline Vite configs', async () => {
    const [{ default: appConfig }, { default: inlineConfig }] = await Promise.all([
      import('../../../gitnexus-web/vite.config.ts'),
      import('../../../gitnexus-web/vite.inline.config.mjs'),
    ]);

    const appAliasEntries = Array.isArray(appConfig.resolve?.alias)
      ? appConfig.resolve.alias
      : [];
    const inlineAliasEntries = Array.isArray(inlineConfig.resolve?.alias)
      ? inlineConfig.resolve.alias
      : [];

    const findBrowserShimAlias = (
      entries: Array<{ find: unknown; replacement: string }>,
      source: string,
    ) => {
      return entries.find((entry) => {
        return entry.find instanceof RegExp
          && entry.find.source === `^${source}$`
          && entry.replacement.includes(EMPTY_BROWSER_MODULE);
      });
    };

    expect(findBrowserShimAlias(appAliasEntries, 'fs')).toBeDefined();
    expect(findBrowserShimAlias(appAliasEntries, 'path')).toBeDefined();
    expect(findBrowserShimAlias(inlineAliasEntries, 'fs')).toBeDefined();
    expect(findBrowserShimAlias(inlineAliasEntries, 'path')).toBeDefined();
  });

  it('suppresses only the known web-tree-sitter eval warning in app and inline builds', async () => {
    const [{ default: appConfig }, { default: inlineConfig }] = await Promise.all([
      import('../../../gitnexus-web/vite.config.ts'),
      import('../../../gitnexus-web/vite.inline.config.mjs'),
    ]);

    const appOnWarn = appConfig.build?.rollupOptions?.onwarn;
    const inlineOnWarn = inlineConfig.build?.rollupOptions?.onwarn;

    expect(appOnWarn).toBeTypeOf('function');
    expect(inlineOnWarn).toBeTypeOf('function');

    const evalWarning = {
      code: 'EVAL',
      id: '/opt/claude/GitNexus/gitnexus-web/node_modules/web-tree-sitter/tree-sitter.js',
      message: 'Use of eval in "node_modules/web-tree-sitter/tree-sitter.js" is strongly discouraged',
    };
    const unrelatedWarning = {
      code: 'SOURCEMAP_ERROR',
      id: '/opt/claude/GitNexus/gitnexus-web/node_modules/some-package/index.js',
      message: 'Something else',
    };

    const appForwarded: Array<typeof evalWarning> = [];
    const inlineForwarded: Array<typeof evalWarning> = [];

    appOnWarn!(evalWarning, (warning) => {
      appForwarded.push(warning as typeof evalWarning);
    });
    inlineOnWarn!(evalWarning, (warning) => {
      inlineForwarded.push(warning as typeof evalWarning);
    });

    expect(appForwarded).toEqual([]);
    expect(inlineForwarded).toEqual([]);

    appOnWarn!(unrelatedWarning, (warning) => {
      appForwarded.push(warning as typeof evalWarning);
    });
    inlineOnWarn!(unrelatedWarning, (warning) => {
      inlineForwarded.push(warning as typeof evalWarning);
    });

    expect(appForwarded).toEqual([unrelatedWarning]);
    expect(inlineForwarded).toEqual([unrelatedWarning]);
  });
});
