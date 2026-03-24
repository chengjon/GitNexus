import fs from 'fs/promises';
import path from 'path';
import type { ToolContext } from '../tool-context.js';
import { runContextTool } from './context-handler.js';

export interface RenameToolParams {
  symbol_name?: string;
  symbol_uid?: string;
  new_name: string;
  file_path?: string;
  dry_run?: boolean;
}

/**
 * Rename tool — multi-file coordinated rename using graph + text search.
 * Graph refs are tagged "graph" (high confidence).
 * Additional refs found via text search are tagged "text_search" (lower confidence).
 */
export async function runRenameTool(ctx: ToolContext, params: RenameToolParams): Promise<any> {
  await ctx.runtime.ensureInitialized(ctx.repo.id);

  const repo = ctx.repo;
  const { new_name, file_path } = params;
  const dry_run = params.dry_run ?? true;

  if (!params.symbol_name && !params.symbol_uid) {
    return { error: 'Either symbol_name or symbol_uid is required.' };
  }

  /** Guard: ensure a file path resolves within the repo root (prevents path traversal) */
  const assertSafePath = (filePath: string): string => {
    const full = path.resolve(repo.repoPath, filePath);
    if (!full.startsWith(repo.repoPath + path.sep) && full !== repo.repoPath) {
      throw new Error(`Path traversal blocked: ${filePath}`);
    }
    return full;
  };
  const getTraversalMessage = (error: unknown): string | null => {
    const message = error instanceof Error ? error.message : String(error);
    return message.startsWith('Path traversal blocked:') ? message : null;
  };

  // Step 1: Find the target symbol (reuse context's lookup)
  const lookupResult = await runContextTool(ctx, {
    name: params.symbol_name,
    uid: params.symbol_uid,
    file_path,
  });

  if (lookupResult.status === 'ambiguous') {
    return lookupResult; // pass disambiguation through
  }
  if (lookupResult.error) {
    return lookupResult;
  }

  const sym = lookupResult.symbol;
  const oldName = sym.name;
  const escapedOldName = oldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const oldNameWordPattern = `\\b${escapedOldName}\\b`;
  const normalizeRelativePath = (filePath: string): string =>
    filePath.replace(/\\/g, '/').replace(/^\.\//, '');
  const replaceOnTargetLine = (line: string): string =>
    line.replace(new RegExp(oldNameWordPattern, 'g'), new_name);
  const hasTargetName = (line: string): boolean =>
    new RegExp(oldNameWordPattern).test(line);

  if (oldName === new_name) {
    return { error: 'New name is the same as the current name.' };
  }

  // Step 2: Collect edits from graph context.
  // Only exact symbol-line hits keep high-confidence "graph".
  // Broader same-file matches are downgraded to lower-confidence "text_search".
  const changes = new Map<string, { file_path: string; edits: any[] }>();
  const warnings: string[] = [];
  let textSearchSkipped = false;

  const addEdit = (filePath: string, line: number, oldText: string, newText: string, confidence: string) => {
    if (!changes.has(filePath)) {
      changes.set(filePath, { file_path: filePath, edits: [] });
    }
    changes.get(filePath)!.edits.push({ line, old_text: oldText, new_text: newText, confidence });
  };

  // All incoming refs from graph (callers, importers, etc.)
  const allIncoming = [
    ...(lookupResult.incoming.calls || []),
    ...(lookupResult.incoming.imports || []),
    ...(lookupResult.incoming.extends || []),
    ...(lookupResult.incoming.implements || []),
  ];

  const pathsToValidate = [
    sym.filePath,
    ...allIncoming.map((r) => r.filePath),
  ].filter((filePath): filePath is string => typeof filePath === 'string' && filePath.length > 0);

  for (const filePath of pathsToValidate) {
    try {
      assertSafePath(filePath);
    } catch (e) {
      const traversalMessage = getTraversalMessage(e);
      if (traversalMessage) {
        return { error: traversalMessage };
      }
      ctx.logQueryError('rename:path-validation', e);
      return { error: 'Failed to validate file paths before rename.' };
    }
  }

  const graphFilesToScan = new Set<string>(
    [sym.filePath, ...allIncoming.map((r) => r.filePath)].filter(
      (filePath): filePath is string => typeof filePath === 'string' && filePath.length > 0,
    ),
  );
  const graphFiles = new Set(Array.from(graphFilesToScan).map(normalizeRelativePath));
  const graphHighConfidenceLines = new Map<string, Set<number>>();
  const markHighConfidenceLine = (filePath: string | undefined, line: unknown): void => {
    if (!filePath || typeof line !== 'number' || !Number.isInteger(line) || line <= 0) return;
    const normalizedFile = normalizeRelativePath(filePath);
    if (!graphHighConfidenceLines.has(normalizedFile)) {
      graphHighConfidenceLines.set(normalizedFile, new Set<number>());
    }
    graphHighConfidenceLines.get(normalizedFile)!.add(line);
  };
  markHighConfidenceLine(sym.filePath, sym.startLine);
  for (const incomingRef of allIncoming) {
    markHighConfidenceLine(incomingRef.filePath, incomingRef.startLine);
  }
  let graphEdits = 0;
  let astSearchEdits = 0;

  for (const filePath of graphFilesToScan) {
    try {
      const content = await fs.readFile(assertSafePath(filePath), 'utf-8');
      const lines = content.split('\n');
      const normalizedFile = normalizeRelativePath(filePath);
      const highConfidenceLines = graphHighConfidenceLines.get(normalizedFile);
      for (let i = 0; i < lines.length; i++) {
        if (hasTargetName(lines[i])) {
          const lineNumber = i + 1;
          const confidence = highConfidenceLines?.has(lineNumber) ? 'graph' : 'text_search';
          addEdit(filePath, lineNumber, lines[i].trim(), replaceOnTargetLine(lines[i]).trim(), confidence);
          if (confidence === 'graph') {
            graphEdits++;
          } else {
            astSearchEdits++;
          }
        }
      }
    } catch (e) {
      const traversalMessage = getTraversalMessage(e);
      if (traversalMessage) {
        return { error: traversalMessage };
      }
      ctx.logQueryError('rename:read-ref', e);
    }
  }

  // Step 3: Text search for refs the graph might have missed

  // Simple text search across the repo for the old name (in files not already covered by graph)
  try {
    const { execFileSync } = await import('child_process');
    const rgArgs = [
      '-l',
      '--type-add', 'code:*.{ts,tsx,js,jsx,py,go,rs,java,c,h,cpp,cc,cxx,hpp,hxx,hh,cs,php,swift}',
      '-t', 'code',
      '--',
      oldNameWordPattern,
      '.',
    ];
    const output = execFileSync('rg', rgArgs, { cwd: repo.repoPath, encoding: 'utf-8', timeout: 5000 });
    const files = output.trim().split('\n').filter(f => f.length > 0);

    for (const file of files) {
      const normalizedFile = normalizeRelativePath(file);
      if (graphFiles.has(normalizedFile)) continue; // already covered by graph

      try {
        const content = await fs.readFile(assertSafePath(normalizedFile), 'utf-8');
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (hasTargetName(lines[i])) {
            addEdit(normalizedFile, i + 1, lines[i].trim(), replaceOnTargetLine(lines[i]).trim(), 'text_search');
            astSearchEdits++;
          }
        }
      } catch (e) {
        const traversalMessage = getTraversalMessage(e);
        if (traversalMessage) {
          return { error: traversalMessage };
        }
        ctx.logQueryError('rename:text-search-read', e);
      }
    }
  } catch (e: any) {
    // rg exits with code 1 when no files match; treat that as successful empty coverage.
    if (typeof e?.status !== 'number' || e.status !== 1) {
      textSearchSkipped = true;
      const message = e instanceof Error ? e.message : String(e);
      warnings.push(`Text-search coverage skipped because ripgrep failed: ${message}`);
      ctx.logQueryError('rename:ripgrep', e);
    }
  }

  // Step 4: Apply or preview
  const allChanges = Array.from(changes.values());
  const totalEdits = allChanges.reduce((sum, c) => sum + c.edits.length, 0);

  if (!dry_run) {
    // Apply edits to files
    for (const change of allChanges) {
      try {
        const fullPath = assertSafePath(change.file_path);
        const content = await fs.readFile(fullPath, 'utf-8');
        const lines = content.split('\n');

        for (const edit of change.edits) {
          const lineIdx = edit.line - 1;
          if (lineIdx < 0 || lineIdx >= lines.length) continue;
          lines[lineIdx] = replaceOnTargetLine(lines[lineIdx]);
        }

        await fs.writeFile(fullPath, lines.join('\n'), 'utf-8');
      } catch (e) {
        const traversalMessage = getTraversalMessage(e);
        if (traversalMessage) {
          return { error: traversalMessage };
        }
        ctx.logQueryError('rename:apply-edit', e);
      }
    }
  }

  return {
    status: 'success',
    old_name: oldName,
    new_name,
    files_affected: allChanges.length,
    total_edits: totalEdits,
    graph_edits: graphEdits,
    text_search_edits: astSearchEdits,
    ...(textSearchSkipped ? { text_search_skipped: true, warnings } : {}),
    changes: allChanges,
    applied: !dry_run,
  };
}
