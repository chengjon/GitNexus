import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SupportedLanguages } from '../../src/config/supported-languages.js';

const {
  buildSuffixIndexMock,
  resolveImportPathMock,
  resolveCSharpImportMock,
  resolveCSharpNamespaceDirMock,
  loadCSharpProjectConfigMock,
  extractNamedBindingsMock,
  loadParserMock,
  loadLanguageMock,
  isLanguageAvailableMock,
  queryMatches,
  parseMock,
} = vi.hoisted(() => ({
  buildSuffixIndexMock: vi.fn(() => ({ kind: 'suffix-index' })),
  resolveImportPathMock: vi.fn(() => 'src/Feature/Auth/LoginForm.tsx'),
  resolveCSharpImportMock: vi.fn(() => []),
  resolveCSharpNamespaceDirMock: vi.fn(() => null),
  loadCSharpProjectConfigMock: vi.fn(async () => []),
  extractNamedBindingsMock: vi.fn(() => undefined),
  loadParserMock: vi.fn(),
  loadLanguageMock: vi.fn(async () => undefined),
  isLanguageAvailableMock: vi.fn(() => true),
  queryMatches: [] as any[],
  parseMock: vi.fn(() => ({ rootNode: { type: 'program', hasError: false } })),
}));

vi.mock('tree-sitter', () => ({
  default: {
    Query: class QueryMock {
      matches() {
        return queryMatches;
      }
    },
  },
}));

vi.mock('../../src/core/tree-sitter/parser-loader.js', () => ({
  loadParser: loadParserMock,
  loadLanguage: loadLanguageMock,
  isLanguageAvailable: isLanguageAvailableMock,
}));

vi.mock('../../src/core/ingestion/tree-sitter-queries.js', () => ({
  LANGUAGE_QUERIES: {
    [SupportedLanguages.TypeScript]: '(import_statement) @import',
  },
}));

vi.mock('../../src/core/ingestion/language-config.js', () => ({
  loadTsconfigPaths: vi.fn(async () => null),
  loadGoModulePath: vi.fn(async () => null),
  loadComposerConfig: vi.fn(async () => null),
  loadCSharpProjectConfig: loadCSharpProjectConfigMock,
  loadSwiftPackageConfig: vi.fn(async () => null),
}));

vi.mock('../../src/core/ingestion/utils.js', () => ({
  getLanguageFromFilename: vi.fn(() => SupportedLanguages.TypeScript),
  isVerboseIngestionEnabled: vi.fn(() => false),
  yieldToEventLoop: vi.fn(async () => undefined),
}));

vi.mock('../../src/core/ingestion/named-binding-extraction.js', () => ({
  extractNamedBindings: extractNamedBindingsMock,
}));

vi.mock('../../src/core/ingestion/vue-sfc.js', () => ({
  normalizeContentForParsing: vi.fn((_filePath: string, content: string) => content),
}));

vi.mock('../../src/core/ingestion/constants.js', () => ({
  getTreeSitterBufferSize: vi.fn(() => 1024),
}));

vi.mock('../../src/core/ingestion/resolvers/index.js', () => ({
  buildSuffixIndex: buildSuffixIndexMock,
  resolveImportPath: resolveImportPathMock,
  appendKotlinWildcard: vi.fn((value: string) => value),
  KOTLIN_EXTENSIONS: [],
  resolveJvmWildcard: vi.fn(() => []),
  resolveJvmMemberImport: vi.fn(() => null),
  resolveGoPackageDir: vi.fn(() => null),
  resolveGoPackage: vi.fn(() => []),
  resolveCSharpImport: resolveCSharpImportMock,
  resolveCSharpNamespaceDir: resolveCSharpNamespaceDirMock,
  resolvePhpImport: vi.fn(() => null),
  resolveRustImport: vi.fn(() => null),
}));

