/**
 * Normalize a filesystem path for Kuzu COPY statements.
 *
 * Kuzu COPY accepts quoted file paths, but Windows backslashes are interpreted
 * poorly inside the query string. Converting to forward slashes keeps the path
 * portable across platforms without changing the resolved location.
 */
export const normalizeKuzuCopyPath = (filePath: string): string => filePath.replace(/\\/g, '/');
