import { describe, expect, it } from 'vitest';

import { SupportedLanguages } from '../../src/config/supported-languages.js';
import { buildSuffixIndex } from '../../src/core/ingestion/resolvers/index.js';
import { resolveLanguageImport } from '../../src/core/ingestion/import-resolution-dispatch.js';

function makeResolveCtx(allFileList: string[], allFilePaths = new Set(allFileList)) {
  const normalizedFileList = allFileList.map((entry) => entry.replace(/\\/g, '/'));
  return {
    allFilePaths,
    allFileList,
    normalizedFileList,
    index: buildSuffixIndex(normalizedFileList, allFileList),
    resolveCache: new Map<string, string | null>(),
  };
}

describe('import resolution dispatch', () => {
  it('resolves Kotlin wildcard imports to Kotlin files', () => {
    const ctx = makeResolveCtx([
      'src/com/example/AuthService.kt',
      'src/com/example/UserRepo.kt',
    ]);

    const result = resolveLanguageImport(
      'src/main.kt',
      'com.example.*',
      SupportedLanguages.Kotlin,
      {
        tsconfigPaths: null,
        goModule: null,
        composerConfig: null,
        swiftPackageConfig: null,
        csharpConfigs: [],
      },
      ctx,
    );

    expect(result).toEqual({
      kind: 'files',
      files: ['src/com/example/AuthService.kt', 'src/com/example/UserRepo.kt'],
    });
  });

  it('resolves Go module imports to package results', () => {
    const ctx = makeResolveCtx([
      'internal/auth/service.go',
      'internal/auth/types.go',
    ]);

    const result = resolveLanguageImport(
      'cmd/server/main.go',
      'github.com/acme/project/internal/auth',
      SupportedLanguages.Go,
      {
        tsconfigPaths: null,
        goModule: { modulePath: 'github.com/acme/project', repoRoot: '/tmp/repo' },
        composerConfig: null,
        swiftPackageConfig: null,
        csharpConfigs: [],
      } as any,
      ctx,
    );

    expect(result).toEqual({
      kind: 'package',
      files: ['internal/auth/service.go', 'internal/auth/types.go'],
      dirSuffix: '/internal/auth/',
    });
  });

  it('resolves Swift module imports through Swift package targets', () => {
    const ctx = makeResolveCtx([
      'Sources/Auth/Login.swift',
      'Sources/Auth/Session.swift',
      'Sources/Core/App.swift',
    ]);

    const result = resolveLanguageImport(
      'Sources/Core/App.swift',
      'Auth',
      SupportedLanguages.Swift,
      {
        tsconfigPaths: null,
        goModule: null,
        composerConfig: null,
        swiftPackageConfig: {
          targets: new Map([['Auth', 'Sources/Auth']]),
        },
        csharpConfigs: [],
      } as any,
      ctx,
    );

    expect(result).toEqual({
      kind: 'files',
      files: ['Sources/Auth/Login.swift', 'Sources/Auth/Session.swift'],
    });
  });

  it('resolves PHP namespace imports via composer config', () => {
    const ctx = makeResolveCtx([
      'app/Models/User.php',
    ], new Set(['app/Models/User.php']));

    const result = resolveLanguageImport(
      'app/Http/Controller.php',
      'App\\Models\\User',
      SupportedLanguages.PHP,
      {
        tsconfigPaths: null,
        goModule: null,
        composerConfig: {
          psr4: new Map([['App\\', 'app/']]),
        },
        swiftPackageConfig: null,
        csharpConfigs: [],
      } as any,
      ctx,
    );

    expect(result).toEqual({
      kind: 'files',
      files: ['app/Models/User.php'],
    });
  });
});
