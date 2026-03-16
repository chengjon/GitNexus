import Parser from 'tree-sitter';
import { SupportedLanguages } from '../../config/supported-languages.js';
import { createLanguageMap, resolveLanguageKey } from './language-registry.js';

let parser: Parser | null = null;

const languageMap: Record<string, any> = createLanguageMap();

export const isLanguageAvailable = (language: SupportedLanguages): boolean =>
  language in languageMap;

export const loadParser = async (): Promise<Parser> => {
  if (parser) return parser;
  parser = new Parser();
  return parser;
};

export const loadLanguage = async (language: SupportedLanguages, filePath?: string): Promise<void> => {
  if (!parser) await loadParser();
  const key = resolveLanguageKey(language, filePath);

  const lang = languageMap[key];
  if (!lang) {
    throw new Error(`Unsupported language: ${language}`);
  }
  parser!.setLanguage(lang);
};
