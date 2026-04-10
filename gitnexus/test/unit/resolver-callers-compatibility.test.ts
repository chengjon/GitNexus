import { describe, expect, it } from 'vitest';

import { SupportedLanguages } from '../../src/config/supported-languages.js';
import { resolveCSharpImport } from '../../src/core/ingestion/resolvers/csharp.js';
import { resolvePhpImport } from '../../src/core/ingestion/resolvers/php.js';
import { resolveImportPath } from '../../src/core/ingestion/resolvers/standard.js';

describe('resolver caller compatibility paths without suffix index', () => {
  it('keeps generic import resolution working through the no-index suffix fallback', () => {
    const allFileList = [
      'workspace/packages/app/src/Feature/Auth/LoginForm.tsx',
    ];
    const normalizedFileList = allFileList.map((filePath) => filePath.replace(/\\/g, '/'));

    const resolved = resolveImportPath(
      'workspace/packages/app/src/pages/Home.tsx',
      '@/Feature/Auth/LoginForm',
      new Set(allFileList),
      allFileList,
      normalizedFileList,
      new Map(),
      SupportedLanguages.TypeScript,
      {
        aliases: new Map([['@/', 'src/']]),
        baseUrl: 'packages/app',
      },
    );

    expect(resolved).toBe('workspace/packages/app/src/Feature/Auth/LoginForm.tsx');
  });

  it('keeps PHP suffix fallback case-insensitive when composer metadata is absent', () => {
    const allFileList = [
      'services/App/Http/Controllers/UserController.php',
    ];
    const normalizedFileList = [
      'services/app/http/controllers/usercontroller.php',
    ];

    const resolved = resolvePhpImport(
      'app\\http\\controllers\\usercontroller',
      null,
      new Set(allFileList),
      normalizedFileList,
      allFileList,
    );

    expect(resolved).toBe('services/App/Http/Controllers/UserController.php');
  });

  it('keeps C# namespace directory resolution working through the linear-scan fallback', () => {
    const allFileList = [
      'services/src/Models/Order.cs',
      'services/src/Models/User.cs',
      'services/src/Models/Nested/Ignored.cs',
    ];
    const normalizedFileList = allFileList.map((filePath) => filePath.replace(/\\/g, '/'));

    const resolved = resolveCSharpImport(
      'MyApp.Models',
      [{ rootNamespace: 'MyApp', projectDir: 'src' }],
      normalizedFileList,
      allFileList,
    );

    expect(resolved).toEqual([
      'services/src/Models/Order.cs',
      'services/src/Models/User.cs',
    ]);
  });
});
