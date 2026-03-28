import JavaScript from 'tree-sitter-javascript';
import TypeScript from 'tree-sitter-typescript';
import Python from 'tree-sitter-python';
import Java from 'tree-sitter-java';
import C from 'tree-sitter-c';
import CPP from 'tree-sitter-cpp';
import CSharp from 'tree-sitter-c-sharp';
import Go from 'tree-sitter-go';
import Rust from 'tree-sitter-rust';
import PHP from 'tree-sitter-php';
import { createRequire } from 'node:module';
import { SupportedLanguages } from '../../config/supported-languages.js';

export interface LanguageSupportSummaryEntry {
  language: SupportedLanguages;
  tier: 'builtin' | 'optional';
  status: 'available' | 'unavailable';
  source: string;
  detail: string;
}

export type OptionalLanguageLoader = (moduleName: string) => unknown;

const requireOptional = createRequire(import.meta.url);

const defaultOptionalLanguageLoader: OptionalLanguageLoader = (moduleName) => requireOptional(moduleName);

const unwrapLanguageModule = (moduleValue: unknown): unknown => {
  if (moduleValue && typeof moduleValue === 'object' && 'default' in moduleValue) {
    return (moduleValue as { default: unknown }).default;
  }

  return moduleValue;
};

const isOptionalLanguageUnavailableError = (error: unknown): boolean => {
  if (error && typeof error === 'object') {
    const code = (error as { code?: string }).code;
    if (code === 'MODULE_NOT_FOUND' || code === 'ERR_MODULE_NOT_FOUND') {
      return true;
    }
  }

  const message = error instanceof Error ? error.message : String(error ?? '');

  return message.includes('Cannot find module')
    || message.includes('No native build was found')
    || message.includes('Could not locate the bindings file');
};

const loadOptionalLanguage = (
  moduleName: string,
  loadOptionalLanguageModule: OptionalLanguageLoader,
): unknown | null => {
  try {
    return unwrapLanguageModule(loadOptionalLanguageModule(moduleName));
  } catch (error) {
    if (isOptionalLanguageUnavailableError(error)) {
      return null;
    }

    throw error;
  }
};

export const getOptionalLanguageSupportSummary = (
  loadOptionalLanguageModule: OptionalLanguageLoader = defaultOptionalLanguageLoader,
): LanguageSupportSummaryEntry[] => {
  const builtInLanguages: Array<{ language: SupportedLanguages; source: string }> = [
    { language: SupportedLanguages.JavaScript, source: 'bundled' },
    { language: SupportedLanguages.TypeScript, source: 'bundled' },
    { language: SupportedLanguages.Python, source: 'bundled' },
    { language: SupportedLanguages.Java, source: 'bundled' },
    { language: SupportedLanguages.C, source: 'bundled' },
    { language: SupportedLanguages.CPlusPlus, source: 'bundled' },
    { language: SupportedLanguages.CSharp, source: 'bundled' },
    { language: SupportedLanguages.Go, source: 'bundled' },
    { language: SupportedLanguages.Rust, source: 'bundled' },
    { language: SupportedLanguages.PHP, source: 'bundled' },
  ];
  const optionalLanguages: Array<{ language: SupportedLanguages; moduleName: string }> = [
    { language: SupportedLanguages.Kotlin, moduleName: 'tree-sitter-kotlin' },
    { language: SupportedLanguages.Swift, moduleName: 'tree-sitter-swift' },
  ];

  return [
    ...builtInLanguages.map(({ language, source }) => ({
      language,
      tier: 'builtin' as const,
      status: 'available' as const,
      source,
      detail: 'bundled',
    })),
    ...optionalLanguages.map(({ language, moduleName }) => {
      try {
        const loaded = unwrapLanguageModule(loadOptionalLanguageModule(moduleName));
        return {
          language,
          tier: 'optional' as const,
          status: loaded ? 'available' as const : 'unavailable' as const,
          source: moduleName,
          detail: loaded ? 'loaded' : 'unavailable',
        };
      } catch (error) {
        if (isOptionalLanguageUnavailableError(error)) {
          return {
            language,
            tier: 'optional' as const,
            status: 'unavailable' as const,
            source: moduleName,
            detail: error instanceof Error ? error.message : String(error),
          };
        }

        throw error;
      }
    }),
  ];
};

export const createLanguageMap = (
  loadOptionalLanguageModule: OptionalLanguageLoader = defaultOptionalLanguageLoader,
): Record<string, any> => {
  const kotlin = loadOptionalLanguage('tree-sitter-kotlin', loadOptionalLanguageModule);
  const swift = loadOptionalLanguage('tree-sitter-swift', loadOptionalLanguageModule);

  return {
    [SupportedLanguages.JavaScript]: JavaScript,
    [SupportedLanguages.TypeScript]: TypeScript.typescript,
    [`${SupportedLanguages.TypeScript}:tsx`]: TypeScript.tsx,
    [SupportedLanguages.Python]: Python,
    [SupportedLanguages.Java]: Java,
    [SupportedLanguages.C]: C,
    [SupportedLanguages.CPlusPlus]: CPP,
    [SupportedLanguages.CSharp]: CSharp,
    [SupportedLanguages.Go]: Go,
    [SupportedLanguages.Rust]: Rust,
    [SupportedLanguages.PHP]: PHP.php_only,
    ...(kotlin ? { [SupportedLanguages.Kotlin]: kotlin } : {}),
    ...(swift ? { [SupportedLanguages.Swift]: swift } : {}),
  };
};

export const resolveLanguageKey = (
  language: SupportedLanguages,
  filePath?: string,
): string => {
  if (language === SupportedLanguages.TypeScript && filePath?.endsWith('.tsx')) {
    return `${language}:tsx`;
  }

  return language;
};
