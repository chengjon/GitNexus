/**
 * Phase: scan
 *
 * Walks the repository filesystem and collects file paths + sizes.
 * Does NOT read file contents — that happens in downstream phases.
 *
 * @deps    (none — this is the pipeline root)
 * @reads   repoPath (filesystem)
 * @writes  graph (nothing yet — just returns scanned paths)
 * @output  ScannedFile[], allPaths[], totalFiles
 */

import type { PipelinePhase, PipelineContext } from './types.js';
import { walkRepositoryPaths } from '../filesystem-walker.js';

export interface ScanOutput {
  scannedFiles: { path: string; size: number }[];
  allPaths: string[];
  totalFiles: number;
}

export const scanPhase: PipelinePhase<ScanOutput> = {
  name: 'scan',
  deps: [],

  async execute(ctx: PipelineContext): Promise<ScanOutput> {
    ctx.onProgress({
      phase: 'extracting',
      percent: 0,
      message: 'Scanning repository...',
    });

    const scannedFiles = await walkRepositoryPaths(ctx.repoPath, (current, total, filePath) => {
      const scanProgress = Math.round((current / total) * 15);
      ctx.onProgress({
        phase: 'extracting',
        percent: scanProgress,
        message: 'Scanning repository...',
        detail: filePath,
        stats: {
          filesProcessed: current,
          totalFiles: total,
          nodesCreated: ctx.graph.nodeCount,
        },
      });
    });

    // Apply file filter for --staged-only / --changed-only / --files modes
    const fileFilter = (ctx.options as any)?.fileFilter as ReadonlySet<string> | undefined;
    const filteredFiles =
      fileFilter && fileFilter.size > 0
        ? scannedFiles.filter((f) => fileFilter.has(f.path))
        : scannedFiles;

    const totalFiles = filteredFiles.length;
    const allPaths = filteredFiles.map((f) => f.path);

    ctx.onProgress({
      phase: 'extracting',
      percent: 15,
      message: 'Repository scanned successfully',
      stats: { filesProcessed: totalFiles, totalFiles, nodesCreated: ctx.graph.nodeCount },
    });

    return { scannedFiles: filteredFiles, allPaths, totalFiles };
  },
};