import { createKnowledgeGraph } from '../../src/core/graph/graph.js';
import { createASTCache } from '../../src/core/ingestion/ast-cache.js';
import {
  buildImportResolutionContext,
  createImportMap,
  createNamedImportMap,
  createPackageMap,
  processImports,
  processImportsFromExtracted,
} from '../../src/core/ingestion/import-processor.js';

describe('import-processor indexed suffix resolution', () => {
  beforeEach(() => {
    buildSuffixIndexMock.mockClear();
    resolveImportPathMock.mockClear();
    loadLanguageMock.mockClear();
    isLanguageAvailableMock.mockClear();
    resolveCSharpImportMock.mockClear();
    resolveCSharpNamespaceDirMock.mockClear();
    loadCSharpProjectConfigMock.mockClear();
    loadCSharpProjectConfigMock.mockResolvedValue([]);
    extractNamedBindingsMock.mockClear();
    extractNamedBindingsMock.mockReturnValue(undefined);
    queryMatches.length = 0;
    parseMock.mockClear();
    loadParserMock.mockResolvedValue({
      parse: parseMock,
      getLanguage: vi.fn(() => ({})),
    });
  });

  it('builds a suffix index in processImports and passes it to resolveImportPath', async () => {
    queryMatches.push({
      captures: [
        { name: 'import', node: { text: "import LoginForm from '@/Feature/Auth/LoginForm'" } },
        { name: 'import.source', node: { text: "'@/Feature/Auth/LoginForm'" } },
      ],
    });

    const importMap = createImportMap();
    await processImports(
      createKnowledgeGraph(),
      [{ path: 'src/pages/Home.tsx', content: "import LoginForm from '@/Feature/Auth/LoginForm'" }],
      createASTCache(),
      importMap,
      undefined,
      '/tmp/repo',
      ['src/pages/Home.tsx', 'src/Feature/Auth/LoginForm.tsx'],
    );

    expect(buildSuffixIndexMock).toHaveBeenCalledTimes(1);
    const builtIndex = buildSuffixIndexMock.mock.results[0].value;
    expect(resolveImportPathMock).toHaveBeenCalledTimes(1);
    expect(resolveImportPathMock.mock.calls[0][8]).toBe(builtIndex);
    expect(importMap.get('src/pages/Home.tsx')).toEqual(new Set(['src/Feature/Auth/LoginForm.tsx']));
  });

  it('reuses a prebuilt suffix index in processImportsFromExtracted', async () => {
    const prebuiltCtx = buildImportResolutionContext([
      'src/pages/Home.tsx',
      'src/Feature/Auth/LoginForm.tsx',
    ]);

    buildSuffixIndexMock.mockClear();
    resolveImportPathMock.mockClear();

    const importMap = createImportMap();
    await processImportsFromExtracted(
      createKnowledgeGraph(),
      [{ path: 'src/pages/Home.tsx' }, { path: 'src/Feature/Auth/LoginForm.tsx' }],
      [{
        filePath: 'src/pages/Home.tsx',
        rawImportPath: '@/Feature/Auth/LoginForm',
        language: SupportedLanguages.TypeScript,
      }],
      importMap,
      undefined,
      '/tmp/repo',
      prebuiltCtx,
    );

    expect(buildSuffixIndexMock).not.toHaveBeenCalled();
    expect(resolveImportPathMock).toHaveBeenCalledTimes(1);
    expect(resolveImportPathMock.mock.calls[0][8]).toBe(prebuiltCtx.suffixIndex);
    expect(importMap.get('src/pages/Home.tsx')).toEqual(new Set(['src/Feature/Auth/LoginForm.tsx']));
  });

  it('records named bindings during processImports when AST extraction returns bindings', async () => {
    queryMatches.push({
      captures: [
        { name: 'import', node: { text: "import { LoginForm } from '@/Feature/Auth/LoginForm'" } },
        { name: 'import.source', node: { text: "'@/Feature/Auth/LoginForm'" } },
      ],
    });
    extractNamedBindingsMock.mockReturnValue([{ local: 'LoginForm', exported: 'LoginForm' }]);

    const importMap = createImportMap();
    const namedImportMap = createNamedImportMap();

    await processImports(
      createKnowledgeGraph(),
      [{ path: 'src/pages/Home.tsx', content: "import { LoginForm } from '@/Feature/Auth/LoginForm'" }],
      createASTCache(),
      importMap,
      undefined,
      '/tmp/repo',
      ['src/pages/Home.tsx', 'src/Feature/Auth/LoginForm.tsx'],
      undefined,
      namedImportMap,
    );

    expect(extractNamedBindingsMock).toHaveBeenCalledTimes(1);
    expect(namedImportMap.get('src/pages/Home.tsx')?.get('LoginForm')).toEqual({
      sourcePath: 'src/Feature/Auth/LoginForm.tsx',
      exportedName: 'LoginForm',
    });
  });

  it('builds a suffix index when processImportsFromExtracted is called without a prebuilt context', async () => {
    const importMap = createImportMap();
    await processImportsFromExtracted(
      createKnowledgeGraph(),
      [{ path: 'src/pages/Home.tsx' }, { path: 'src/Feature/Auth/LoginForm.tsx' }],
      [{
        filePath: 'src/pages/Home.tsx',
        rawImportPath: '@/Feature/Auth/LoginForm',
        language: SupportedLanguages.TypeScript,
      }],
      importMap,
    );

    expect(buildSuffixIndexMock).toHaveBeenCalledTimes(1);
    const builtIndex = buildSuffixIndexMock.mock.results[0].value;
    expect(resolveImportPathMock).toHaveBeenCalledTimes(1);
    expect(resolveImportPathMock.mock.calls[0][8]).toBe(builtIndex);
  });

  it('records named bindings when a single extracted import resolves to one file', async () => {
    const importMap = createImportMap();
    const namedImportMap = createNamedImportMap();

    await processImportsFromExtracted(
      createKnowledgeGraph(),
      [{ path: 'src/pages/Home.tsx' }, { path: 'src/Feature/Auth/LoginForm.tsx' }],
      [{
        filePath: 'src/pages/Home.tsx',
        rawImportPath: '@/Feature/Auth/LoginForm',
        language: SupportedLanguages.TypeScript,
        namedBindings: [{ local: 'LoginForm', exported: 'LoginForm' }],
      }],
      importMap,
      undefined,
      '/tmp/repo',
      undefined,
      undefined,
      namedImportMap,
    );

    expect(importMap.get('src/pages/Home.tsx')).toEqual(new Set(['src/Feature/Auth/LoginForm.tsx']));
    expect(namedImportMap.get('src/pages/Home.tsx')?.get('LoginForm')).toEqual({
      sourcePath: 'src/Feature/Auth/LoginForm.tsx',
      exportedName: 'LoginForm',
    });
  });

  it('stores package directory suffixes instead of expanding package imports into ImportMap', async () => {
    resolveCSharpImportMock.mockReturnValue([
      'src/Services/UserService.cs',
      'src/Services/AuthService.cs',
    ]);
    resolveCSharpNamespaceDirMock.mockReturnValue('/src/Services/');
    loadCSharpProjectConfigMock.mockResolvedValue([{ rootDir: 'src', baseNamespace: 'MyApp' }]);

    const importMap = createImportMap();
    const packageMap = createPackageMap();

    await processImportsFromExtracted(
      createKnowledgeGraph(),
      [
        { path: 'src/App.cs' },
        { path: 'src/Services/UserService.cs' },
        { path: 'src/Services/AuthService.cs' },
      ],
      [{
        filePath: 'src/App.cs',
        rawImportPath: 'MyApp.Services',
        language: SupportedLanguages.CSharp,
      }],
      importMap,
      undefined,
      '/tmp/repo',
      undefined,
      packageMap,
    );

    expect(importMap.has('src/App.cs')).toBe(false);
    expect(packageMap.get('src/App.cs')).toEqual(new Set(['/src/Services/']));
  });
});
