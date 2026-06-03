/**
 * Phase: styleImports
 *
 * Extracts Sass/CSS import relationships (@use, @import, @forward) from
 * style files and adds STYLE_IMPORTS edges to the knowledge graph.
 */

import fs from 'fs/promises';
import path from 'path';
import type { PipelinePhase, PipelineContext } from './types.js';
import type { ScanOutput } from './scan.js';
import { extractStyleImports, isStyleFile } from '../style-imports.js';

export interface StyleImportsOutput {
  edgesAdded: number;
  styleFilesProcessed: number;
}

export const styleImportsPhase: PipelinePhase<StyleImportsOutput> = {
  name: 'styleImports',
  deps: ['crossFile'],

  async execute(ctx: PipelineContext): Promise<StyleImportsOutput> {
    const deps = (ctx as any).__phaseResults as Map<string, any>;
    const scanOutput = deps?.get('scan') as ScanOutput | undefined;
    const scannedFiles = scanOutput?.scannedFiles ?? [];
    const styleFiles = scannedFiles.filter((f: { path: string }) => isStyleFile(f.path));

    if (styleFiles.length === 0) {
      return { edgesAdded: 0, styleFilesProcessed: 0 };
    }

    let edgesAdded = 0;
    const allPaths = new Set(scannedFiles.map((f: { path: string }) => f.path));

    for (const file of styleFiles) {
      const fullPath = path.join(ctx.repoPath, file.path);
      let content: string;
      try {
        content = await fs.readFile(fullPath, 'utf-8');
      } catch {
        continue;
      }

      const imports = extractStyleImports(content, file.path);
      for (const imp of imports) {
        if (allPaths.has(imp.resolvedPath)) {
          ctx.graph.addRelationship({
            id: `style-import:${file.path}->${imp.resolvedPath}`,
            sourceId: `file:${file.path}`,
            targetId: `file:${imp.resolvedPath}`,
            type: 'STYLE_IMPORTS',
            confidence: 1.0,
            reason: `style import: ${imp.rawSpecifier}`,
          });
          edgesAdded++;
        }
      }
    }

    return { edgesAdded, styleFilesProcessed: styleFiles.length };
  },
};
