import { createRequire } from 'node:module';

const requireOptional = createRequire(import.meta.url);

const optionalGrammarUnavailable = (error: unknown): boolean => {
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

export const loadOptionalGrammar = (moduleName: string): any | null => {
  try {
    return requireOptional(moduleName);
  } catch (error) {
    if (optionalGrammarUnavailable(error)) {
      return null;
    }

    throw error;
  }
};
