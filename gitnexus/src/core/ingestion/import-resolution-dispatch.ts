import { SupportedLanguages } from '../../config/supported-languages.js';
import {
  KOTLIN_EXTENSIONS,
  appendKotlinWildcard,
  resolveCSharpImport,
  resolveCSharpNamespaceDir,
  resolveGoPackage,
  resolveGoPackageDir,
  resolveImportPath,
  resolveJvmMemberImport,
  resolveJvmWildcard,
  resolvePhpImport,
  resolveRustImport,
} from './resolvers/index.js';
import type {
  CSharpProjectConfig,
  ComposerConfig,
  GoModuleConfig,
  SuffixIndex,
  TsconfigPaths,
} from './resolvers/index.js';
import type { SwiftPackageConfig } from './language-config.js';

/** Bundled language-specific configs loaded once per ingestion run. */
export interface LanguageConfigs {
  tsconfigPaths: TsconfigPaths | null;
  goModule: GoModuleConfig | null;
  composerConfig: ComposerConfig | null;
  swiftPackageConfig: SwiftPackageConfig | null;
  csharpConfigs: CSharpProjectConfig[];
}

/** Context for import path resolution (file lists, indexes, cache). */
export interface ResolveCtx {
  allFilePaths: Set<string>;
  allFileList: string[];
  normalizedFileList: string[];
  index: SuffixIndex;
  resolveCache: Map<string, string | null>;
}

/**
 * Result of resolving an import via language-specific dispatch.
 * - 'files': resolved to one or more files → add to ImportMap
 * - 'package': resolved to a directory → add graph edges + store dirSuffix in PackageMap
 * - null: no resolution (external dependency, etc.)
 */
export type ImportResult =
  | { kind: 'files'; files: string[] }
  | { kind: 'package'; files: string[]; dirSuffix: string }
  | null;

/**
 * Shared language dispatch for import resolution.
 * Used by both processImports and processImportsFromExtracted.
 */
export function resolveLanguageImport(
  filePath: string,
  rawImportPath: string,
  language: SupportedLanguages,
  configs: LanguageConfigs,
  ctx: ResolveCtx,
): ImportResult {
  const { allFilePaths, allFileList, normalizedFileList, index, resolveCache } = ctx;
  const { tsconfigPaths, goModule, composerConfig, swiftPackageConfig, csharpConfigs } = configs;

  if (language === SupportedLanguages.Java || language === SupportedLanguages.Kotlin) {
    const exts = language === SupportedLanguages.Java ? ['.java'] : KOTLIN_EXTENSIONS;

    if (rawImportPath.endsWith('.*')) {
      const matchedFiles = resolveJvmWildcard(rawImportPath, normalizedFileList, allFileList, exts, index);
      if (matchedFiles.length === 0 && language === SupportedLanguages.Kotlin) {
        const javaMatches = resolveJvmWildcard(rawImportPath, normalizedFileList, allFileList, ['.java'], index);
        if (javaMatches.length > 0) return { kind: 'files', files: javaMatches };
      }
      if (matchedFiles.length > 0) return { kind: 'files', files: matchedFiles };
    } else {
      let memberResolved = resolveJvmMemberImport(rawImportPath, normalizedFileList, allFileList, exts, index);
      if (!memberResolved && language === SupportedLanguages.Kotlin) {
        memberResolved = resolveJvmMemberImport(rawImportPath, normalizedFileList, allFileList, ['.java'], index);
      }
      if (memberResolved) return { kind: 'files', files: [memberResolved] };
    }
  }

  if (language === SupportedLanguages.Go && goModule && rawImportPath.startsWith(goModule.modulePath)) {
    const pkgSuffix = resolveGoPackageDir(rawImportPath, goModule);
    if (pkgSuffix) {
      const pkgFiles = resolveGoPackage(rawImportPath, goModule, normalizedFileList, allFileList);
      if (pkgFiles.length > 0) {
        return { kind: 'package', files: pkgFiles, dirSuffix: pkgSuffix };
      }
    }
  }

  if (language === SupportedLanguages.CSharp && csharpConfigs.length > 0) {
    const resolvedFiles = resolveCSharpImport(rawImportPath, csharpConfigs, normalizedFileList, allFileList, index);
    if (resolvedFiles.length > 1) {
      const dirSuffix = resolveCSharpNamespaceDir(rawImportPath, csharpConfigs);
      if (dirSuffix) {
        return { kind: 'package', files: resolvedFiles, dirSuffix };
      }
    }
    if (resolvedFiles.length > 0) return { kind: 'files', files: resolvedFiles };
    return null;
  }

  if (language === SupportedLanguages.PHP) {
    const resolved = resolvePhpImport(rawImportPath, composerConfig, allFilePaths, normalizedFileList, allFileList, index);
    return resolved ? { kind: 'files', files: [resolved] } : null;
  }

  if (language === SupportedLanguages.Swift && swiftPackageConfig) {
    const targetDir = swiftPackageConfig.targets.get(rawImportPath);
    if (targetDir) {
      const dirPrefix = targetDir + '/';
      const files: string[] = [];
      for (let i = 0; i < normalizedFileList.length; i++) {
        if (normalizedFileList[i].startsWith(dirPrefix) && normalizedFileList[i].endsWith('.swift')) {
          files.push(allFileList[i]);
        }
      }
      if (files.length > 0) return { kind: 'files', files };
    }
    return null;
  }

  if (language === SupportedLanguages.Rust && rawImportPath.startsWith('{') && rawImportPath.endsWith('}')) {
    const inner = rawImportPath.slice(1, -1);
    const parts = inner.split(',').map((part) => part.trim()).filter(Boolean);
    const resolved: string[] = [];
    for (const part of parts) {
      const result = resolveRustImport(filePath, part, allFilePaths);
      if (result) resolved.push(result);
    }
    return resolved.length > 0 ? { kind: 'files', files: resolved } : null;
  }

  const resolvedPath = resolveImportPath(
    filePath,
    rawImportPath,
    allFilePaths,
    allFileList,
    normalizedFileList,
    resolveCache,
    language,
    tsconfigPaths,
    index,
  );

  return resolvedPath ? { kind: 'files', files: [resolvedPath] } : null;
}
