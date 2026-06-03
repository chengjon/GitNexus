/**
 * Style Import Extraction
 *
 * Extracts @use, @import, @forward relationships from Sass/SCSS files
 * for the knowledge graph.
 */

const STYLE_IMPORT_RE = /@(?:use|import|forward)\s+['"]([^'"]+)['"]/g;

export interface StyleImport {
  rawSpecifier: string;
  resolvedPath: string;
}

export function isStyleFile(filePath: string): boolean {
  return /\.(scss|sass|less|css)$/i.test(filePath);
}

export function extractStyleImports(content: string, sourcePath: string): StyleImport[] {
  const imports: StyleImport[] = [];
  let match: RegExpExecArray | null;
  STYLE_IMPORT_RE.lastIndex = 0;
  while ((match = STYLE_IMPORT_RE.exec(content)) !== null) {
    const raw = match[1];
    imports.push({
      rawSpecifier: raw,
      resolvedPath: resolveStylePath(raw, sourcePath),
    });
  }
  return imports;
}

function resolveStylePath(specifier: string, sourcePath: string): string {
  let spec = specifier.replace(/^~/, '');
  const dir = sourcePath.includes('/') ? sourcePath.substring(0, sourcePath.lastIndexOf('/')) : '';

  // Add extension if missing
  if (!/\.(scss|sass|less|css)$/i.test(spec)) {
    spec = spec + '.scss';
  }

  // Try underscore-prefixed partial first (Sass convention)
  const partial = spec.replace(/\/([^/]+)$/, '/_$1');

  const resolved = dir ? dir + '/' + spec : spec;
  return resolved.replace(/\\/g, '/');
}
