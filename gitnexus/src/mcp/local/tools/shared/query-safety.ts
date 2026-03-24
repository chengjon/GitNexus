/**
 * Quick test-file detection for filtering impact results.
 * Matches common test file patterns across all supported languages.
 */
export function isTestFilePath(filePath: string): boolean {
  const p = filePath.toLowerCase().replace(/\\/g, '/');
  return (
    p.includes('.test.') || p.includes('.spec.') ||
    p.includes('__tests__/') || p.includes('__mocks__/') ||
    p.includes('/test/') || p.includes('/tests/') ||
    p.includes('/testing/') || p.includes('/fixtures/') ||
    p.endsWith('_test.go') || p.endsWith('_test.py') ||
    p.includes('/test_') || p.includes('/conftest.')
  );
}

/** Valid KuzuDB node labels for safe Cypher query construction */
export const VALID_NODE_LABELS = new Set([
  'File', 'Folder', 'Function', 'Class', 'Interface', 'Method', 'CodeElement',
  'Community', 'Process', 'Struct', 'Enum', 'Macro', 'Typedef', 'Union',
  'Namespace', 'Trait', 'Impl', 'TypeAlias', 'Const', 'Static', 'Property',
  'Record', 'Delegate', 'Annotation', 'Constructor', 'Template', 'Module',
]);

/** Valid relation types for impact analysis filtering */
export const VALID_RELATION_TYPES = new Set(['CALLS', 'IMPORTS', 'EXTENDS', 'IMPLEMENTS']);

/** Regex to detect write operations in user-supplied Cypher queries */
export const CYPHER_WRITE_RE = /\b(CREATE|DELETE|SET|MERGE|REMOVE|DROP|ALTER|COPY|DETACH)\b/i;

/** Check if a Cypher query contains write operations */
export function isWriteQuery(query: string): boolean {
  return CYPHER_WRITE_RE.test(query);
}
